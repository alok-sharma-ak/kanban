import { KanbanColumn } from '../../columns/entities/column.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Board } from '../entities/board.entity';
import { toBoardDetailResponse, toBoardResponse } from './board-response.mapper';

describe('board response mapper', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const board = Object.assign(new Board(), {
    id: 'board-id', name: 'Board', description: null, userId: 'user-id', createdAt: now, updatedAt: now,
    user: { passwordHash: 'must-not-leak' },
  });

  it('maps a board without relations or credentials', () => {
    expect(toBoardResponse(board)).toEqual({
      id: 'board-id', name: 'Board', description: null, userId: 'user-id', role: 'OWNER', createdAt: now, updatedAt: now,
    });
  });

  it('sorts columns and tasks into the nested response', () => {
    const columns = [
      Object.assign(new KanbanColumn(), { id: 'column-2', name: 'Done', position: 2, boardId: board.id, createdAt: now, updatedAt: now }),
      Object.assign(new KanbanColumn(), { id: 'column-1', name: 'Todo', position: 1, boardId: board.id, createdAt: now, updatedAt: now }),
    ];
    const tasks = [
      Object.assign(new Task(), { id: 'task-2', title: 'Second', description: null, position: 2, columnId: 'column-1', createdAt: now, updatedAt: now }),
      Object.assign(new Task(), { id: 'task-1', title: 'First', description: null, position: 1, columnId: 'column-1', createdAt: now, updatedAt: now }),
    ];

    const result = toBoardDetailResponse(board, columns, tasks);
    expect(result.columns.map(({ id }) => id)).toEqual(['column-1', 'column-2']);
    expect(result.columns[0].tasks.map(({ id }) => id)).toEqual(['task-1', 'task-2']);
    expect(result.columns[1].tasks).toEqual([]);
  });
});
