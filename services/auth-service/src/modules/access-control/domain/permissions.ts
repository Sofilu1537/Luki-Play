import { UserRole } from '../../auth/domain/entities/user.entity';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPERADMIN]: [
    'cms:*',
    'cms:users:read',
    'cms:users:write',
    'cms:content:read',
    'cms:content:write',
    'cms:analytics:read',
    'cms:settings:read',
    'cms:settings:write',
    'app:playback',
    'app:profiles',
  ],
  [UserRole.SOPORTE]: [
    'cms:users:read',
    'cms:content:read',
    'cms:analytics:read',
  ],
  [UserRole.CLIENTE]: [
    'app:playback',
    'app:profiles',
  ],
};

export function getPermissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
