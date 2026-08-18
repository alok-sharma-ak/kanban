import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class MoveTaskDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() columnId!: string;
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) position!: number;
}
