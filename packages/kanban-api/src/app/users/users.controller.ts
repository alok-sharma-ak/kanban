import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest, ErrorResponseDto } from '../common/auth';
import { ApiProtectedErrors } from '../common/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@ApiProtectedErrors()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  getCurrent(@Req() request: AuthRequest): UserResponseDto {
    return this.usersService.getCurrent(request.user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'The email address is already registered' })
  updateCurrent(@Req() request: AuthRequest, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.updateCurrent(request.user, dto);
  }
}
