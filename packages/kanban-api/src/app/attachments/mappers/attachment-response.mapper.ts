import { AttachmentResponseDto } from '../dto/attachment-response.dto';
import { Attachment } from '../entities/attachment.entity';

export function toAttachmentResponse(attachment: Attachment): AttachmentResponseDto {
  return {
    id: attachment.id, originalName: attachment.originalName, mimeType: attachment.mimeType,
    size: attachment.size, taskId: attachment.taskId, uploaderId: attachment.uploaderId,
    createdAt: attachment.createdAt, updatedAt: attachment.updatedAt,
  };
}
