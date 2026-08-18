import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TransferBoardOwnerDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() userId!: string;
}
