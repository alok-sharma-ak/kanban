import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../common/auth';
import { SystemRole } from '../common/roles';
import { SystemRoles } from '../common/system-roles';
import { ApiProtectedErrors } from '../common/swagger';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AdminUsersService } from './admin-users.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { UpdateSystemRoleDto } from './dto/update-system-role.dto';

@ApiTags('admin') @ApiBearerAuth() @ApiProtectedErrors() @SystemRoles(SystemRole.ADMIN) @Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get() @ApiOperation({ summary: 'List users for system administration' })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  list(@Query() query: ListUsersQueryDto) { return this.adminUsersService.list(query); }

  @Patch(':userId/role') @ApiOperation({ summary: 'Change a user system role' })
  @ApiOkResponse({ type: UserResponseDto })
  updateRole(@Req() request: AuthRequest, @Param('userId', ParseUUIDPipe) userId: string, @Body() dto: UpdateSystemRoleDto) {
    return this.adminUsersService.updateRole(request.user.id, userId, dto.role);
  }
}
