import { KanbanColumn } from '../../columns/entities/column.entity';
import { Task } from '../../tasks/entities/task.entity';
import { BoardDetailResponseDto, BoardResponseDto } from '../dto/board-response.dto';
import { Board } from '../entities/board.entity';

export function toBoardResponse(board: Board): BoardResponseDto {
  return { id: board.id, name: board.name, description: board.description, userId: board.userId, createdAt: board.createdAt, updatedAt: board.updatedAt };
}

export function toBoardDetailResponse(board: Board, columns: KanbanColumn[], tasks: Task[]): BoardDetailResponseDto {
  const tasksByColumn = new Map<string, Task[]>();
  for (const task of tasks) {
    const columnTasks = tasksByColumn.get(task.columnId) ?? [];
    columnTasks.push(task);
    tasksByColumn.set(task.columnId, columnTasks);
  }

  return {
    ...toBoardResponse(board),
    columns: [...columns].sort((a, b) => a.position - b.position).map((column) => ({
      id: column.id,
      name: column.name,
      position: column.position,
      boardId: column.boardId,
      createdAt: column.createdAt,
      updatedAt: column.updatedAt,
      tasks: [...(tasksByColumn.get(column.id) ?? [])].sort((a, b) => a.position - b.position).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        position: task.position,
        columnId: task.columnId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
    })),
  };
}
