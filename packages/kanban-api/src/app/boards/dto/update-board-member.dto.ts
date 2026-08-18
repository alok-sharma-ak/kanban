import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { BoardRole } from '../../common/roles';

export class UpdateBoardMemberDto {
  @ApiProperty({ enum: [BoardRole.ADMIN, BoardRole.MEMBER, BoardRole.VIEWER] })
  @IsIn([BoardRole.ADMIN, BoardRole.MEMBER, BoardRole.VIEWER])
  role!: BoardRole.ADMIN | BoardRole.MEMBER | BoardRole.VIEWER;
}
