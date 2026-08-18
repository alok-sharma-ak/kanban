import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Board } from '../boards/entities/board.entity';
import { BoardsService } from '../boards/boards.service';
import { Task } from '../tasks/entities/task.entity';
import { ColumnResponseDto } from './dto/column-response.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { KanbanColumn } from './entities/column.entity';
import { toColumnResponse } from './mappers/column-response.mapper';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(KanbanColumn) private readonly columns: Repository<KanbanColumn>,
    private readonly boards: BoardsService,
    private readonly dataSource: DataSource,
  ) {}

  async owned(columnId: string, userId: string): Promise<KanbanColumn> {
    const column = await this.columns.createQueryBuilder('column')
      .innerJoinAndSelect('column.board', 'board')
      .where('column.id = :columnId AND board.user_id = :userId', { columnId, userId })
      .getOne();
    if (!column) throw new NotFoundException('Column not found');
    return column;
  }

  async create(boardId: string, userId: string, dto: CreateColumnDto): Promise<ColumnResponseDto> {
    await this.boards.owned(boardId, userId);
    const column = await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
        .where('board.id = :boardId', { boardId }).getOneOrFail();
      const position = await manager.count(KanbanColumn, { where: { boardId } }) + 1;
      return manager.save(manager.create(KanbanColumn, { boardId, name: dto.name.trim(), position }));
    });
    await this.boards.invalidate(userId, boardId);
    return toColumnResponse(column);
  }

  async update(columnId: string, userId: string, dto: UpdateColumnDto): Promise<ColumnResponseDto> {
    const column = await this.owned(columnId, userId);
    column.name = dto.name.trim();
    const saved = await this.columns.save(column);
    await this.boards.invalidate(userId, column.boardId);
    return toColumnResponse(saved);
  }

  async remove(columnId: string, userId: string): Promise<void> {
    const column = await this.owned(columnId, userId);
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
        .where('board.id = :boardId', { boardId: column.boardId }).getOneOrFail();
      if (await manager.exists(Task, { where: { columnId } })) throw new ConflictException('Column must be empty before deletion');
      await manager.delete(KanbanColumn, columnId);
      await manager.createQueryBuilder().update(KanbanColumn).set({ position: () => 'position - 1' })
        .where('board_id = :boardId AND position > :position', { boardId: column.boardId, position: column.position }).execute();
    });
    await this.boards.invalidate(userId, column.boardId);
  }

  async reorder(userId: string, dto: ReorderColumnsDto): Promise<ColumnResponseDto[]> {
    await this.boards.owned(dto.boardId, userId);
    if (new Set(dto.columnIds).size !== dto.columnIds.length) throw new BadRequestException('columnIds must be unique');
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
        .where('board.id = :boardId', { boardId: dto.boardId }).getOneOrFail();
      const current = await manager.find(KanbanColumn, { where: { boardId: dto.boardId } });
      const requested = new Set(dto.columnIds);
      if (current.length !== requested.size || current.some(({ id }) => !requested.has(id))) {
        throw new BadRequestException('columnIds must contain every board column exactly once');
      }
      await manager.query(
        'UPDATE columns AS column_row SET position = ordered.position FROM (SELECT id, ordinality::int AS position FROM unnest($1::uuid[]) WITH ORDINALITY AS entry(id, ordinality)) AS ordered WHERE column_row.id = ordered.id AND column_row.board_id = $2',
        [dto.columnIds, dto.boardId],
      );
    });
    await this.boards.invalidate(userId, dto.boardId);
    return (await this.columns.find({ where: { boardId: dto.boardId }, order: { position: 'ASC' } })).map(toColumnResponse);
  }
}
