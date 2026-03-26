/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { LogoutUseCase } from './logout.use-case';
import { Session, Audience } from '../../domain/entities/session.entity';

describe('LogoutUseCase', () => {
  const mockSessionRepo = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    save: jest.fn(),
    deleteById: jest.fn(),
    deleteAllByUserId: jest.fn(),
  };

  const mockHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  let useCase: LogoutUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LogoutUseCase(mockSessionRepo as any, mockHashService as any);
  });

  it('should delete the matching session on successful logout', async () => {
    const session = new Session({
      id: 'session-1',
      userId: 'user-1',
      deviceId: 'device-1',
      audience: Audience.APP,
      refreshTokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
    });

    mockSessionRepo.findByUserId.mockResolvedValue([session]);
    mockHashService.compare.mockResolvedValue(true);
    mockSessionRepo.deleteById.mockResolvedValue(undefined);

    await useCase.execute('user-1', 'refresh-token');

    expect(mockSessionRepo.findByUserId).toHaveBeenCalledWith('user-1');
    expect(mockHashService.compare).toHaveBeenCalledWith(
      'refresh-token',
      'hashed-token',
    );
    expect(mockSessionRepo.deleteById).toHaveBeenCalledWith('session-1');
  });

  it('should handle gracefully when no matching session is found', async () => {
    mockSessionRepo.findByUserId.mockResolvedValue([]);

    await expect(
      useCase.execute('user-1', 'refresh-token'),
    ).resolves.toBeUndefined();
    expect(mockSessionRepo.deleteById).not.toHaveBeenCalled();
  });
});
