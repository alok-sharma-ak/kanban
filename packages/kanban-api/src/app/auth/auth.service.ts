import { ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { AppConfigService } from '../config/app-config.service';
import { User } from '../users/entities/user.entity';
import { toUserResponse } from '../users/mappers/user-response.mapper';
import { RedisService } from '../infrastructure/redis.service';
import { LoginDto, RegisterDto } from './dto';
import { isUniqueViolation } from '../common/database-errors';

type RefreshSession = { userId: string; familyId: string };
@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>, private readonly jwt: JwtService, private readonly redis: RedisService, private readonly config: AppConfigService) {}
  private digest(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private async issueRefresh(userId: string, familyId: string = randomUUID()) {
    const token = `${familyId}.${randomBytes(48).toString('base64url')}`;
    await this.redis.createRefreshSession(this.digest(token), { userId, familyId }, this.config.refreshTtlSeconds);
    return token;
  }
  private async tokens(user: User, familyId?: string) { return { accessToken: this.jwt.sign({ sub: user.id, email: user.email }), refreshToken: await this.issueRefresh(user.id, familyId), user: toUserResponse(user) }; }
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exists({ where: { email } })) throw new ConflictException('Email is already registered');
    let user: User;
    try { user = await this.users.save(this.users.create({ name: dto.name.trim(), email, passwordHash: await hash(dto.password, 12) })); }
    catch (error) { if (isUniqueViolation(error)) throw new ConflictException('Email is already registered'); throw error; }
    return this.tokens(user);
  }
  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !(await compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    return this.tokens(user);
  }
  async refresh(token: string) {
    const familyId = token.split('.', 1)[0];
    if (!familyId) throw new UnauthorizedException('Invalid refresh token');
    const replacement = `${familyId}.${randomBytes(48).toString('base64url')}`;
    let result: { status: 'ok' | 'invalid' | 'reused'; session?: RefreshSession };
    try { result = await this.redis.rotateRefreshSession(this.digest(token), this.digest(replacement), this.config.refreshTtlSeconds); }
    catch { throw new ServiceUnavailableException('Authentication session store is unavailable'); }
    if (result.status === 'reused') { await this.redis.revokeRefreshFamily(familyId).catch(() => undefined); throw new UnauthorizedException('Refresh token reuse detected'); }
    if (result.status !== 'ok' || !result.session) throw new UnauthorizedException('Invalid or expired refresh token');
    const user = await this.users.findOne({ where: { id: result.session.userId } });
    if (!user) { await this.redis.revokeRefreshFamily(familyId); throw new UnauthorizedException(); }
    return { accessToken: this.jwt.sign({ sub: user.id, email: user.email }), refreshToken: replacement, user: toUserResponse(user) };
  }
  async logout(token: string) { try { await this.redis.revokeRefreshToken(this.digest(token)); } catch { throw new ServiceUnavailableException('Authentication session store is unavailable'); } }
  async logoutAll(userId: string) { try { await this.redis.revokeUserSessions(userId); } catch { throw new ServiceUnavailableException('Authentication session store is unavailable'); } }
}
