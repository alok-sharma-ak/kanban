import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { AppConfigService } from '../config/app-config.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: AppConfigService, @InjectRepository(User) private readonly users: Repository<User>) { super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.jwtSecret }); }
  async validate(payload: { sub: string }) { const user = await this.users.findOne({ where: { id: payload.sub } }); if (!user) throw new UnauthorizedException(); return user; }
}
