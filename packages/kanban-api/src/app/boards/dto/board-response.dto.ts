import { ApiProperty } from '@nestjs/swagger';
import { BoardRole } from '../../common/roles';

export class BoardTaskResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ minimum: 1 }) position!: number;
  @ApiProperty({ format: 'uuid' }) columnId!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) assigneeId!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class BoardColumnResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ minimum: 1 }) position!: number;
  @ApiProperty({ format: 'uuid' }) boardId!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
  @ApiProperty({ type: () => [BoardTaskResponseDto] }) tasks!: BoardTaskResponseDto[];
}

export class BoardResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ enum: BoardRole }) role!: BoardRole;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class BoardDetailResponseDto extends BoardResponseDto {
  @ApiProperty({ type: () => [BoardColumnResponseDto] }) columns!: BoardColumnResponseDto[];
}
