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

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board) private readonly boards: Repository<Board>,
    private readonly dataSource: DataSource,
    private readonly cache: BoardsCacheService,
    private readonly outbox: OutboxService,
  ) {}

  async owned(boardId: string, userId: string): Promise<Board> {
    const board = await this.boards.findOne({ where: { id: boardId, userId } });
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  invalidate(userId: string, boardId: string): Promise<void> {
    return this.cache.invalidate(userId, boardId);
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
    await this.invalidate(userId, board.id);
    return this.detail(board.id, userId);
  }

  async list(userId: string): Promise<BoardResponseDto[]> {
    const key = await this.cache.listKey(userId);
    const cached = await this.cache.get<BoardResponseDto[]>(key);
    if (cached) return cached;
    const rows = await this.boards.find({ where: { userId }, order: { createdAt: 'DESC' } });
    const response = rows.map(toBoardResponse);
    await this.cache.set(key, response);
    return response;
  }

  async detail(boardId: string, userId: string): Promise<BoardDetailResponseDto> {
    const key = await this.cache.detailKey(userId, boardId);
    const cached = await this.cache.get<BoardDetailResponseDto>(key);
    if (cached) return cached;
    const board = await this.owned(boardId, userId);
    const columns = await this.dataSource.getRepository(KanbanColumn).find({ where: { boardId }, order: { position: 'ASC' } });
    const tasks = columns.length ? await this.dataSource.getRepository(Task).find({ where: { columnId: In(columns.map(({ id }) => id)) }, order: { position: 'ASC' } }) : [];
    const response = toBoardDetailResponse(board, columns, tasks);
    await this.cache.set(key, response);
    return response;
  }

  async update(boardId: string, userId: string, dto: UpdateBoardDto): Promise<BoardResponseDto> {
    const board = await this.owned(boardId, userId);
    if (dto.name !== undefined) board.name = dto.name.trim();
    if (dto.description !== undefined) board.description = dto.description.trim() || null;
    const saved = await this.boards.save(board);
    await this.invalidate(userId, boardId);
    return toBoardResponse(saved);
  }

  async remove(boardId: string, userId: string): Promise<void> {
    await this.owned(boardId, userId);
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
    await this.invalidate(userId, boardId);
  }
}
