import { Task } from '../entities/task.entity';
import { toTaskResponse } from './task-response.mapper';

describe('task response mapper', () => {
  it('excludes loaded persistence relations', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const task = Object.assign(new Task(), {
      id: 'task-id', title: 'Task', description: null, position: 1, columnId: 'column-id',
      createdAt: now, updatedAt: now, column: { board: { user: { passwordHash: 'secret' } } },
    });
    expect(toTaskResponse(task)).toEqual({
      id: 'task-id', title: 'Task', description: null, position: 1, columnId: 'column-id', createdAt: now, updatedAt: now,
    });
  });
});
