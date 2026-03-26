import type { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const mockReflector = { getAllAndOverride: jest.fn() };
  let guard: PermissionsGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PermissionsGuard(mockReflector as any);
  });

  function createContext(user: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('should pass when no permissions are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createContext({ permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should pass when user has the exact permission', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['cms:users:read']);
    const context = createContext({ permissions: ['cms:users:read', 'cms:content:read'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should pass when user has a wildcard permission matching the required one', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['cms:users:read']);
    const context = createContext({ permissions: ['cms:*'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should fail when user lacks the required permission', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['cms:settings:write']);
    const context = createContext({ permissions: ['cms:users:read'] });

    expect(guard.canActivate(context)).toBe(false);
  });
});
