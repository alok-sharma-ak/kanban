import { Body, ConflictException, Controller, Get, Module, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { Repository } from 'typeorm';
import { AuthRequest } from '../common/auth';
import { User } from '../database/entities';

class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
}
@ApiTags('users') @ApiBearerAuth() @Controller('users')
class UsersController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}
  private view(u: User) { return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt, updatedAt: u.updatedAt }; }
  @Get('me') me(@Req() req: AuthRequest) { return this.view(req.user); }
  @Patch('me') async update(@Req() req: AuthRequest, @Body() dto: UpdateUserDto) {
    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.users.findOne({ where: { email } });
      if (existing && existing.id !== req.user.id) throw new ConflictException('Email is already registered');
      req.user.email = email;
    }
    if (dto.name !== undefined) req.user.name = dto.name.trim();
    return this.view(await this.users.save(req.user));
  }
}
@Module({ imports: [TypeOrmModule.forFeature([User])], controllers: [UsersController] })
export class UsersModule {}
