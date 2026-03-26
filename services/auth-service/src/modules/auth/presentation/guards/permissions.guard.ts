import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userPermissions: string[] = user?.permissions ?? [];

    // Wildcard support: cms:* grants all cms: permissions
    return requiredPermissions.every((perm) =>
      userPermissions.some(
        (up: string) => up === perm || (up.endsWith(':*') && perm.startsWith(up.replace(':*', ':'))),
      ),
    );
  }
}
