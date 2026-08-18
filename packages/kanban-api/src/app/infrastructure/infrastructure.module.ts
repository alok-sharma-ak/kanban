import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { StorageService } from './storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageCleanupJob } from '../database/entities';
import { OutboxService } from './outbox.service';

@Global()
@Module({ imports: [TypeOrmModule.forFeature([StorageCleanupJob])], providers: [RedisService, StorageService, OutboxService], exports: [RedisService, StorageService, OutboxService] })
export class InfrastructureModule {}
