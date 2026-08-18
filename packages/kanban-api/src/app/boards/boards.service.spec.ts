import { NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { OutboxService } from '../infrastructure/outbox.service';
import { BoardsCacheService } from './boards-cache.service';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { BoardAccessService } from './board-access.service';
import { BoardsService } from './boards.service';

describe('BoardsService', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  let repository: { findOne: jest.Mock; find: jest.Mock; save: jest.Mock };
  let cache: { listKey: jest.Mock; detailKey: jest.Mock; get: jest.Mock; set: jest.Mock; invalidateBoard: jest.Mock };
  let service: BoardsService;

  beforeEach(() => {
    repository = { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
    cache = {
      listKey: jest.fn().mockResolvedValue('list-key'), detailKey: jest.fn().mockResolvedValue('detail-key'),
      get: jest.fn(), set: jest.fn(), invalidateBoard: jest.fn(),
    };
    service = new BoardsService(
      repository as unknown as Repository<Board>,
      { find: jest.fn().mockResolvedValue([]) } as unknown as Repository<BoardMember>,
      {} as DataSource,
      cache as unknown as BoardsCacheService,
      {} as OutboxService,
      { get: jest.fn().mockImplementation((id: string) => id === 'cached-board'
        ? Promise.resolve({ role: 'OWNER' }) : Promise.reject(new NotFoundException())) } as unknown as BoardAccessService,
    );
  });

  it('returns cached board lists without querying PostgreSQL', async () => {
    const cached = [{ id: 'cached-board' }];
    cache.get.mockResolvedValue(cached);
    await expect(service.list('user-id')).resolves.toEqual([{ id: 'cached-board', role: 'OWNER' }]);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('maps and caches PostgreSQL board lists', async () => {
    cache.get.mockResolvedValue(null);
    repository.find.mockResolvedValue([Object.assign(new Board(), {
      id: 'board-id', name: 'Board', description: null, userId: 'user-id', createdAt: now, updatedAt: now,
      user: { passwordHash: 'must-not-leak' },
    })]);
    const result = await service.list('user-id');
    expect(result[0]).not.toHaveProperty('user');
    expect(cache.set).toHaveBeenCalledWith('list-key', result);
  });

  it('hides boards that are not owned by the user', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.owned('board-id', 'other-user')).rejects.toThrow(NotFoundException);
  });
});
