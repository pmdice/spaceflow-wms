import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionGuard } from './session.guard';
import type { SessionService } from './session.service';

function makeContext(cookie: string | undefined) {
  const request: { headers: { cookie?: string }; user?: unknown } = { headers: { cookie } };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
  return { context, request };
}

function makeReflector(isPublic: boolean): Reflector {
  return { getAllAndOverride: () => isPublic } as unknown as Reflector;
}

describe('SessionGuard', () => {
  it('allows the request through without checking the session when the route is @Public()', async () => {
    const validate = jest.fn();
    const guard = new SessionGuard({ validate } as unknown as SessionService, makeReflector(true));
    const { context } = makeContext(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(validate).not.toHaveBeenCalled();
  });

  it('attaches request.user and returns true when the session is valid', async () => {
    const validate = jest.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    const guard = new SessionGuard({ validate } as unknown as SessionService, makeReflector(false));
    const { context, request } = makeContext('better-auth.session_token=abc.def');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ id: 'user-1', role: 'ADMIN' });
    expect(validate).toHaveBeenCalledWith('better-auth.session_token=abc.def');
  });

  it('throws UnauthorizedException when there is no valid session', async () => {
    const validate = jest.fn().mockResolvedValue(null);
    const guard = new SessionGuard({ validate } as unknown as SessionService, makeReflector(false));
    const { context } = makeContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
