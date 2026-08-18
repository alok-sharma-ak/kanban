import { ColumnResponseDto } from '../dto/column-response.dto';
import { KanbanColumn } from '../entities/column.entity';

export function toColumnResponse(column: KanbanColumn): ColumnResponseDto {
  return { id: column.id, name: column.name, position: column.position, boardId: column.boardId, createdAt: column.createdAt, updatedAt: column.updatedAt };
}
