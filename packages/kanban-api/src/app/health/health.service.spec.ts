import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OutboxService } from '../infrastructure/outbox.service';
import { RedisService } from '../infrastructure/redis.service';
import { StorageService } from '../infrastructure/storage.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let postgres: { query: jest.Mock };
  let redis: { client: { ping: jest.Mock } };
  let storage: { ready: jest.Mock };
  let outbox: { isRunning: jest.Mock };
  let service: HealthService;

  beforeEach(() => {
    postgres = { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    redis = { client: { ping: jest.fn().mockResolvedValue('PONG') } };
    storage = { ready: jest.fn().mockResolvedValue(undefined) };
    outbox = { isRunning: jest.fn().mockReturnValue(true) };
    service = new HealthService(
      postgres as unknown as DataSource,
      redis as unknown as RedisService,
      storage as unknown as StorageService,
      outbox as unknown as OutboxService,
    );
  });

  it('reports liveness without calling external dependencies', () => {
    expect(service.live()).toEqual({ status: 'ok', checks: { api: 'up' } });
    expect(postgres.query).not.toHaveBeenCalled();
    expect(redis.client.ping).not.toHaveBeenCalled();
    expect(storage.ready).not.toHaveBeenCalled();
  });

  it('reports every required dependency when ready', async () => {
    await expect(service.ready()).resolves.toEqual({
      status: 'ok',
      checks: { api: 'up', postgres: 'up', redis: 'up', minio: 'up', outbox: 'up' },
    });
  });

  it.each([
    ['postgres', () => postgres.query.mockRejectedValue(new Error('postgres unavailable'))],
    ['redis', () => redis.client.ping.mockRejectedValue(new Error('redis unavailable'))],
    ['minio', () => storage.ready.mockRejectedValue(new Error('minio unavailable'))],
    ['outbox', () => outbox.isRunning.mockReturnValue(false)],
  ])('fails readiness with dependency context when %s is down', async (dependency, fail) => {
    fail();
    try {
      await service.ready();
      throw new Error('Expected readiness failure');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      const response = (error as ServiceUnavailableException).getResponse() as { checks: Record<string, string> };
      expect(response.checks[dependency]).toBe('down');
      expect(response.checks.api).toBe('up');
    }
  });
});
