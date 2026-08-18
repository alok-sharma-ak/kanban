import { Column as DbColumn, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Board } from '../boards/entities/board.entity';
import { KanbanColumn } from '../columns/entities/column.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';

export { User } from '../users/entities/user.entity';
export { Board } from '../boards/entities/board.entity';
export { KanbanColumn } from '../columns/entities/column.entity';
export { Task } from '../tasks/entities/task.entity';
export { Attachment } from '../attachments/entities/attachment.entity';

@Entity('storage_cleanup_jobs')
@Index(['status', 'nextAttemptAt'])
export class StorageCleanupJob {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @DbColumn({ name: 'object_key' }) objectKey!: string;
  @DbColumn({ length: 20, default: 'pending' }) status!: 'pending' | 'processing' | 'completed' | 'failed';
  @DbColumn({ type: 'integer', default: 0 }) attempts!: number;
  @DbColumn({ name: 'next_attempt_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }) nextAttemptAt!: Date;
  @DbColumn({ name: 'last_error', type: 'text', nullable: true }) lastError!: string | null;
  @DbColumn({ name: 'completed_at', type: 'timestamptz', nullable: true }) completedAt!: Date | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}

export const ENTITIES = [User, Board, KanbanColumn, Task, Attachment, StorageCleanupJob];
