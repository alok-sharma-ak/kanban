import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiProperty } from '@nestjs/swagger';
import { Request } from 'express';
import { User } from '../database/entities';

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly reflector: Reflector) { super(); }
  canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    return super.canActivate(context);
  }
  handleRequest<TUser = User>(err: unknown, user: TUser): TUser {
    if (err || !user) throw err || new UnauthorizedException();
    return user;
  }
}

export type AuthRequest = Request & { user: User };

export class ErrorResponseDto {
  @ApiProperty() statusCode!: number;
  @ApiProperty() message!: string | string[];
  @ApiProperty() error!: string;
  @ApiProperty() path!: string;
  @ApiProperty() timestamp!: string;
}
