import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { BoardRole } from '../../common/roles';
import { User } from '../../users/entities/user.entity';
import { Board } from './board.entity';

@Entity('board_members')
@Unique('UQ_board_members_board_user', ['boardId', 'userId'])
@Index(['userId', 'role'])
export class BoardMember {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'board_id', type: 'uuid' }) boardId!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ type: 'enum', enum: [BoardRole.ADMIN, BoardRole.MEMBER, BoardRole.VIEWER], enumName: 'board_member_role_enum' })
  role!: BoardRole.ADMIN | BoardRole.MEMBER | BoardRole.VIEWER;
  @ManyToOne(() => Board, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'board_id' }) board!: Board;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user!: User;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
