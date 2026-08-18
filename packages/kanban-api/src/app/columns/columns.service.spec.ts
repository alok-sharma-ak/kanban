import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BoardsService } from '../boards/boards.service';
import { BoardAccessService } from '../boards/board-access.service';
import { KanbanColumn } from './entities/column.entity';
import { ColumnsService } from './columns.service';

describe('ColumnsService', () => {
  let repository: { findOne: jest.Mock };
  let boards: { owned: jest.Mock; invalidate: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let service: ColumnsService;

  beforeEach(() => {
    repository = { findOne: jest.fn() };
    boards = { owned: jest.fn(), invalidate: jest.fn() };
    dataSource = { transaction: jest.fn() };
    service = new ColumnsService(
      repository as unknown as Repository<KanbanColumn>,
      boards as unknown as BoardsService,
      { get: jest.fn(), require: jest.fn().mockResolvedValue({}) } as unknown as BoardAccessService,
      dataSource as unknown as DataSource,
    );
  });

  it('hides an inaccessible column as not found', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.owned('column-id', 'user-id')).rejects.toThrow(NotFoundException);
  });

  it('rejects duplicate reorder IDs before opening a transaction', async () => {
    boards.owned.mockResolvedValue({ id: 'board-id' });
    await expect(service.reorder('user-id', {
      boardId: '6cc8084d-c885-4435-a288-a3fbc74a5b8a',
      columnIds: ['f2d5d299-2869-45db-bda8-a8fd687b66ce', 'f2d5d299-2869-45db-bda8-a8fd687b66ce'],
    })).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
