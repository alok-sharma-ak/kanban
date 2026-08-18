import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;
  constructor(private readonly config: AppConfigService) {
    this.client = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
    this.client.on('error', (error) => this.logger.warn(`Redis unavailable: ${error.message}`));
    void this.client.connect().catch(() => undefined);
  }
  async getJson<T>(key: string): Promise<T | null> {
    try { const value = await this.client.get(key); return value ? JSON.parse(value) as T : null; } catch (error) { this.logger.warn(`Cache read failed: ${String(error)}`); return null; }
  }
  async setJson(key: string, value: unknown): Promise<void> {
    try { await this.client.set(key, JSON.stringify(value), 'EX', this.config.cacheTtlSeconds); } catch (error) { this.logger.warn(`Cache write failed: ${String(error)}`); }
  }
  async del(...keys: string[]): Promise<void> { try { if (keys.length) await this.client.del(...keys); } catch (error) { this.logger.warn(`Cache invalidation failed: ${String(error)}`); } }
  async cacheVersion(userId: string) { try { return Number(await this.client.get(`cache-version:${userId}`) ?? 0); } catch { return 0; } }
  async bumpCacheVersion(userId: string) { try { await this.client.incr(`cache-version:${userId}`); } catch (error) { this.logger.warn(`Cache version bump failed: ${String(error)}`); } }
  async rateLimit(key: string): Promise<{ allowed: boolean; retryAfter: number }> {
    try {
      const window = this.config.authRateWindowSeconds;
      const limit = this.config.authRateLimit;
      const count = await this.client.incr(key);
      if (count === 1) await this.client.expire(key, window);
      return { allowed: count <= limit, retryAfter: Math.max(await this.client.ttl(key), 1) };
    } catch { throw new Error('Rate limit store unavailable'); }
  }
  async createRefreshSession(hash: string, session: { userId: string; familyId: string }, ttl: number) {
    await this.client.multi().set(`refresh:${hash}`, JSON.stringify(session), 'EX', ttl).sadd(`refresh-family:${session.familyId}`, hash).expire(`refresh-family:${session.familyId}`, ttl).set(`refresh-family-owner:${session.familyId}`, session.userId, 'EX', ttl).sadd(`refresh-user:${session.userId}`, session.familyId).expire(`refresh-user:${session.userId}`, ttl).exec();
  }
  async rotateRefreshSession(oldHash: string, newHash: string, ttl: number): Promise<{ status: 'ok' | 'invalid' | 'reused'; session?: { userId: string; familyId: string } }> {
    const script = `local value=redis.call('GET',KEYS[1]); if not value then if redis.call('EXISTS',KEYS[2])==1 then return {'reused'} end return {'invalid'} end; local session=cjson.decode(value); redis.call('DEL',KEYS[1]); redis.call('SET',KEYS[2],session.familyId,'EX',ARGV[1]); redis.call('SREM','refresh-family:'..session.familyId,ARGV[2]); redis.call('SET',KEYS[3],value,'EX',ARGV[1]); redis.call('SADD','refresh-family:'..session.familyId,ARGV[3]); redis.call('EXPIRE','refresh-family:'..session.familyId,ARGV[1]); return {'ok',value}`;
    const result = await this.client.eval(script, 3, `refresh:${oldHash}`, `refresh-used:${oldHash}`, `refresh:${newHash}`, String(ttl), oldHash, newHash) as string[];
    return result[0] === 'ok' ? { status: 'ok', session: JSON.parse(result[1]) } : { status: result[0] as 'invalid' | 'reused' };
  }
  async revokeRefreshToken(hash: string) { const raw = await this.client.get(`refresh:${hash}`); if (!raw) return; const session = JSON.parse(raw) as { familyId: string }; await this.client.multi().del(`refresh:${hash}`).srem(`refresh-family:${session.familyId}`, hash).exec(); }
  async revokeRefreshFamily(familyId: string) { const hashes = await this.client.smembers(`refresh-family:${familyId}`); const owner = await this.client.get(`refresh-family-owner:${familyId}`); const multi = this.client.multi(); for (const hash of hashes) multi.del(`refresh:${hash}`); multi.del(`refresh-family:${familyId}`, `refresh-family-owner:${familyId}`); if (owner) multi.srem(`refresh-user:${owner}`, familyId); await multi.exec(); }
  async revokeUserSessions(userId: string) { const families = await this.client.smembers(`refresh-user:${userId}`); for (const family of families) await this.revokeRefreshFamily(family); await this.client.del(`refresh-user:${userId}`); }
  async onModuleDestroy() { await this.client.quit().catch(() => undefined); }
}
