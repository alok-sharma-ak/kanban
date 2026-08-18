import { Attachment } from '../entities/attachment.entity';
import { toAttachmentResponse } from './attachment-response.mapper';

describe('attachment response mapper', () => {
  it('never exposes the storage key or loaded ownership relations', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const attachment = Object.assign(new Attachment(), {
      id: 'attachment-id', originalName: 'file.txt', storageKey: 'private/internal-key',
      mimeType: 'text/plain', size: 4, taskId: 'task-id', uploaderId: 'user-id',
      createdAt: now, updatedAt: now, task: { column: { board: { user: { passwordHash: 'secret' } } } },
    });
    const result = toAttachmentResponse(attachment);
    expect(result).toEqual({
      id: 'attachment-id', originalName: 'file.txt', mimeType: 'text/plain', size: 4,
      taskId: 'task-id', uploaderId: 'user-id', createdAt: now, updatedAt: now,
    });
    expect(result).not.toHaveProperty('storageKey');
  });
});
