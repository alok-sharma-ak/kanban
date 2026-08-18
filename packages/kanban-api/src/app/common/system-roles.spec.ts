import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from './roles';
import { SystemRolesGuard } from './system-roles';

describe('SystemRolesGuard', () => {
  const context = (systemRole: SystemRole) => ({
    getHandler: jest.fn(), getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { systemRole } }) }),
  }) as unknown as ExecutionContext;

  it('allows routes without system-role metadata', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    expect(new SystemRolesGuard(reflector).canActivate(context(SystemRole.USER))).toBe(true);
  });

  it('allows ADMIN and rejects USER for an admin route', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([SystemRole.ADMIN]) } as unknown as Reflector;
    const guard = new SystemRolesGuard(reflector);
    expect(guard.canActivate(context(SystemRole.ADMIN))).toBe(true);
    expect(() => guard.canActivate(context(SystemRole.USER))).toThrow(ForbiddenException);
  });
});
