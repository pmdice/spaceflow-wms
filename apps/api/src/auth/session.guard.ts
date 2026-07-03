import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SessionService, type SessionUser } from './session.service';
import { IS_PUBLIC_KEY } from './public.decorator';

export type AuthenticatedRequest = Request & { user: SessionUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.sessionService.validate(request.headers.cookie);

    if (!user) {
      throw new UnauthorizedException('No valid session.');
    }

    request.user = user;
    return true;
  }
}
