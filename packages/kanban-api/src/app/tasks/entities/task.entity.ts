import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { KanbanColumn } from '../../columns/entities/column.entity';

@Entity('tasks')
@Index(['columnId', 'position'])
export class Task {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 200 }) title!: string;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ type: 'integer' }) position!: number;
  @Column({ name: 'column_id', type: 'uuid' }) columnId!: string;
  @ManyToOne(() => KanbanColumn, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'column_id' }) column!: KanbanColumn;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
