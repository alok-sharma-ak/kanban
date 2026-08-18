import { BadRequestException, Injectable, Logger, NotFoundException, PayloadTooLargeException, ServiceUnavailableException, UnsupportedMediaTypeException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import { DataSource, Repository } from 'typeorm';
import { BoardsService } from '../boards/boards.service';
import { AppConfigService } from '../config/app-config.service';
import { OutboxService } from '../infrastructure/outbox.service';
import { StorageService } from '../infrastructure/storage.service';
import { TasksService } from '../tasks/tasks.service';
import { ATTACHMENT_MIME_TYPES } from './attachment.constants';
import { safeOriginalName } from './attachment-filename';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { Attachment } from './entities/attachment.entity';
import { toAttachmentResponse } from './mappers/attachment-response.mapper';
import { UploadedAttachment } from './types/uploaded-attachment';

export interface AttachmentDownload {
  attachment: Attachment;
  stream: Readable;
}

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    @InjectRepository(Attachment) private readonly attachments: Repository<Attachment>,
    private readonly tasks: TasksService,
    private readonly storage: StorageService,
    private readonly boards: BoardsService,
    private readonly outbox: OutboxService,
    private readonly dataSource: DataSource,
    private readonly config: AppConfigService,
  ) {}

  async owned(attachmentId: string, userId: string): Promise<Attachment> {
    const attachment = await this.attachments.createQueryBuilder('attachment')
      .innerJoinAndSelect('attachment.task', 'task')
      .innerJoinAndSelect('task.column', 'column')
      .innerJoinAndSelect('column.board', 'board')
      .where('attachment.id = :attachmentId AND board.user_id = :userId', { attachmentId, userId })
      .getOne();
    if (!attachment) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  async upload(taskId: string, userId: string, file?: UploadedAttachment): Promise<AttachmentResponseDto> {
    if (!file) throw new BadRequestException('file is required');
    if (file.size > this.config.uploadMaxBytes) throw new PayloadTooLargeException('Attachment exceeds the upload limit');
    if (!ATTACHMENT_MIME_TYPES.has(file.mimetype)) throw new UnsupportedMediaTypeException('Unsupported attachment type');

    const task = await this.tasks.ownedTask(taskId, userId);
    const storageKey = `${taskId}/${randomUUID()}`;
    try {
      await this.storage.put(storageKey, file.buffer, file.mimetype);
    } catch (error) {
      this.logger.error(`Attachment upload failed for task ${taskId}`, error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException('Attachment storage is unavailable');
    }

    try {
      const attachment = await this.attachments.save(this.attachments.create({
        taskId, uploaderId: userId, originalName: safeOriginalName(file.originalname),
        mimeType: file.mimetype, size: file.size, storageKey,
      }));
      await this.boards.invalidate(userId, task.column.boardId);
      return toAttachmentResponse(attachment);
    } catch (persistenceError) {
      try {
        await this.storage.remove(storageKey);
      } catch (compensationError) {
        try {
          await this.dataSource.transaction((manager) => this.outbox.enqueue(manager, [storageKey]));
        } catch (outboxError) {
          this.logger.error(JSON.stringify({
            event: 'attachment_upload_compensation_failed', storageKey,
            compensationError: String(compensationError), outboxError: String(outboxError),
          }));
        }
      }
      throw persistenceError;
    }
  }

  async list(taskId: string, userId: string): Promise<AttachmentResponseDto[]> {
    await this.tasks.ownedTask(taskId, userId);
    return (await this.attachments.find({ where: { taskId }, order: { createdAt: 'ASC' } })).map(toAttachmentResponse);
  }

  async metadata(attachmentId: string, userId: string): Promise<AttachmentResponseDto> {
    return toAttachmentResponse(await this.owned(attachmentId, userId));
  }

  async download(attachmentId: string, userId: string): Promise<AttachmentDownload> {
    const attachment = await this.owned(attachmentId, userId);
    try {
      return { attachment, stream: await this.storage.get(attachment.storageKey) };
    } catch (error) {
      this.logger.error(`Attachment download failed for ${attachmentId}`, error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException('Attachment storage is unavailable');
    }
  }

  async remove(attachmentId: string, userId: string): Promise<void> {
    const attachment = await this.owned(attachmentId, userId);
    await this.dataSource.transaction(async (manager) => {
      await this.outbox.enqueue(manager, [attachment.storageKey]);
      await manager.delete(Attachment, attachmentId);
    });
    await this.boards.invalidate(userId, attachment.task.column.boardId);
  }
}
