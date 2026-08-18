import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { KanbanColumn } from '../columns/entities/column.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { OutboxService } from '../infrastructure/outbox.service';
import { BoardsCacheService } from './boards-cache.service';
import { BoardDetailResponseDto, BoardResponseDto } from './dto/board-response.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Board } from './entities/board.entity';
import { toBoardDetailResponse, toBoardResponse } from './mappers/board-response.mapper';
import { BoardMember } from './entities/board-member.entity';
import { BoardAccessService } from './board-access.service';
import { BOARD_EDIT_ROLES, BoardRole } from '../common/roles';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board) private readonly boards: Repository<Board>,
    @InjectRepository(BoardMember) private readonly members: Repository<BoardMember>,
    private readonly dataSource: DataSource,
    private readonly cache: BoardsCacheService,
    private readonly outbox: OutboxService,
    private readonly access: BoardAccessService,
  ) {}

  async owned(boardId: string, userId: string): Promise<Board> {
    return (await this.access.get(boardId, userId)).board;
  }

  invalidate(_userId: string, boardId: string): Promise<void> {
    return this.cache.invalidateBoard(boardId);
  }

  async create(userId: string, dto: CreateBoardDto): Promise<BoardDetailResponseDto> {
    const board = await this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(manager.create(Board, {
        name: dto.name.trim(), description: dto.description?.trim() || null, userId,
      }));
      await manager.save(KanbanColumn, ['Todo', 'In Progress', 'Done'].map((name, index) =>
        manager.create(KanbanColumn, { name, position: index + 1, boardId: saved.id }),
      ));
      return saved;
    });
    await this.cache.invalidateBoard(board.id);
    await this.cache.invalidateLists([userId]);
    return this.detail(board.id, userId);
  }

  async list(userId: string): Promise<BoardResponseDto[]> {
    const key = await this.cache.listKey(userId);
    const cached = await this.cache.get<BoardResponseDto[]>(key);
    if (cached) {
      const authorized = await Promise.all(cached.map(async (board) => {
        try {
          const { role } = await this.access.get(board.id, userId);
          return { ...board, role };
        } catch (error) {
          if (error instanceof NotFoundException) return null;
          throw error;
        }
      }));
      return authorized.filter((board): board is BoardResponseDto => board !== null);
    }
    const owned = await this.boards.find({ where: { userId } });
    const memberships = await this.members.find({ where: { userId }, relations: { board: true } });
    const response = [
      ...owned.map((board) => toBoardResponse(board, BoardRole.OWNER)),
      ...memberships.map((membership) => toBoardResponse(membership.board, membership.role)),
    ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    await this.cache.set(key, response);
    return response;
  }

  async detail(boardId: string, userId: string): Promise<BoardDetailResponseDto> {
    const { board, role } = await this.access.get(boardId, userId);
    const key = await this.cache.detailKey(userId, boardId);
    const cached = await this.cache.get<BoardDetailResponseDto>(key);
    if (cached) return { ...cached, role };
    const columns = await this.dataSource.getRepository(KanbanColumn).find({ where: { boardId }, order: { position: 'ASC' } });
    const tasks = columns.length ? await this.dataSource.getRepository(Task).find({ where: { columnId: In(columns.map(({ id }) => id)) }, order: { position: 'ASC' } }) : [];
    const response = toBoardDetailResponse(board, columns, tasks, role);
    await this.cache.set(key, response);
    return response;
  }

  async update(boardId: string, userId: string, dto: UpdateBoardDto): Promise<BoardResponseDto> {
    const { board, role } = await this.access.require(boardId, userId, BOARD_EDIT_ROLES);
    if (dto.name !== undefined) board.name = dto.name.trim();
    if (dto.description !== undefined) board.description = dto.description.trim() || null;
    const saved = await this.boards.save(board);
    await this.cache.invalidateBoard(boardId);
    await this.cache.invalidateLists(await this.access.userIds(boardId));
    return toBoardResponse(saved, role);
  }

  async remove(boardId: string, userId: string): Promise<void> {
    await this.access.require(boardId, userId, new Set([BoardRole.OWNER]));
    const affectedUsers = await this.access.userIds(boardId);
    await this.dataSource.transaction(async (manager) => {
      const locked = await manager.getRepository(Board).createQueryBuilder('board')
        .setLock('pessimistic_write')
        .where('board.id = :boardId AND board.user_id = :userId', { boardId, userId })
        .getOne();
      if (!locked) throw new NotFoundException('Board not found');
      const attachments = await manager.getRepository(Attachment).createQueryBuilder('attachment')
        .innerJoin(Task, 'task', 'task.id = attachment.task_id')
        .innerJoin(KanbanColumn, 'column', 'column.id = task.column_id')
        .where('column.board_id = :boardId', { boardId })
        .getMany();
      await this.outbox.enqueue(manager, attachments.map(({ storageKey }) => storageKey));
      await manager.delete(Board, { id: boardId, userId });
    });
    await this.cache.invalidateBoard(boardId);
    await this.cache.invalidateLists(affectedUsers);
  }
}
