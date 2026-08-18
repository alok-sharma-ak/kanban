import { BadRequestException, Body, ConflictException, Controller, Delete, HttpCode, Injectable, Module, NotFoundException, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { ArrayNotEmpty, IsArray, IsString, IsUUID, Length } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import { BoardsModule, BoardsService } from '../boards/boards.module';
import { AuthRequest } from '../common/auth';
import { Board, KanbanColumn, Task } from '../database/entities';

class CreateColumnDto { @ApiProperty() @IsString() @Length(1, 120) name!: string; }
class UpdateColumnDto { @ApiPropertyOptional() @IsString() @Length(1, 120) name!: string; }
class ReorderColumnsDto { @ApiProperty() @IsUUID() boardId!: string; @ApiProperty({ type: [String] }) @IsArray() @ArrayNotEmpty() @IsUUID('4', { each: true }) columnIds!: string[]; }

@Injectable()
class ColumnsService {
  constructor(@InjectRepository(KanbanColumn) private readonly columns: Repository<KanbanColumn>, private readonly boards: BoardsService, private readonly data: DataSource) {}
  private async owned(id: string, userId: string) { const c = await this.columns.createQueryBuilder('c').innerJoinAndSelect('c.board', 'b').where('c.id = :id AND b.user_id = :userId', { id, userId }).getOne(); if (!c) throw new NotFoundException('Column not found'); return c; }
  async create(boardId: string, userId: string, dto: CreateColumnDto) { await this.boards.owned(boardId, userId); const position = await this.columns.count({ where: { boardId } }) + 1; const result = await this.columns.save(this.columns.create({ boardId, name: dto.name.trim(), position })); await this.boards.invalidate(userId, boardId); return result; }
  async update(id: string, userId: string, dto: UpdateColumnDto) { const c = await this.owned(id, userId); c.name = dto.name.trim(); const result = await this.columns.save(c); await this.boards.invalidate(userId, c.boardId); return result; }
  async remove(id: string, userId: string) { const c = await this.owned(id, userId); if (await this.data.getRepository(Task).exists({ where: { columnId: id } })) throw new ConflictException('Column must be empty before deletion'); await this.data.transaction(async (m) => { await m.delete(KanbanColumn, id); await m.createQueryBuilder().update(KanbanColumn).set({ position: () => 'position - 1' }).where('board_id = :boardId AND position > :position', { boardId: c.boardId, position: c.position }).execute(); }); await this.boards.invalidate(userId, c.boardId); }
  async reorder(userId: string, dto: ReorderColumnsDto) { await this.boards.owned(dto.boardId, userId); if (new Set(dto.columnIds).size !== dto.columnIds.length) throw new BadRequestException('columnIds must be unique'); const current = await this.columns.find({ where: { boardId: dto.boardId } }); if (current.length !== dto.columnIds.length || current.some((c) => !dto.columnIds.includes(c.id))) throw new BadRequestException('columnIds must contain every board column exactly once'); await this.data.transaction(async (m) => { for (let i = 0; i < dto.columnIds.length; i++) await m.update(KanbanColumn, dto.columnIds[i], { position: i + 1 }); }); await this.boards.invalidate(userId, dto.boardId); return this.columns.find({ where: { boardId: dto.boardId }, order: { position: 'ASC' } }); }
}
@ApiTags('columns') @ApiBearerAuth() @Controller()
class ColumnsController {
  constructor(private readonly service: ColumnsService) {}
  @Post('boards/:boardId/columns') create(@Req() r: AuthRequest, @Param('boardId') id: string, @Body() dto: CreateColumnDto) { return this.service.create(id, r.user.id, dto); }
  @Patch('columns/reorder') reorder(@Req() r: AuthRequest, @Body() dto: ReorderColumnsDto) { return this.service.reorder(r.user.id, dto); }
  @Patch('columns/:columnId') update(@Req() r: AuthRequest, @Param('columnId') id: string, @Body() dto: UpdateColumnDto) { return this.service.update(id, r.user.id, dto); }
  @Delete('columns/:columnId') @HttpCode(204) async remove(@Req() r: AuthRequest, @Param('columnId') id: string) { await this.service.remove(id, r.user.id); }
}
@Module({ imports: [TypeOrmModule.forFeature([Board, KanbanColumn, Task]), BoardsModule], controllers: [ColumnsController], providers: [ColumnsService] })
export class ColumnsModule {}
