import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const CurrentUser = createParamDecorator(
  <K extends keyof JwtPayload>(
    data: K | undefined,
    ctx: ExecutionContext,
  ): JwtPayload | JwtPayload[K] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user[data] : user;
  },
);