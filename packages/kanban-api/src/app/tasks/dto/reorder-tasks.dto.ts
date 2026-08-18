import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderTasksDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() columnId!: string;
  @ApiProperty({ type: [String], maxItems: 1000 })
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(1000) @IsUUID('4', { each: true }) taskIds!: string[];
}
