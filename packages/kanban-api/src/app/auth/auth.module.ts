import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../config/app-config.service';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({ imports: [TypeOrmModule.forFeature([User]), PassportModule, JwtModule.registerAsync({ inject: [AppConfigService], useFactory: (config: AppConfigService) => ({ secret: config.jwtSecret, signOptions: { expiresIn: config.jwtExpiresIn as never } }) })], controllers: [AuthController], providers: [AuthService, JwtStrategy] })
export class AuthModule {}
