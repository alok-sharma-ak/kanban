import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { StorageCleanupJob } from '../database/entities';
import { StorageService } from './storage.service';

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  constructor(@InjectRepository(StorageCleanupJob) private readonly jobs: Repository<StorageCleanupJob>, private readonly storage: StorageService) {}
  enqueue(manager: EntityManager, keys: string[]) { return keys.length ? manager.save(StorageCleanupJob, keys.map((objectKey) => manager.create(StorageCleanupJob, { objectKey }))) : Promise.resolve([]); }
  onModuleInit() { this.timer = setInterval(() => void this.process(), 5000); this.timer.unref(); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  isRunning() { return Boolean(this.timer); }
  async process(limit = 20) {
    if (this.running) return; this.running = true;
    try {
      await this.jobs.createQueryBuilder().update().set({ status: 'pending', lastError: 'Recovered expired processing lease' }).where(`status = 'processing' AND updated_at < NOW() - INTERVAL '5 minutes'`).execute();
      const due = await this.jobs.find({ where: { status: 'pending', nextAttemptAt: LessThanOrEqual(new Date()) }, order: { createdAt: 'ASC' }, take: limit });
      for (const job of due) {
        const claimed = await this.jobs.createQueryBuilder().update().set({ status: 'processing' }).where('id = :id AND status = :status', { id: job.id, status: 'pending' }).execute();
        if (!claimed.affected) continue;
        try { await this.storage.remove(job.objectKey); await this.jobs.update(job.id, { status: 'completed', completedAt: new Date(), attempts: job.attempts + 1, lastError: null }); }
        catch (error) { const attempts = job.attempts + 1; const failed = attempts >= 10; await this.jobs.update(job.id, { status: failed ? 'failed' : 'pending', attempts, lastError: String(error).slice(0, 2000), nextAttemptAt: new Date(Date.now() + Math.min(3600, 2 ** attempts * 5) * 1000) }); this.logger.error(JSON.stringify({ event: 'storage_cleanup_failed', jobId: job.id, attempts, error: String(error) })); }
      }
    } finally { this.running = false; }
  }
}
