import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from './roles';
import { AuthRequest } from './auth';

export const SYSTEM_ROLES_KEY = 'system_roles';
export const SystemRoles = (...roles: SystemRole[]) => SetMetadata(SYSTEM_ROLES_KEY, roles);

@Injectable()
export class SystemRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<SystemRole[]>(SYSTEM_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!request.user || !required.includes(request.user.systemRole)) throw new ForbiddenException('Insufficient system role');
    return true;
  }
}
