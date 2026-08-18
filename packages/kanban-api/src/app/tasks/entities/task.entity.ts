import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { KanbanColumn } from '../../columns/entities/column.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
@Index(['columnId', 'position'])
export class Task {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 200 }) title!: string;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ type: 'integer' }) position!: number;
  @Column({ name: 'column_id', type: 'uuid' }) columnId!: string;
  @Column({ name: 'assignee_id', type: 'uuid', nullable: true }) assigneeId!: string | null;
  @ManyToOne(() => KanbanColumn, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'column_id' }) column!: KanbanColumn;
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true }) @JoinColumn({ name: 'assignee_id' }) assignee!: User | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
