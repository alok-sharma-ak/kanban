import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../common/auth';
import { ApiProtectedErrors } from '../common/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks') @ApiBearerAuth() @ApiProtectedErrors() @Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('columns/:columnId/tasks') @ApiOperation({ summary: 'Append a task to an owned column' }) @ApiCreatedResponse({ type: TaskResponseDto })
  create(@Req() request: AuthRequest, @Param('columnId', ParseUUIDPipe) columnId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(columnId, request.user.id, dto);
  }

  @Patch('tasks/reorder') @ApiOperation({ summary: 'Reorder every task in an owned column' }) @ApiOkResponse({ type: TaskResponseDto, isArray: true })
  reorder(@Req() request: AuthRequest, @Body() dto: ReorderTasksDto) { return this.tasksService.reorder(request.user.id, dto); }

  @Get('tasks/:taskId') @ApiOperation({ summary: 'Get an owned task' }) @ApiOkResponse({ type: TaskResponseDto })
  get(@Req() request: AuthRequest, @Param('taskId', ParseUUIDPipe) taskId: string) { return this.tasksService.get(taskId, request.user.id); }

  @Patch('tasks/:taskId/move') @ApiOperation({ summary: 'Move an owned task within its board' }) @ApiOkResponse({ type: TaskResponseDto })
  move(@Req() request: AuthRequest, @Param('taskId', ParseUUIDPipe) taskId: string, @Body() dto: MoveTaskDto) {
    return this.tasksService.move(taskId, request.user.id, dto);
  }

  @Patch('tasks/:taskId') @ApiOperation({ summary: 'Update an owned task' }) @ApiOkResponse({ type: TaskResponseDto })
  update(@Req() request: AuthRequest, @Param('taskId', ParseUUIDPipe) taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(taskId, request.user.id, dto);
  }

  @Delete('tasks/:taskId') @HttpCode(204) @ApiOperation({ summary: 'Delete an owned task' }) @ApiNoContentResponse()
  async remove(@Req() request: AuthRequest, @Param('taskId', ParseUUIDPipe) taskId: string) {
    await this.tasksService.remove(taskId, request.user.id);
  }
}
