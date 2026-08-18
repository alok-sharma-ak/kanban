import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KanbanColumn } from '../columns/entities/column.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Board } from './entities/board.entity';
import { BoardsCacheService } from './boards-cache.service';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  imports: [TypeOrmModule.forFeature([Board, KanbanColumn, Task, Attachment])],
  controllers: [BoardsController],
  providers: [BoardsService, BoardsCacheService],
  exports: [BoardsService],
})
export class BoardsModule {}
