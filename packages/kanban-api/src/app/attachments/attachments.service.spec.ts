import { BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BoardsService } from '../boards/boards.service';
import { BoardAccessService } from '../boards/board-access.service';
import { AppConfigService } from '../config/app-config.service';
import { OutboxService } from '../infrastructure/outbox.service';
import { StorageService } from '../infrastructure/storage.service';
import { Task } from '../tasks/entities/task.entity';
import { TasksService } from '../tasks/tasks.service';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './entities/attachment.entity';

describe('AttachmentsService', () => {
  let repository: { create: jest.Mock; save: jest.Mock };
  let tasks: { ownedTask: jest.Mock };
  let storage: { put: jest.Mock; remove: jest.Mock };
  let boards: { invalidate: jest.Mock };
  let outbox: { enqueue: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let service: AttachmentsService;
  const file = { buffer: Buffer.from('hello'), mimetype: 'text/plain', originalname: '../hello.txt', size: 5 };

  beforeEach(() => {
    repository = { create: jest.fn((value) => Object.assign(new Attachment(), value)), save: jest.fn() };
    tasks = { ownedTask: jest.fn().mockResolvedValue(Object.assign(new Task(), { column: { boardId: 'board-id' } })) };
    storage = { put: jest.fn(), remove: jest.fn() };
    boards = { invalidate: jest.fn() };
    outbox = { enqueue: jest.fn() };
    dataSource = { transaction: jest.fn((work) => work({})) };
    service = new AttachmentsService(
      repository as unknown as Repository<Attachment>, tasks as unknown as TasksService,
      storage as unknown as StorageService, boards as unknown as BoardsService,
      outbox as unknown as OutboxService, dataSource as unknown as DataSource,
      { uploadMaxBytes: 10 } as AppConfigService,
      { get: jest.fn(), require: jest.fn().mockResolvedValue({}) } as unknown as BoardAccessService,
    );
  });

  it('rejects missing, oversized, and unsupported files before storage access', async () => {
    await expect(service.upload('task-id', 'user-id')).rejects.toThrow(BadRequestException);
    await expect(service.upload('task-id', 'user-id', { ...file, size: 11 })).rejects.toThrow(PayloadTooLargeException);
    await expect(service.upload('task-id', 'user-id', { ...file, mimetype: 'application/javascript' })).rejects.toThrow(UnsupportedMediaTypeException);
    expect(tasks.ownedTask).not.toHaveBeenCalled();
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('removes the uploaded object when metadata persistence fails', async () => {
    repository.save.mockRejectedValue(new Error('database failed'));
    storage.remove.mockResolvedValue(undefined);
    await expect(service.upload('task-id', 'user-id', file)).rejects.toThrow('database failed');
    expect(storage.remove).toHaveBeenCalledWith(expect.stringMatching(/^task-id\//));
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('enqueues cleanup when immediate upload compensation fails', async () => {
    repository.save.mockRejectedValue(new Error('database failed'));
    storage.remove.mockRejectedValue(new Error('storage failed'));
    await expect(service.upload('task-id', 'user-id', file)).rejects.toThrow('database failed');
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(outbox.enqueue).toHaveBeenCalledWith({}, [expect.stringMatching(/^task-id\//)]);
  });
});
