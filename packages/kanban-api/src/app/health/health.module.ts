import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../common/auth';
import { RedisService } from '../infrastructure/redis.service';
import { StorageService } from '../infrastructure/storage.service';

@ApiTags('health') @Controller('health')
class HealthController {
  constructor(private readonly data: DataSource, private readonly redis: RedisService, private readonly storage: StorageService) {}
  @Public() @Get() async check() {
    const checks: Record<string, string> = { api: 'up' };
    await Promise.all([
      this.data.query('SELECT 1').then(() => checks.postgres = 'up').catch(() => checks.postgres = 'down'),
      this.redis.client.ping().then(() => checks.redis = 'up').catch(() => checks.redis = 'down'),
      this.storage.ready().then(() => checks.minio = 'up').catch(() => checks.minio = 'down'),
    ]);
    if (Object.values(checks).includes('down')) throw new ServiceUnavailableException({ message: 'One or more dependencies are unavailable', checks });
    return { status: 'ok', checks };
  }
}
@Module({ controllers: [HealthController] })
export class HealthModule {}
