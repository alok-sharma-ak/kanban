import { BadRequestException, Controller, Delete, Get, HttpCode, Injectable, InternalServerErrorException, Module, NotFoundException, Param, Post, Req, Res, UploadedFile, UnsupportedMediaTypeException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { BoardsModule, BoardsService } from '../boards/boards.module';
import { AuthRequest } from '../common/auth';
import { Attachment, KanbanColumn, Task } from '../database/entities';
import { StorageService } from '../infrastructure/storage.service';
import { TasksModule, TasksService } from '../tasks/tasks.module';

const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain']);
type UploadedAttachment = { buffer: Buffer; mimetype: string; originalname: string; size: number };
@Injectable()
class AttachmentsService {
  constructor(@InjectRepository(Attachment) private readonly attachments: Repository<Attachment>, private readonly tasks: TasksService, private readonly storage: StorageService, private readonly boards: BoardsService) {}
  private view(a: Attachment) { return { id: a.id, originalName: a.originalName, mimeType: a.mimeType, size: a.size, taskId: a.taskId, uploaderId: a.uploaderId, createdAt: a.createdAt, updatedAt: a.updatedAt }; }
  async owned(id: string, userId: string) { const a = await this.attachments.createQueryBuilder('a').innerJoinAndSelect('a.task', 't').innerJoinAndSelect('t.column', 'c').innerJoinAndSelect('c.board', 'b').where('a.id = :id AND b.user_id = :userId', { id, userId }).getOne(); if (!a) throw new NotFoundException('Attachment not found'); return a; }
  async upload(taskId: string, userId: string, file?: UploadedAttachment) { if (!file) throw new BadRequestException('file is required'); const task = await this.tasks.ownedTask(taskId, userId); const key = `${taskId}/${randomUUID()}`; await this.storage.put(key, file.buffer, file.mimetype); try { const a = await this.attachments.save(this.attachments.create({ taskId, uploaderId: userId, originalName: file.originalname, mimeType: file.mimetype, size: file.size, storageKey: key })); await this.boards.invalidate(userId, task.column.boardId); return this.view(a); } catch (error) { await this.storage.remove(key).catch(() => undefined); throw error; } }
  async list(taskId: string, userId: string) { await this.tasks.ownedTask(taskId, userId); return (await this.attachments.find({ where: { taskId }, order: { createdAt: 'ASC' } })).map((a) => this.view(a)); }
  async metadata(id: string, userId: string) { return this.view(await this.owned(id, userId)); }
  async download(id: string, userId: string) { const a = await this.owned(id, userId); return { attachment: a, stream: await this.storage.get(a.storageKey) }; }
  async remove(id: string, userId: string) { const a = await this.owned(id, userId); try { await this.storage.remove(a.storageKey); } catch { throw new InternalServerErrorException('Object storage deletion failed; attachment was retained'); } await this.attachments.delete(id); await this.boards.invalidate(userId, a.task.column.boardId); }
}

@ApiTags('attachments') @ApiBearerAuth() @Controller()
class AttachmentsController {
  constructor(private readonly service: AttachmentsService) {}
  @Post('tasks/:taskId/attachments') @ApiConsumes('multipart/form-data') @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: Number(process.env.UPLOAD_MAX_BYTES ?? 10485760) }, fileFilter: (_req, file, cb) => ALLOWED.has(file.mimetype) ? cb(null, true) : cb(new UnsupportedMediaTypeException('Unsupported attachment type'), false) }))
  upload(@Req() r: AuthRequest, @Param('taskId') id: string, @UploadedFile() file?: UploadedAttachment) { return this.service.upload(id, r.user.id, file); }
  @Get('tasks/:taskId/attachments') list(@Req() r: AuthRequest, @Param('taskId') id: string) { return this.service.list(id, r.user.id); }
  @Get('attachments/:attachmentId/download') async download(@Req() r: AuthRequest, @Param('attachmentId') id: string, @Res() res: Response) { const { attachment, stream } = await this.service.download(id, r.user.id); res.setHeader('Content-Type', attachment.mimeType); res.setHeader('Content-Length', String(attachment.size)); res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`); stream.on('error', (error) => res.destroy(error)); stream.pipe(res); }
  @Get('attachments/:attachmentId') metadata(@Req() r: AuthRequest, @Param('attachmentId') id: string) { return this.service.metadata(id, r.user.id); }
  @Delete('attachments/:attachmentId') @HttpCode(204) async remove(@Req() r: AuthRequest, @Param('attachmentId') id: string) { await this.service.remove(id, r.user.id); }
}
@Module({ imports: [TypeOrmModule.forFeature([Attachment, Task, KanbanColumn]), TasksModule, BoardsModule], controllers: [AttachmentsController], providers: [AttachmentsService] })
export class AttachmentsModule {}
