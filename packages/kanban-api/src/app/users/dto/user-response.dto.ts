import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '../../common/roles';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Ada Lovelace' }) name!: string;
  @ApiProperty({ format: 'email', example: 'ada@example.com' }) email!: string;
  @ApiProperty({ enum: SystemRole }) systemRole!: SystemRole;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
