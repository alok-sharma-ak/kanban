import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/database-errors';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { toUserResponse } from './mappers/user-response.mapper';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  getCurrent(user: User): UserResponseDto {
    return toUserResponse(user);
  }

  async updateCurrent(user: User, dto: UpdateUserDto): Promise<UserResponseDto> {
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.users.findOne({ where: { email } });
      if (existing && existing.id !== user.id) throw new ConflictException('Email is already registered');
      user.email = email;
    }
    if (dto.name !== undefined) user.name = dto.name.trim();

    try {
      return toUserResponse(await this.users.save(user));
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Email is already registered');
      throw error;
    }
  }
}
