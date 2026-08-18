import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;
  constructor(private readonly config: ConfigService) {
    this.client = new Redis(config.getOrThrow('REDIS_URL'), { lazyConnect: true, maxRetriesPerRequest: 1 });
    this.client.on('error', (error) => this.logger.warn(`Redis unavailable: ${error.message}`));
    void this.client.connect().catch(() => undefined);
  }
  async getJson<T>(key: string): Promise<T | null> {
    try { const value = await this.client.get(key); return value ? JSON.parse(value) as T : null; } catch { return null; }
  }
  async setJson(key: string, value: unknown): Promise<void> {
    try { await this.client.set(key, JSON.stringify(value), 'EX', Number(this.config.get('CACHE_TTL_SECONDS', 60))); } catch { /* cache is best effort */ }
  }
  async del(...keys: string[]): Promise<void> { try { if (keys.length) await this.client.del(...keys); } catch { /* best effort */ } }
  async rateLimit(key: string): Promise<{ allowed: boolean; retryAfter: number }> {
    try {
      const window = Number(this.config.get('AUTH_RATE_WINDOW_SECONDS', 60));
      const limit = Number(this.config.get('AUTH_RATE_LIMIT', 10));
      const count = await this.client.incr(key);
      if (count === 1) await this.client.expire(key, window);
      return { allowed: count <= limit, retryAfter: Math.max(await this.client.ttl(key), 1) };
    } catch { return { allowed: true, retryAfter: 0 }; }
  }
  async onModuleDestroy() { await this.client.quit().catch(() => undefined); }
}
