import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OutboxService } from '../infrastructure/outbox.service';
import { RedisService } from '../infrastructure/redis.service';
import { StorageService } from '../infrastructure/storage.service';
import { DependencyStatus, LivenessResponseDto, ReadinessChecksDto, ReadinessResponseDto } from './dto/health-response.dto';
import { HEALTH_CHECK_TIMEOUT_MS } from './health.constants';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
    private readonly outbox: OutboxService,
  ) {}

  live(): LivenessResponseDto {
    return { status: 'ok', checks: { api: 'up' } };
  }

  async ready(): Promise<ReadinessResponseDto> {
    const [postgres, redis, minio] = await Promise.all([
      this.check(() => this.dataSource.query('SELECT 1')),
      this.check(() => this.redis.client.ping()),
      this.check(() => this.storage.ready()),
    ]);
    const checks: ReadinessChecksDto = {
      api: 'up', postgres, redis, minio, outbox: this.outbox.isRunning() ? 'up' : 'down',
    };

    if (Object.values(checks).includes('down')) {
      throw new ServiceUnavailableException({ message: 'One or more dependencies are unavailable', checks });
    }
    return { status: 'ok', checks };
  }

  private async check(operation: () => Promise<unknown>): Promise<DependencyStatus> {
    let timeout: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Health check timed out')), HEALTH_CHECK_TIMEOUT_MS);
          timeout.unref();
        }),
      ]);
      return 'up';
    } catch {
      return 'down';
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
