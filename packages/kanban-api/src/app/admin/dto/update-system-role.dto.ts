import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SystemRole } from '../../common/roles';

export class UpdateSystemRoleDto {
  @ApiProperty({ enum: SystemRole }) @IsEnum(SystemRole) role!: SystemRole;
}
