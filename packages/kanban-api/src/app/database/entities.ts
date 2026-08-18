import { Exclude } from 'class-transformer';
import { Column as DbColumn, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @DbColumn({ length: 120 }) name!: string;
  @Index({ unique: true }) @DbColumn({ length: 320 }) email!: string;
  @Exclude() @DbColumn({ name: 'password_hash' }) passwordHash!: string;
  @OneToMany(() => Board, (board) => board.user) boards!: Board[];
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}

@Entity('boards')
@Index(['userId'])
export class Board {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @DbColumn({ length: 160 }) name!: string;
  @DbColumn({ type: 'text', nullable: true }) description!: string | null;
  @DbColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @ManyToOne(() => User, (user) => user.boards, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user!: User;
  @OneToMany(() => KanbanColumn, (column) => column.board) columns!: KanbanColumn[];
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}

@Entity('columns')
@Index(['boardId', 'position'])
export class KanbanColumn {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @DbColumn({ length: 120 }) name!: string;
  @DbColumn({ type: 'integer' }) position!: number;
  @DbColumn({ name: 'board_id', type: 'uuid' }) boardId!: string;
  @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'board_id' }) board!: Board;
  @OneToMany(() => Task, (task) => task.column) tasks!: Task[];
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}

@Entity('tasks')
@Index(['columnId', 'position'])
export class Task {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @DbColumn({ length: 200 }) title!: string;
  @DbColumn({ type: 'text', nullable: true }) description!: string | null;
  @DbColumn({ type: 'integer' }) position!: number;
  @DbColumn({ name: 'column_id', type: 'uuid' }) columnId!: string;
  @ManyToOne(() => KanbanColumn, (column) => column.tasks, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'column_id' }) column!: KanbanColumn;
  @OneToMany(() => Attachment, (attachment) => attachment.task) attachments!: Attachment[];
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}

@Entity('attachments')
@Index(['taskId'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @DbColumn({ name: 'original_name', length: 255 }) originalName!: string;
  @Exclude() @Index({ unique: true }) @DbColumn({ name: 'storage_key' }) storageKey!: string;
  @DbColumn({ name: 'mime_type', length: 100 }) mimeType!: string;
  @DbColumn({ type: 'bigint', transformer: { to: (v: number) => v, from: (v: string) => Number(v) } }) size!: number;
  @DbColumn({ name: 'task_id', type: 'uuid' }) taskId!: string;
  @DbColumn({ name: 'uploader_id', type: 'uuid' }) uploaderId!: string;
  @ManyToOne(() => Task, (task) => task.attachments, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'task_id' }) task!: Task;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}

export const ENTITIES = [User, Board, KanbanColumn, Task, Attachment];
