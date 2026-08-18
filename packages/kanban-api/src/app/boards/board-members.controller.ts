import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest, ErrorResponseDto } from '../common/auth';
import { ApiProtectedErrors } from '../common/swagger';
import { BoardMembersService } from './board-members.service';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { BoardMemberResponseDto } from './dto/board-member-response.dto';
import { TransferBoardOwnerDto } from './dto/transfer-board-owner.dto';
import { UpdateBoardMemberDto } from './dto/update-board-member.dto';

@ApiTags('board-members') @ApiBearerAuth() @ApiProtectedErrors() @Controller('boards/:boardId')
export class BoardMembersController {
  constructor(private readonly boardMembersService: BoardMembersService) {}

  @Get('members') @ApiOperation({ summary: 'List members of an accessible board' })
  @ApiOkResponse({ type: BoardMemberResponseDto, isArray: true })
  list(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.boardMembersService.list(boardId, request.user.id);
  }

  @Post('members') @ApiOperation({ summary: 'Add an existing user to a board' })
  @ApiCreatedResponse({ type: BoardMemberResponseDto }) @ApiConflictResponse({ type: ErrorResponseDto })
  add(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string, @Body() dto: AddBoardMemberDto) {
    return this.boardMembersService.add(boardId, request.user.id, dto);
  }

  @Patch('members/:userId') @ApiOperation({ summary: 'Update a board member role' })
  @ApiOkResponse({ type: BoardMemberResponseDto })
  update(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('userId', ParseUUIDPipe) userId: string, @Body() dto: UpdateBoardMemberDto) {
    return this.boardMembersService.update(boardId, userId, request.user.id, dto);
  }

  @Delete('members/:userId') @HttpCode(204) @ApiOperation({ summary: 'Remove a member and clear their board assignments' })
  @ApiNoContentResponse()
  async remove(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string,
    @Param('userId', ParseUUIDPipe) userId: string): Promise<void> {
    await this.boardMembersService.remove(boardId, userId, request.user.id);
  }

  @Patch('owner') @HttpCode(204) @ApiOperation({ summary: 'Transfer board ownership to an ADMIN or MEMBER' })
  @ApiNoContentResponse()
  async transfer(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: TransferBoardOwnerDto): Promise<void> {
    await this.boardMembersService.transfer(boardId, dto.userId, request.user.id);
  }
}
