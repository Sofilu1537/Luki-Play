import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIENCE_KEY } from '../decorators/audience.decorator';

@Injectable()
export class AudienceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAudiences = this.reflector.getAllAndOverride<string[]>(
      AUDIENCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredAudiences || requiredAudiences.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!requiredAudiences.includes(user?.aud)) {
      throw new ForbiddenException('Access denied for this audience context');
    }
    return true;
  }
}
