import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemRole } from '../common/roles';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { toUserResponse } from '../users/mappers/user-response.mapper';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';

@Injectable()
export class AdminUsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async list(query: ListUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    const builder = this.users.createQueryBuilder('user').orderBy('user.created_at', 'DESC')
      .skip((query.page - 1) * query.limit).take(query.limit);
    if (query.search) {
      builder.andWhere('(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }
    const [rows, total] = await builder.getManyAndCount();
    return {
      items: rows.map(toUserResponse), page: query.page, limit: query.limit, total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async updateRole(actorId: string, userId: string, role: SystemRole): Promise<UserResponseDto> {
    if (actorId === userId && role !== SystemRole.ADMIN) {
      throw new BadRequestException('Administrators cannot demote themselves');
    }
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.systemRole = role;
    return toUserResponse(await this.users.save(user));
  }
}
