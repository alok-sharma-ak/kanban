import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';

@Entity('attachments')
@Index(['taskId'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'original_name', length: 255 }) originalName!: string;
  @Exclude() @Index({ unique: true }) @Column({ name: 'storage_key' }) storageKey!: string;
  @Column({ name: 'mime_type', length: 100 }) mimeType!: string;
  @Column({ type: 'bigint', transformer: { to: (value: number) => value, from: (value: string) => Number(value) } }) size!: number;
  @Column({ name: 'task_id', type: 'uuid' }) taskId!: string;
  @Column({ name: 'uploader_id', type: 'uuid' }) uploaderId!: string;
  @ManyToOne(() => Task, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'task_id' }) task!: Task;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
