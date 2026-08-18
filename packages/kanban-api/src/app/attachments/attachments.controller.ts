import { Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthRequest, ErrorResponseDto } from '../common/auth';
import { ApiProtectedErrors } from '../common/swagger';
import { ATTACHMENT_FORM_FIELD } from './attachment.constants';
import { contentDisposition } from './attachment-filename';
import { AttachmentsService } from './attachments.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { AttachmentUploadDto } from './dto/attachment-upload.dto';
import { UploadedAttachment } from './types/uploaded-attachment';

@ApiTags('attachments') @ApiBearerAuth() @ApiProtectedErrors() @Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('tasks/:taskId/attachments')
  @ApiOperation({ summary: 'Upload a private task attachment' })
  @ApiConsumes('multipart/form-data') @ApiBody({ type: AttachmentUploadDto })
  @ApiCreatedResponse({ type: AttachmentResponseDto })
  @ApiResponse({ status: 413, type: ErrorResponseDto, description: 'The file exceeds the configured upload limit' })
  @ApiResponse({ status: 415, type: ErrorResponseDto, description: 'The file MIME type is not allowed' })
  @UseInterceptors(FileInterceptor(ATTACHMENT_FORM_FIELD))
  upload(@Req() request: AuthRequest, @Param('taskId', ParseUUIDPipe) taskId: string, @UploadedFile() file?: UploadedAttachment) {
    return this.attachmentsService.upload(taskId, request.user.id, file);
  }

  @Get('tasks/:taskId/attachments')
  @ApiOperation({ summary: 'List private attachments for an owned task' })
  @ApiOkResponse({ type: AttachmentResponseDto, isArray: true })
  list(@Req() request: AuthRequest, @Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.attachmentsService.list(taskId, request.user.id);
  }

  @Get('attachments/:attachmentId/download')
  @ApiOperation({ summary: 'Download a private attachment through the authenticated API' })
  @ApiProduces('application/octet-stream') @ApiOkResponse({ description: 'Attachment file stream' })
  async download(@Req() request: AuthRequest, @Param('attachmentId', ParseUUIDPipe) attachmentId: string): Promise<StreamableFile> {
    const { attachment, stream } = await this.attachmentsService.download(attachmentId, request.user.id);
    return new StreamableFile(stream, {
      type: attachment.mimeType,
      length: attachment.size,
      disposition: contentDisposition(attachment.originalName),
    });
  }

  @Get('attachments/:attachmentId')
  @ApiOperation({ summary: 'Get private attachment metadata' }) @ApiOkResponse({ type: AttachmentResponseDto })
  metadata(@Req() request: AuthRequest, @Param('attachmentId', ParseUUIDPipe) attachmentId: string) {
    return this.attachmentsService.metadata(attachmentId, request.user.id);
  }

  @Delete('attachments/:attachmentId') @HttpCode(204)
  @ApiOperation({ summary: 'Delete attachment metadata and enqueue object cleanup' }) @ApiNoContentResponse()
  async remove(@Req() request: AuthRequest, @Param('attachmentId', ParseUUIDPipe) attachmentId: string): Promise<void> {
    await this.attachmentsService.remove(attachmentId, request.user.id);
  }
}
