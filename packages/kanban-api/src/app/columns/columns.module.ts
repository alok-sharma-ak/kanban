import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsModule } from '../boards/boards.module';
import { Board } from '../boards/entities/board.entity';
import { Task } from '../tasks/entities/task.entity';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { KanbanColumn } from './entities/column.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Board, KanbanColumn, Task]), BoardsModule],
  controllers: [ColumnsController], providers: [ColumnsService], exports: [ColumnsService],
})
export class ColumnsModule {}
