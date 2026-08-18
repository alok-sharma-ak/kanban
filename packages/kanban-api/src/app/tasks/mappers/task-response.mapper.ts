import { TaskResponseDto } from '../dto/task-response.dto';
import { Task } from '../entities/task.entity';

export function toTaskResponse(task: Task): TaskResponseDto {
  return { id: task.id, title: task.title, description: task.description, position: task.position, columnId: task.columnId, createdAt: task.createdAt, updatedAt: task.updatedAt };
}
