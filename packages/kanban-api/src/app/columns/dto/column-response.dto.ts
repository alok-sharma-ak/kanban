import { ApiProperty } from '@nestjs/swagger';

export class ColumnResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ minimum: 1 }) position!: number;
  @ApiProperty({ format: 'uuid' }) boardId!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
