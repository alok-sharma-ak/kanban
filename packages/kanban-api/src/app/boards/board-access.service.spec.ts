import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BoardRole } from '../common/roles';
import { BoardAccessService } from './board-access.service';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';

describe('BoardAccessService', () => {
  const board = Object.assign(new Board(), { id: 'board-id', userId: 'owner-id' });
  const boards = { findOne: jest.fn() };
  const members = { findOne: jest.fn(), find: jest.fn() };
  let service: BoardAccessService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new BoardAccessService(
      boards as unknown as Repository<Board>,
      members as unknown as Repository<BoardMember>,
    );
  });

  it('resolves the owner without a membership row', async () => {
    boards.findOne.mockResolvedValue(board);
    await expect(service.get(board.id, board.userId)).resolves.toEqual({ board, role: BoardRole.OWNER });
    expect(members.findOne).not.toHaveBeenCalled();
  });

  it('hides boards from non-members', async () => {
    boards.findOne.mockResolvedValue(board);
    members.findOne.mockResolvedValue(null);
    await expect(service.get(board.id, 'stranger-id')).rejects.toThrow(NotFoundException);
  });

  it('returns 403 when a visible member lacks the required permission', async () => {
    boards.findOne.mockResolvedValue(board);
    members.findOne.mockResolvedValue({ role: BoardRole.VIEWER });
    await expect(service.require(board.id, 'viewer-id', new Set([BoardRole.MEMBER]))).rejects.toThrow(ForbiddenException);
  });
});
