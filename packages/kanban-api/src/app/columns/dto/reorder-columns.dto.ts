import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderColumnsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() boardId!: string;
  @ApiProperty({ type: [String], maxItems: 100 })
  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(100) @IsUUID('4', { each: true })
  columnIds!: string[];
}
