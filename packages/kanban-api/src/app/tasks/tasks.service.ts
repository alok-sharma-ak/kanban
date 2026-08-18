import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BoardsService } from '../boards/boards.service';
import { ColumnsService } from '../columns/columns.service';
import { KanbanColumn } from '../columns/entities/column.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { OutboxService } from '../infrastructure/outbox.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { toTaskResponse } from './mappers/task-response.mapper';
import { BoardAccessService } from '../boards/board-access.service';
import { TASK_EDIT_ROLES } from '../common/roles';
import { Board } from '../boards/entities/board.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    private readonly columns: ColumnsService,
    private readonly dataSource: DataSource,
    private readonly boards: BoardsService,
    private readonly outbox: OutboxService,
    private readonly access: BoardAccessService,
  ) {}

  ownedColumn(columnId: string, userId: string): Promise<KanbanColumn> {
    return this.columns.owned(columnId, userId);
  }

  async ownedTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.tasks.createQueryBuilder('task')
      .innerJoinAndSelect('task.column', 'column')
      .innerJoinAndSelect('column.board', 'board')
      .where('task.id = :taskId', { taskId })
      .getOne();
    if (!task) throw new NotFoundException('Task not found');
    await this.access.get(task.column.boardId, userId);
    return task;
  }

  private async validateAssignee(boardId: string, assigneeId: string | null | undefined, manager?: EntityManager): Promise<void> {
    if (assigneeId && !(await this.access.isAssignable(boardId, assigneeId, manager))) {
      throw new BadRequestException('Assignee must be an OWNER, ADMIN, or MEMBER of the board');
    }
  }

  async create(columnId: string, userId: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const column = await this.ownedColumn(columnId, userId);
    await this.access.require(column.boardId, userId, TASK_EDIT_ROLES);
    const task = await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
        .where('board.id = :boardId', { boardId: column.boardId }).getOneOrFail();
      await manager.getRepository(KanbanColumn).createQueryBuilder('column').setLock('pessimistic_write')
        .where('column.id = :columnId', { columnId }).getOneOrFail();
      const position = await manager.count(Task, { where: { columnId } }) + 1;
      await this.validateAssignee(column.boardId, dto.assigneeId, manager);
      return manager.save(manager.create(Task, {
        columnId, position, title: dto.title.trim(), description: dto.description?.trim() || null,
        assigneeId: dto.assigneeId ?? null,
      }));
    });
    await this.boards.invalidate(userId, column.boardId);
    return toTaskResponse(task);
  }

  async get(taskId: string, userId: string): Promise<TaskResponseDto> {
    return toTaskResponse(await this.ownedTask(taskId, userId));
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.ownedTask(taskId, userId);
    await this.access.require(task.column.boardId, userId, TASK_EDIT_ROLES);
    if (dto.title !== undefined) task.title = dto.title.trim();
    if (dto.description !== undefined) task.description = dto.description.trim() || null;
    const saved = await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Board).createQueryBuilder('board').setLock('pessimistic_write')
        .where('board.id = :boardId', { boardId: task.column.boardId }).getOneOrFail();
      if (dto.assigneeId !== undefined) {
        await this.validateAssignee(task.column.boardId, dto.assigneeId, manager);
        task.assigneeId = dto.assigneeId;
      }
      return manager.save(Task, task);
    });
    await this.boards.invalidate(userId, task.column.boardId);
    return toTaskResponse(saved);
  }

  async remove(taskId: string, userId: string): Promise<void> {
    const task = await this.ownedTask(taskId, userId);
    await this.access.require(task.column.boardId, userId, TASK_EDIT_ROLES);
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(KanbanColumn).createQueryBuilder('column').setLock('pessimistic_write')
        .where('column.id = :columnId', { columnId: task.columnId }).getOneOrFail();
      const attachments = await manager.find(Attachment, { where: { taskId } });
      await this.outbox.enqueue(manager, attachments.map(({ storageKey }) => storageKey));
      await manager.delete(Task, taskId);
      await manager.createQueryBuilder().update(Task).set({ position: () => 'position - 1' })
        .where('column_id = :columnId AND position > :position', { columnId: task.columnId, position: task.position }).execute();
    });
    await this.boards.invalidate(userId, task.column.boardId);
  }

  async reorder(userId: string, dto: ReorderTasksDto): Promise<TaskResponseDto[]> {
    const column = await this.ownedColumn(dto.columnId, userId);
    await this.access.require(column.boardId, userId, TASK_EDIT_ROLES);
    if (new Set(dto.taskIds).size !== dto.taskIds.length) throw new BadRequestException('taskIds must be unique');
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(KanbanColumn).createQueryBuilder('column').setLock('pessimistic_write')
        .where('column.id = :columnId', { columnId: dto.columnId }).getOneOrFail();
      const current = await manager.find(Task, { where: { columnId: dto.columnId } });
      const requested = new Set(dto.taskIds);
      if (current.length !== requested.size || current.some(({ id }) => !requested.has(id))) {
        throw new BadRequestException('taskIds must contain every column task exactly once');
      }
      await manager.query(
        'UPDATE tasks AS task_row SET position = ordered.position FROM (SELECT id, ordinality::int AS position FROM unnest($1::uuid[]) WITH ORDINALITY AS entry(id, ordinality)) AS ordered WHERE task_row.id = ordered.id AND task_row.column_id = $2',
        [dto.taskIds, dto.columnId],
      );
    });
    await this.boards.invalidate(userId, column.boardId);
    return (await this.tasks.find({ where: { columnId: dto.columnId }, order: { position: 'ASC' } })).map(toTaskResponse);
  }

  async move(taskId: string, userId: string, dto: MoveTaskDto): Promise<TaskResponseDto> {
    const task = await this.ownedTask(taskId, userId);
    await this.access.require(task.column.boardId, userId, TASK_EDIT_ROLES);
    const destination = await this.ownedColumn(dto.columnId, userId);
    if (destination.boardId !== task.column.boardId) throw new BadRequestException('Tasks cannot move between boards');

    await this.dataSource.transaction(async (manager) => {
      const columnIds = [...new Set([task.columnId, dto.columnId])].sort();
      const locked = await manager.getRepository(KanbanColumn).createQueryBuilder('column').setLock('pessimistic_write')
        .where('column.id IN (:...columnIds)', { columnIds }).orderBy('column.id', 'ASC').getMany();
      if (locked.length !== columnIds.length) throw new NotFoundException('Column not found');

      const source = await manager.find(Task, { where: { columnId: task.columnId }, order: { position: 'ASC' } });
      const destinationTasks = task.columnId === dto.columnId
        ? source
        : await manager.find(Task, { where: { columnId: dto.columnId }, order: { position: 'ASC' } });
      const remaining = source.filter(({ id }) => id !== taskId);
      const target = task.columnId === dto.columnId ? remaining : destinationTasks;
      const insertionIndex = Math.min(dto.position - 1, target.length);
      target.splice(insertionIndex, 0, task);

      if (task.columnId !== dto.columnId && remaining.length) {
        await manager.query(
          'UPDATE tasks AS task_row SET position = ordered.position FROM (SELECT id, ordinality::int AS position FROM unnest($1::uuid[]) WITH ORDINALITY AS entry(id, ordinality)) AS ordered WHERE task_row.id = ordered.id AND task_row.column_id = $2',
          [remaining.map(({ id }) => id), task.columnId],
        );
      }
      await manager.query(
        'UPDATE tasks AS task_row SET column_id = $2, position = ordered.position FROM (SELECT id, ordinality::int AS position FROM unnest($1::uuid[]) WITH ORDINALITY AS entry(id, ordinality)) AS ordered WHERE task_row.id = ordered.id',
        [target.map(({ id }) => id), dto.columnId],
      );
    });

    await this.boards.invalidate(userId, destination.boardId);
    return toTaskResponse(await this.ownedTask(taskId, userId));
  }
}
