import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString, Length } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import { AuthRequest } from '../common/auth';
import { Attachment, Board, KanbanColumn, Task } from '../database/entities';
import { RedisService } from '../infrastructure/redis.service';
import { StorageService } from '../infrastructure/storage.service';

class CreateBoardDto {
  @ApiProperty() @IsString() @Length(1, 160) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
class UpdateBoardDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

@Injectable()
export class BoardsService {
  constructor(@InjectRepository(Board) private readonly boards: Repository<Board>, private readonly data: DataSource, private readonly redis: RedisService, private readonly storage: StorageService) {}
  async owned(boardId: string, userId: string) { const board = await this.boards.findOne({ where: { id: boardId, userId } }); if (!board) throw new NotFoundException('Board not found'); return board; }
  async invalidate(userId: string, boardId: string) { await this.redis.del(`boards:${userId}`, `board:${userId}:${boardId}`); }
  async create(userId: string, dto: CreateBoardDto) {
    const board = await this.data.transaction(async (manager) => {
      const saved = await manager.save(manager.create(Board, { name: dto.name.trim(), description: dto.description?.trim() || null, userId }));
      await manager.save(KanbanColumn, ['Todo', 'In Progress', 'Done'].map((name, i) => manager.create(KanbanColumn, { name, position: i + 1, boardId: saved.id })));
      return saved;
    });
    await this.invalidate(userId, board.id); return this.detail(board.id, userId);
  }
  async list(userId: string) {
    const key = `boards:${userId}`; const cached = await this.redis.getJson<Board[]>(key); if (cached) return cached;
    const rows = await this.boards.find({ where: { userId }, order: { createdAt: 'DESC' } }); await this.redis.setJson(key, rows); return rows;
  }
  async detail(id: string, userId: string) {
    const key = `board:${userId}:${id}`; const cached = await this.redis.getJson<Board>(key); if (cached) return cached;
    await this.owned(id, userId);
    const board = await this.boards.findOne({ where: { id, userId }, relations: { columns: { tasks: true } } });
    if (!board) throw new NotFoundException('Board not found');
    board.columns.sort((a, b) => a.position - b.position); board.columns.forEach((c) => c.tasks.sort((a, b) => a.position - b.position));
    await this.redis.setJson(key, board); return board;
  }
  async update(id: string, userId: string, dto: UpdateBoardDto) { const board = await this.owned(id, userId); if (dto.name !== undefined) board.name = dto.name.trim(); if (dto.description !== undefined) board.description = dto.description.trim() || null; const saved = await this.boards.save(board); await this.invalidate(userId, id); return saved; }
  async remove(id: string, userId: string) {
    await this.owned(id, userId);
    const attachments = await this.data.getRepository(Attachment).createQueryBuilder('a').innerJoin(Task, 't', 't.id = a.task_id').innerJoin(KanbanColumn, 'c', 'c.id = t.column_id').where('c.board_id = :id', { id }).getMany();
    for (const attachment of attachments) await this.storage.remove(attachment.storageKey);
    await this.boards.delete({ id, userId }); await this.invalidate(userId, id);
  }
}

@ApiTags('boards') @ApiBearerAuth() @Controller('boards')
class BoardsController {
  constructor(private readonly service: BoardsService) {}
  @Post() create(@Req() req: AuthRequest, @Body() dto: CreateBoardDto) { return this.service.create(req.user.id, dto); }
  @Get() list(@Req() req: AuthRequest) { return this.service.list(req.user.id); }
  @Get(':boardId') get(@Req() req: AuthRequest, @Param('boardId') id: string) { return this.service.detail(id, req.user.id); }
  @Patch(':boardId') update(@Req() req: AuthRequest, @Param('boardId') id: string, @Body() dto: UpdateBoardDto) { return this.service.update(id, req.user.id, dto); }
  @Delete(':boardId') @HttpCode(204) async remove(@Req() req: AuthRequest, @Param('boardId') id: string) { await this.service.remove(id, req.user.id); }
}
@Module({ imports: [TypeOrmModule.forFeature([Board, KanbanColumn, Task, Attachment])], controllers: [BoardsController], providers: [BoardsService], exports: [BoardsService] })
export class BoardsModule {}
