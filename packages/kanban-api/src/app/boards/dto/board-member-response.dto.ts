import { ApiProperty } from '@nestjs/swagger';
import { BoardRole } from '../../common/roles';

export class BoardMemberResponseDto {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ enum: BoardRole }) role!: BoardRole;
  @ApiProperty({ format: 'date-time' }) joinedAt!: Date;
}
