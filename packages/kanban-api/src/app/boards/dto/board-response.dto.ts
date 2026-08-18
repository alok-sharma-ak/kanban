import { ApiProperty } from '@nestjs/swagger';

export class BoardTaskResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ minimum: 1 }) position!: number;
  @ApiProperty({ format: 'uuid' }) columnId!: string;
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
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}

export class BoardDetailResponseDto extends BoardResponseDto {
  @ApiProperty({ type: () => [BoardColumnResponseDto] }) columns!: BoardColumnResponseDto[];
}
