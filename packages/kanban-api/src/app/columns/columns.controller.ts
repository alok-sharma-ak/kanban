import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest, ErrorResponseDto } from '../common/auth';
import { ApiProtectedErrors } from '../common/swagger';
import { ColumnsService } from './columns.service';
import { ColumnResponseDto } from './dto/column-response.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@ApiTags('columns') @ApiBearerAuth() @ApiProtectedErrors() @Controller()
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post('boards/:boardId/columns') @ApiOperation({ summary: 'Append a column to an owned board' }) @ApiCreatedResponse({ type: ColumnResponseDto })
  create(@Req() request: AuthRequest, @Param('boardId', ParseUUIDPipe) boardId: string, @Body() dto: CreateColumnDto) {
    return this.columnsService.create(boardId, request.user.id, dto);
  }

  @Patch('columns/reorder') @ApiOperation({ summary: 'Reorder every column in an owned board' }) @ApiOkResponse({ type: ColumnResponseDto, isArray: true })
  reorder(@Req() request: AuthRequest, @Body() dto: ReorderColumnsDto) { return this.columnsService.reorder(request.user.id, dto); }

  @Patch('columns/:columnId') @ApiOperation({ summary: 'Rename an owned column' }) @ApiOkResponse({ type: ColumnResponseDto })
  update(@Req() request: AuthRequest, @Param('columnId', ParseUUIDPipe) columnId: string, @Body() dto: UpdateColumnDto) {
    return this.columnsService.update(columnId, request.user.id, dto);
  }

  @Delete('columns/:columnId') @HttpCode(204) @ApiOperation({ summary: 'Delete an empty owned column' }) @ApiNoContentResponse()
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'The column contains tasks' })
  async remove(@Req() request: AuthRequest, @Param('columnId', ParseUUIDPipe) columnId: string) {
    await this.columnsService.remove(columnId, request.user.id);
  }
}
