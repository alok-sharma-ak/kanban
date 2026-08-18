import { ApiProperty } from '@nestjs/swagger';

export class AttachmentUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' }) file!: string;
}
