import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../common/auth';
import { ApiProtectedErrors } from '../common/swagger';
import { BoardsService } from './boards.service';
import { BoardDetailResponseDto, BoardResponseDto } from './dto/board-response.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@ApiTags('boards')
@ApiBearerAuth()
@ApiProtectedErrors()
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a board with the three default columns' })
  @ApiCreatedResponse({ type: BoardDetailResponseDto })
  create(@Req() request: AuthRequest, @Body() dto: CreateBoardDto): Promise<BoardDetailResponseDto> {
    return this.boardsService.create(request.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List boards owned by the authenticated user' })
  @ApiOkResponse({ type: BoardResponseDto, isArray: true })
  list(@Req() request: AuthRequest): Promise<BoardResponseDto[]> {
    return this.boardsService.list(request.user.id);
  }

  @Get(':boardId')
  @ApiOperation({ summary: 'Get an owned board with ordered columns and tasks' })
  @ApiOkResponse({ type: BoardDetailResponseDto })
  get(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string): Promise<BoardDetailResponseDto> {
    return this.boardsService.detail(boardId, request.user.id);
  }

  @Patch(':boardId')
  @ApiOperation({ summary: 'Update an owned board' })
  @ApiOkResponse({ type: BoardResponseDto })
  update(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string, @Body() dto: UpdateBoardDto): Promise<BoardResponseDto> {
    return this.boardsService.update(boardId, request.user.id, dto);
  }

  @Delete(':boardId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an owned board' })
  @ApiNoContentResponse()
  async remove(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string): Promise<void> {
    await this.boardsService.remove(boardId, request.user.id);
  }
}
