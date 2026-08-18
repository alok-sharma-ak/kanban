import { Injectable } from '@nestjs/common';
import { RedisService } from '../infrastructure/redis.service';

@Injectable()
export class BoardsCacheService {
  constructor(private readonly redis: RedisService) {}

  async listKey(userId: string): Promise<string> {
    return `boards:${userId}:v${await this.redis.cacheVersion(userId)}`;
  }

  async detailKey(userId: string, boardId: string): Promise<string> {
    return `board:${userId}:${boardId}:v${await this.redis.cacheVersion(userId)}`;
  }

  get<T>(key: string): Promise<T | null> {
    return this.redis.getJson<T>(key);
  }

  set(key: string, value: unknown): Promise<void> {
    return this.redis.setJson(key, value);
  }

  async invalidate(userId: string, boardId: string): Promise<void> {
    await this.redis.bumpCacheVersion(userId);
    await this.redis.del(`boards:${userId}`, `board:${userId}:${boardId}`);
  }
}
