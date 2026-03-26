import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AudienceGuard } from './audience.guard';

describe('AudienceGuard', () => {
  const mockReflector = { getAllAndOverride: jest.fn() };
  let guard: AudienceGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AudienceGuard(mockReflector as any);
  });

  function createContext(user: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('should pass when no audience is required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createContext({ aud: 'app' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should pass when user audience matches', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['cms']);
    const context = createContext({ aud: 'cms' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when audience does not match', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['cms']);
    const context = createContext({ aud: 'app' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
