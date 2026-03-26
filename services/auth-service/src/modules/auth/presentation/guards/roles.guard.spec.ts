import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const mockReflector = { getAllAndOverride: jest.fn() };
  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(mockReflector as any);
  });

  function createContext(user: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('should pass when no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createContext({ role: 'cliente' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should pass when user has a matching role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['superadmin', 'soporte']);
    const context = createContext({ role: 'superadmin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should fail when user does not have a matching role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['superadmin']);
    const context = createContext({ role: 'cliente' });

    expect(guard.canActivate(context)).toBe(false);
  });
});
