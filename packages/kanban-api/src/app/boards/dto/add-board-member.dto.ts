import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';
import { BoardRole } from '../../common/roles';

export class AddBoardMemberDto {
  @ApiProperty({ format: 'email' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() email!: string;
  @ApiProperty({ enum: [BoardRole.ADMIN, BoardRole.MEMBER, BoardRole.VIEWER] })
  @IsIn([BoardRole.ADMIN, BoardRole.MEMBER, BoardRole.VIEWER])
  role!: BoardRole.ADMIN | BoardRole.MEMBER | BoardRole.VIEWER;
}
