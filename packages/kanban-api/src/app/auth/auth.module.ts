import { Body, ConflictException, Controller, HttpException, HttpStatus, Injectable, Module, Post, Get, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { AuthRequest, Public } from '../common/auth';
import { User } from '../database/entities';
import { RedisService } from '../infrastructure/redis.service';
import { UnauthorizedException } from '@nestjs/common';

class RegisterDto {
  @ApiProperty() @IsString() @Length(1, 120) name!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) password!: string;
}
class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() password!: string;
}

@Injectable()
class AuthService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>, private readonly jwt: JwtService) {}
  private publicUser(user: User) { return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt }; }
  private token(user: User) { return { accessToken: this.jwt.sign({ sub: user.id, email: user.email }), user: this.publicUser(user) }; }
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exists({ where: { email } })) throw new ConflictException('Email is already registered');
    const user = await this.users.save(this.users.create({ name: dto.name.trim(), email, passwordHash: await hash(dto.password, 12) }));
    return this.token(user);
  }
  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    return this.token(user);
  }
}

@Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, @InjectRepository(User) private readonly users: Repository<User>) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.getOrThrow('JWT_SECRET') });
  }
  async validate(payload: { sub: string }) {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

@ApiTags('auth')
@Controller('auth')
class AuthController {
  constructor(private readonly auth: AuthService, private readonly redis: RedisService) {}
  private async limit(req: Request, identity: string) {
    const key = `rate:auth:${req.ip}:${identity.trim().toLowerCase()}`;
    const result = await this.redis.rateLimit(key);
    if (!result.allowed) throw new HttpException(`Too many attempts; retry in ${result.retryAfter} seconds`, HttpStatus.TOO_MANY_REQUESTS);
  }
  @Public() @Post('register') @ApiOperation({ summary: 'Register a user' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) { await this.limit(req, dto.email); return this.auth.register(dto); }
  @Public() @Post('login') @ApiOperation({ summary: 'Log in' })
  async login(@Body() dto: LoginDto, @Req() req: Request) { await this.limit(req, dto.email); return this.auth.login(dto); }
  @Get('me') @ApiBearerAuth() me(@Req() req: AuthRequest) { const { id, name, email, createdAt, updatedAt } = req.user; return { id, name, email, createdAt, updatedAt }; }
}

@Module({
  imports: [TypeOrmModule.forFeature([User]), PassportModule, JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET'), signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '1d') as never } }) })],
  controllers: [AuthController], providers: [AuthService, JwtStrategy], exports: [AuthService],
})
export class AuthModule {}
