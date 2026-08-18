import { BadRequestException, Body, Controller, Delete, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import { BoardsModule, BoardsService } from '../boards/boards.module';
import { AuthRequest } from '../common/auth';
import { Attachment, KanbanColumn, Task } from '../database/entities';
import { StorageService } from '../infrastructure/storage.service';

class CreateTaskDto { @ApiProperty() @IsString() @Length(1, 200) title!: string; @ApiPropertyOptional() @IsOptional() @IsString() description?: string; }
class UpdateTaskDto { @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string; @ApiPropertyOptional() @IsOptional() @IsString() description?: string; }
class MoveTaskDto { @ApiProperty() @IsUUID() columnId!: string; @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) position!: number; }
class ReorderTasksDto { @ApiProperty() @IsUUID() columnId!: string; @ApiProperty({ type: [String] }) @IsArray() @ArrayNotEmpty() @IsUUID('4', { each: true }) taskIds!: string[]; }

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private readonly tasks: Repository<Task>, @InjectRepository(KanbanColumn) private readonly columns: Repository<KanbanColumn>, private readonly data: DataSource, private readonly boards: BoardsService, private readonly storage: StorageService) {}
  async ownedColumn(id: string, userId: string) { const c = await this.columns.createQueryBuilder('c').innerJoinAndSelect('c.board', 'b').where('c.id = :id AND b.user_id = :userId', { id, userId }).getOne(); if (!c) throw new NotFoundException('Column not found'); return c; }
  async ownedTask(id: string, userId: string) { const t = await this.tasks.createQueryBuilder('t').innerJoinAndSelect('t.column', 'c').innerJoinAndSelect('c.board', 'b').where('t.id = :id AND b.user_id = :userId', { id, userId }).getOne(); if (!t) throw new NotFoundException('Task not found'); return t; }
  async create(columnId: string, userId: string, dto: CreateTaskDto) { const c = await this.ownedColumn(columnId, userId); const position = await this.tasks.count({ where: { columnId } }) + 1; const task = await this.tasks.save(this.tasks.create({ columnId, position, title: dto.title.trim(), description: dto.description?.trim() || null })); await this.boards.invalidate(userId, c.boardId); return task; }
  get(id: string, userId: string) { return this.ownedTask(id, userId); }
  async update(id: string, userId: string, dto: UpdateTaskDto) { const task = await this.ownedTask(id, userId); if (dto.title !== undefined) task.title = dto.title.trim(); if (dto.description !== undefined) task.description = dto.description.trim() || null; const result = await this.tasks.save(task); await this.boards.invalidate(userId, task.column.boardId); return result; }
  async remove(id: string, userId: string) { const task = await this.ownedTask(id, userId); const attachments = await this.data.getRepository(Attachment).find({ where: { taskId: id } }); for (const a of attachments) await this.storage.remove(a.storageKey); await this.data.transaction(async (m) => { await m.delete(Task, id); await m.createQueryBuilder().update(Task).set({ position: () => 'position - 1' }).where('column_id = :columnId AND position > :position', { columnId: task.columnId, position: task.position }).execute(); }); await this.boards.invalidate(userId, task.column.boardId); }
  async reorder(userId: string, dto: ReorderTasksDto) { const column = await this.ownedColumn(dto.columnId, userId); if (new Set(dto.taskIds).size !== dto.taskIds.length) throw new BadRequestException('taskIds must be unique'); const current = await this.tasks.find({ where: { columnId: dto.columnId } }); if (current.length !== dto.taskIds.length || current.some((t) => !dto.taskIds.includes(t.id))) throw new BadRequestException('taskIds must contain every column task exactly once'); await this.data.transaction(async (m) => { for (let i = 0; i < dto.taskIds.length; i++) await m.update(Task, dto.taskIds[i], { position: i + 1 }); }); await this.boards.invalidate(userId, column.boardId); return this.tasks.find({ where: { columnId: dto.columnId }, order: { position: 'ASC' } }); }
  async move(id: string, userId: string, dto: MoveTaskDto) {
    const task = await this.ownedTask(id, userId); const destination = await this.ownedColumn(dto.columnId, userId);
    if (destination.boardId !== task.column.boardId) throw new BadRequestException('Tasks cannot move between boards');
    await this.data.transaction(async (m) => {
      const source = await m.find(Task, { where: { columnId: task.columnId }, order: { position: 'ASC' } });
      const destinationTasks = task.columnId === dto.columnId ? source : await m.find(Task, { where: { columnId: dto.columnId }, order: { position: 'ASC' } });
      const remaining = source.filter((item) => item.id !== id);
      const target = task.columnId === dto.columnId ? remaining : destinationTasks;
      const index = Math.min(Math.max(dto.position - 1, 0), target.length); target.splice(index, 0, task);
      if (task.columnId !== dto.columnId) for (let i = 0; i < remaining.length; i++) await m.update(Task, remaining[i].id, { position: i + 1 });
      for (let i = 0; i < target.length; i++) await m.update(Task, target[i].id, { columnId: dto.columnId, position: i + 1 });
    });
    await this.boards.invalidate(userId, destination.boardId); return this.ownedTask(id, userId);
  }
}

@ApiTags('tasks') @ApiBearerAuth() @Controller()
class TasksController {
  constructor(private readonly service: TasksService) {}
  @Post('columns/:columnId/tasks') create(@Req() r: AuthRequest, @Param('columnId') id: string, @Body() dto: CreateTaskDto) { return this.service.create(id, r.user.id, dto); }
  @Patch('tasks/reorder') reorder(@Req() r: AuthRequest, @Body() dto: ReorderTasksDto) { return this.service.reorder(r.user.id, dto); }
  @Get('tasks/:taskId') get(@Req() r: AuthRequest, @Param('taskId') id: string) { return this.service.get(id, r.user.id); }
  @Patch('tasks/:taskId/move') move(@Req() r: AuthRequest, @Param('taskId') id: string, @Body() dto: MoveTaskDto) { return this.service.move(id, r.user.id, dto); }
  @Patch('tasks/:taskId') update(@Req() r: AuthRequest, @Param('taskId') id: string, @Body() dto: UpdateTaskDto) { return this.service.update(id, r.user.id, dto); }
  @Delete('tasks/:taskId') @HttpCode(204) async remove(@Req() r: AuthRequest, @Param('taskId') id: string) { await this.service.remove(id, r.user.id); }
}
@Module({ imports: [TypeOrmModule.forFeature([Task, KanbanColumn, Attachment]), BoardsModule], controllers: [TasksController], providers: [TasksService], exports: [TasksService] })
export class TasksModule {}
