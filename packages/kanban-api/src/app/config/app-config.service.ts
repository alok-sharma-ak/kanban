import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}
  get nodeEnv() { return this.config.getOrThrow<string>('NODE_ENV'); }
  get isProduction() { return this.nodeEnv === 'production'; }
  get port() { return this.config.getOrThrow<number>('PORT'); }
  get corsOrigins() { return this.config.getOrThrow<string>('CORS_ORIGIN').split(',').map((v) => v.trim()).filter(Boolean); }
  get databaseUrl() { return this.config.getOrThrow<string>('DATABASE_URL'); }
  get jwtSecret() { return this.config.getOrThrow<string>('JWT_SECRET'); }
  get jwtExpiresIn() { return this.config.getOrThrow<string>('JWT_EXPIRES_IN'); }
  get refreshTtlSeconds() { return this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_SECONDS'); }
  get redisUrl() { return this.config.getOrThrow<string>('REDIS_URL'); }
  get cacheTtlSeconds() { return this.config.getOrThrow<number>('CACHE_TTL_SECONDS'); }
  get authRateLimit() { return this.config.getOrThrow<number>('AUTH_RATE_LIMIT'); }
  get authRateWindowSeconds() { return this.config.getOrThrow<number>('AUTH_RATE_WINDOW_SECONDS'); }
  get minioEndpoint() { return this.config.getOrThrow<string>('MINIO_ENDPOINT'); }
  get minioAccessKey() { return this.config.getOrThrow<string>('MINIO_ACCESS_KEY'); }
  get minioSecretKey() { return this.config.getOrThrow<string>('MINIO_SECRET_KEY'); }
  get minioBucket() { return this.config.getOrThrow<string>('MINIO_BUCKET'); }
  get uploadMaxBytes() { return this.config.getOrThrow<number>('UPLOAD_MAX_BYTES'); }
}
