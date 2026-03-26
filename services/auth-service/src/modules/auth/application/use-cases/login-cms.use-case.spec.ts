/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import { UnauthorizedException } from '@nestjs/common';
import { LoginCmsUseCase } from './login-cms.use-case';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { Audience } from '../../domain/entities/session.entity';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('LoginCmsUseCase', () => {
  const mockUserRepo = {
    findById: jest.fn(),
    findByContractNumber: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockSessionRepo = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    save: jest.fn(),
    deleteById: jest.fn(),
    deleteAllByUserId: jest.fn(),
  };

  const mockTokenService = {
    generateTokenPair: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  const mockHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  let useCase: LoginCmsUseCase;

  const cmsUser = new User({
    id: 'user-cms-1',
    contractNumber: null,
    email: 'admin@lukiplay.com',
    passwordHash: 'hashed-pw',
    role: UserRole.SUPERADMIN,
    status: UserStatus.ACTIVE,
    accountId: null,
    createdAt: new Date(),
  });

  const tokenPair = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginCmsUseCase(
      mockUserRepo as any,
      mockSessionRepo as any,
      mockTokenService as any,
      mockHashService as any,
    );
  });

  it('should login successfully with valid email and password', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(cmsUser);
    mockHashService.compare.mockResolvedValue(true);
    mockTokenService.generateTokenPair.mockResolvedValue(tokenPair);
    mockHashService.hash.mockResolvedValue('hashed-refresh');
    mockSessionRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      email: 'admin@lukiplay.com',
      password: 'securePass123',
      deviceId: 'cms-browser-1',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.canAccessOtt).toBe(true);
    expect(result.restrictionMessage).toBeNull();
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('admin@lukiplay.com');
    expect(mockHashService.compare).toHaveBeenCalledWith(
      'securePass123',
      'hashed-pw',
    );
    expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith({
      sub: 'user-cms-1',
      role: UserRole.SUPERADMIN,
      permissions: expect.arrayContaining(['cms:*']),
      aud: Audience.CMS,
      accountId: null,
      entitlements: [],
    });
    expect(mockSessionRepo.save).toHaveBeenCalled();
  });

  it('should throw when email not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'unknown@test.com',
        password: 'password',
        deviceId: 'device',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when user is not a CMS role', async () => {
    const clientUser = new User({
      id: 'user-client',
      contractNumber: 'CONTRACT-001',
      email: 'client@test.com',
      passwordHash: 'hashed-pw',
      role: UserRole.CLIENTE,
      status: UserStatus.ACTIVE,
      accountId: 'account-1',
      createdAt: new Date(),
    });
    mockUserRepo.findByEmail.mockResolvedValue(clientUser);

    await expect(
      useCase.execute({
        email: 'client@test.com',
        password: 'password123',
        deviceId: 'device',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when password is wrong', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(cmsUser);
    mockHashService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'admin@lukiplay.com',
        password: 'wrong-password',
        deviceId: 'device',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
