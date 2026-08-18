import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KanbanColumn } from '../columns/entities/column.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Board } from './entities/board.entity';
import { BoardsCacheService } from './boards-cache.service';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardAccessService } from './board-access.service';
import { BoardMembersService } from './board-members.service';
import { BoardMembersController } from './board-members.controller';
import { BoardMember } from './entities/board-member.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Board, BoardMember, User, KanbanColumn, Task, Attachment])],
  controllers: [BoardsController, BoardMembersController],
  providers: [BoardsService, BoardsCacheService, BoardAccessService, BoardMembersService],
  exports: [BoardsService, BoardAccessService],
})
export class BoardsModule {}
