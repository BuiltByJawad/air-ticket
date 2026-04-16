import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy';

export type CurrentUserData = JwtPayload;

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): CurrentUserData => {
  const req: { user?: JwtPayload } = ctx.switchToHttp().getRequest();
  if (!req.user) {
    throw new Error('User not found on request');
  }
  return req.user;
});
