import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function mockContext(user?: { role: 'agent' | 'admin' }, roles?: AppRole[]) {
    const handler = jest.fn();
    const cls = jest.fn();
    reflector.getAllAndOverride = jest.fn().mockReturnValue(roles ?? null);

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user })
      }),
      getHandler: () => handler,
      getClass: () => cls
    } as unknown as import('@nestjs/common').ExecutionContext;
  }

  it('allows when no roles required', () => {
    const ctx = mockContext(undefined, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when empty roles array', () => {
    const ctx = mockContext(undefined, []);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies when no user on request', () => {
    const ctx = mockContext(undefined, ['admin']);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows admin for admin-only route', () => {
    const ctx = mockContext({ role: 'admin' }, ['admin']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies agent for admin-only route', () => {
    const ctx = mockContext({ role: 'agent' }, ['admin']);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows agent for agent-only route', () => {
    const ctx = mockContext({ role: 'agent' }, ['agent']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies admin for agent-only route', () => {
    const ctx = mockContext({ role: 'admin' }, ['agent']);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows both roles for shared route', () => {
    const agentCtx = mockContext({ role: 'agent' }, ['agent', 'admin']);
    const adminCtx = mockContext({ role: 'admin' }, ['agent', 'admin']);
    expect(guard.canActivate(agentCtx)).toBe(true);
    expect(guard.canActivate(adminCtx)).toBe(true);
  });
});

type AppRole = 'agent' | 'admin';
