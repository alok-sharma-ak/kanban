import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthRequest, Public } from '../common/auth';
import { RedisService } from '../infrastructure/redis.service';
import { toUserResponse } from '../users/mappers/user-response.mapper';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';

@ApiTags('auth') @Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly redis: RedisService) {}
  private async limit(req: Request, identity: string) { try { const result = await this.redis.rateLimit(`rate:auth:${req.ip}:${identity.trim().toLowerCase()}`); if (!result.allowed) throw new HttpException(`Too many attempts; retry in ${result.retryAfter} seconds`, HttpStatus.TOO_MANY_REQUESTS); } catch (error) { if (error instanceof HttpException) throw error; throw new ServiceUnavailableException('Authentication rate limiter is unavailable'); } }
  @Public() @Post('register') @ApiOperation({ summary: 'Register a user' }) register(@Body() dto: RegisterDto, @Req() req: Request) { return this.limit(req, dto.email).then(() => this.auth.register(dto)); }
  @Public() @Post('login') @ApiOperation({ summary: 'Log in' }) login(@Body() dto: LoginDto, @Req() req: Request) { return this.limit(req, dto.email).then(() => this.auth.login(dto)); }
  @Public() @Post('refresh') @HttpCode(200) refresh(@Body() dto: RefreshTokenDto) { return this.auth.refresh(dto.refreshToken); }
  @Public() @Post('logout') @HttpCode(204) async logout(@Body() dto: RefreshTokenDto) { await this.auth.logout(dto.refreshToken); }
  @Post('logout-all') @ApiBearerAuth() @HttpCode(204) async logoutAll(@Req() req: AuthRequest) { await this.auth.logoutAll(req.user.id); }
  @Get('me') @ApiBearerAuth() me(@Req() req: AuthRequest) { return toUserResponse(req.user); }
}
