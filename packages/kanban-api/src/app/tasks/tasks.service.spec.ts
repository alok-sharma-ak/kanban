import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BoardsService } from '../boards/boards.service';
import { ColumnsService } from '../columns/columns.service';
import { OutboxService } from '../infrastructure/outbox.service';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let repository: { createQueryBuilder: jest.Mock };
  let columns: { owned: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let service: TasksService;

  beforeEach(() => {
    repository = { createQueryBuilder: jest.fn() };
    columns = { owned: jest.fn() };
    dataSource = { transaction: jest.fn() };
    service = new TasksService(
      repository as unknown as Repository<Task>, columns as unknown as ColumnsService,
      dataSource as unknown as DataSource, {} as BoardsService, {} as OutboxService,
    );
  });

  it('hides an inaccessible task as not found', async () => {
    const query = { innerJoinAndSelect: jest.fn(), where: jest.fn(), getOne: jest.fn().mockResolvedValue(null) };
    query.innerJoinAndSelect.mockReturnValue(query); query.where.mockReturnValue(query);
    repository.createQueryBuilder.mockReturnValue(query);
    await expect(service.ownedTask('task-id', 'user-id')).rejects.toThrow(NotFoundException);
  });

  it('rejects duplicate reorder IDs before opening a transaction', async () => {
    columns.owned.mockResolvedValue({ boardId: 'board-id' });
    await expect(service.reorder('user-id', {
      columnId: '6cc8084d-c885-4435-a288-a3fbc74a5b8a',
      taskIds: ['f2d5d299-2869-45db-bda8-a8fd687b66ce', 'f2d5d299-2869-45db-bda8-a8fd687b66ce'],
    })).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
