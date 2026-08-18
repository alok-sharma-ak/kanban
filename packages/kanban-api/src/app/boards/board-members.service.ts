import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BoardRole } from '../common/roles';
import { isUniqueViolation } from '../common/database-errors';
import { User } from '../users/entities/user.entity';
import { BoardAccessService } from './board-access.service';
import { BoardsCacheService } from './boards-cache.service';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { BoardMemberResponseDto } from './dto/board-member-response.dto';
import { UpdateBoardMemberDto } from './dto/update-board-member.dto';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';

const MANAGE_MEMBERS = new Set([BoardRole.OWNER, BoardRole.ADMIN]);
const OWNER_ONLY = new Set([BoardRole.OWNER]);

@Injectable()
export class BoardMembersService {
  constructor(
    @InjectRepository(BoardMember) private readonly members: Repository<BoardMember>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly access: BoardAccessService,
    private readonly cache: BoardsCacheService,
    private readonly dataSource: DataSource,
  ) {}

  async list(boardId: string, actorId: string): Promise<BoardMemberResponseDto[]> {
    const { board } = await this.access.get(boardId, actorId);
    const owner = await this.users.findOne({ where: { id: board.userId } });
    if (!owner) throw new NotFoundException('Board owner not found');
    const members = await this.members.find({ where: { boardId }, relations: { user: true }, order: { createdAt: 'ASC' } });
    return [
      { userId: owner.id, name: owner.name, email: owner.email, role: BoardRole.OWNER, joinedAt: board.createdAt },
      ...members.map((member) => ({
        userId: member.userId, name: member.user.name, email: member.user.email, role: member.role, joinedAt: member.createdAt,
      })),
    ];
  }

  async add(boardId: string, actorId: string, dto: AddBoardMemberDto): Promise<BoardMemberResponseDto> {
    const actor = await this.access.require(boardId, actorId, MANAGE_MEMBERS);
    if (dto.role === BoardRole.ADMIN && actor.role !== BoardRole.OWNER) throw new ForbiddenException('Only the owner can assign ADMIN');
    const user = await this.users.findOne({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === actor.board.userId) throw new ConflictException('Board owner cannot be added as a member');

    let member: BoardMember;
    try {
      member = await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
          .where('board.id = :boardId', { boardId }).getOneOrFail();
        const currentActor = await this.access.require(boardId, actorId, MANAGE_MEMBERS, manager);
        if (dto.role === BoardRole.ADMIN && currentActor.role !== BoardRole.OWNER) {
          throw new ForbiddenException('Only the owner can assign ADMIN');
        }
        return manager.save(BoardMember, manager.create(BoardMember, { boardId, userId: user.id, role: dto.role }));
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('User is already a board member');
      throw error;
    }
    await this.cache.invalidateBoard(boardId);
    await this.cache.invalidateLists([user.id]);
    return { userId: user.id, name: user.name, email: user.email, role: member.role, joinedAt: member.createdAt };
  }

  async update(boardId: string, targetUserId: string, actorId: string, dto: UpdateBoardMemberDto): Promise<BoardMemberResponseDto> {
    await this.access.require(boardId, actorId, MANAGE_MEMBERS);
    const saved = await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
        .where('board.id = :boardId', { boardId }).getOneOrFail();
      const actor = await this.access.require(boardId, actorId, MANAGE_MEMBERS, manager);
      if (actor.board.userId === targetUserId) throw new ConflictException('Board owner is not a regular member');
      const member = await manager.findOne(BoardMember, { where: { boardId, userId: targetUserId }, relations: { user: true } });
      if (!member) throw new NotFoundException('Board member not found');
      if (actor.role !== BoardRole.OWNER && (member.role === BoardRole.ADMIN || dto.role === BoardRole.ADMIN)) {
        throw new ForbiddenException('Only the owner can manage ADMIN membership');
      }
      if (dto.role === BoardRole.VIEWER) {
        await manager.query(
          'UPDATE tasks SET assignee_id = NULL WHERE assignee_id = $1 AND column_id IN (SELECT id FROM columns WHERE board_id = $2)',
          [targetUserId, boardId],
        );
      }
      member.role = dto.role;
      return manager.save(BoardMember, member);
    });
    await this.cache.invalidateBoard(boardId);
    await this.cache.invalidateLists([targetUserId]);
    const user = await this.users.findOneOrFail({ where: { id: targetUserId } });
    return { userId: saved.userId, name: user.name, email: user.email, role: saved.role, joinedAt: saved.createdAt };
  }

  async remove(boardId: string, targetUserId: string, actorId: string): Promise<void> {
    await this.access.require(boardId, actorId, MANAGE_MEMBERS);
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
        .where('board.id = :boardId', { boardId }).getOneOrFail();
      const actor = await this.access.require(boardId, actorId, MANAGE_MEMBERS, manager);
      if (actor.board.userId === targetUserId) throw new ConflictException('Board owner cannot be removed');
      const member = await manager.findOne(BoardMember, { where: { boardId, userId: targetUserId } });
      if (!member) throw new NotFoundException('Board member not found');
      if (actor.role !== BoardRole.OWNER && member.role === BoardRole.ADMIN) {
        throw new ForbiddenException('Only the owner can remove an ADMIN');
      }
      await manager.query(
        'UPDATE tasks SET assignee_id = NULL WHERE assignee_id = $1 AND column_id IN (SELECT id FROM columns WHERE board_id = $2)',
        [targetUserId, boardId],
      );
      await manager.delete(BoardMember, member.id);
    });
    await this.cache.invalidateBoard(boardId);
    await this.cache.invalidateLists([targetUserId]);
  }

  async transfer(boardId: string, targetUserId: string, actorId: string): Promise<void> {
    await this.access.require(boardId, actorId, OWNER_ONLY);
    await this.dataSource.transaction(async (manager) => {
      const board = await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
        .where('board.id = :boardId', { boardId }).getOneOrFail();
      if (board.userId !== actorId) throw new ForbiddenException('Only the owner can transfer ownership');
      const target = await manager.findOne(BoardMember, { where: { boardId, userId: targetUserId } });
      if (!target || target.role === BoardRole.VIEWER) throw new ConflictException('New owner must be an ADMIN or MEMBER');
      await manager.delete(BoardMember, target.id);
      board.userId = targetUserId;
      await manager.save(Board, board);
      await manager.save(BoardMember, manager.create(BoardMember, { boardId, userId: actorId, role: BoardRole.ADMIN }));
    });
    await this.cache.invalidateBoard(boardId);
    await this.cache.invalidateLists([actorId, targetUserId]);
  }
}
