import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Board } from '../../boards/entities/board.entity';

@Entity('columns')
@Index(['boardId', 'position'])
export class KanbanColumn {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 120 }) name!: string;
  @Column({ type: 'integer' }) position!: number;
  @Column({ name: 'board_id', type: 'uuid' }) boardId!: string;
  @ManyToOne(() => Board, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'board_id' }) board!: Board;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
