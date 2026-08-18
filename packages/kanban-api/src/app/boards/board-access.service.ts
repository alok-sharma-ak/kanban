import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BoardRole } from '../common/roles';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';

export interface BoardAccess { board: Board; role: BoardRole }

@Injectable()
export class BoardAccessService {
  constructor(
    @InjectRepository(Board) private readonly boards: Repository<Board>,
    @InjectRepository(BoardMember) private readonly members: Repository<BoardMember>,
  ) {}

  async get(boardId: string, userId: string, manager?: EntityManager): Promise<BoardAccess> {
    const boards = manager?.getRepository(Board) ?? this.boards;
    const members = manager?.getRepository(BoardMember) ?? this.members;
    const board = await boards.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.userId === userId) return { board, role: BoardRole.OWNER };
    const membership = await members.findOne({ where: { boardId, userId } });
    if (!membership) throw new NotFoundException('Board not found');
    return { board, role: membership.role };
  }

  async require(boardId: string, userId: string, allowed: Set<BoardRole>, manager?: EntityManager): Promise<BoardAccess> {
    const access = await this.get(boardId, userId, manager);
    if (!allowed.has(access.role)) throw new ForbiddenException('Insufficient board role');
    return access;
  }

  async userIds(boardId: string, manager?: EntityManager): Promise<string[]> {
    const boards = manager?.getRepository(Board) ?? this.boards;
    const members = manager?.getRepository(BoardMember) ?? this.members;
    const board = await boards.findOne({ where: { id: boardId } });
    if (!board) return [];
    return [board.userId, ...(await members.find({ where: { boardId } })).map(({ userId }) => userId)];
  }

  async isAssignable(boardId: string, userId: string, manager?: EntityManager): Promise<boolean> {
    try { return (await this.get(boardId, userId, manager)).role !== BoardRole.VIEWER; }
    catch (error) { if (error instanceof NotFoundException) return false; throw error; }
  }
}
