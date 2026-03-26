/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { UnauthorizedException } from '@nestjs/common';
import { LoginAppUseCase } from './login-app.use-case';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { Audience } from '../../domain/entities/session.entity';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('LoginAppUseCase', () => {
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

  const mockBillingGateway = {
    validateContract: jest.fn(),
    getSubscriptionStatus: jest.fn(),
  };

  let useCase: LoginAppUseCase;

  const activeClient = new User({
    id: 'user-1',
    contractNumber: 'CONTRACT-001',
    email: 'client@test.com',
    passwordHash: 'hashed-pw',
    role: UserRole.CLIENTE,
    status: UserStatus.ACTIVE,
    accountId: 'account-1',
    createdAt: new Date(),
  });

  const tokenPair = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginAppUseCase(
      mockUserRepo as any,
      mockSessionRepo as any,
      mockTokenService as any,
      mockHashService as any,
      mockBillingGateway as any,
    );
  });

  it('should login successfully with valid contract and password', async () => {
    mockUserRepo.findByContractNumber.mockResolvedValue(activeClient);
    mockHashService.compare.mockResolvedValue(true);
    mockBillingGateway.getSubscriptionStatus.mockResolvedValue({
      canPlay: true,
      entitlements: ['hd', '4k'],
    });
    mockTokenService.generateTokenPair.mockResolvedValue(tokenPair);
    mockHashService.hash.mockResolvedValue('hashed-refresh');
    mockSessionRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      contractNumber: 'CONTRACT-001',
      password: 'password123',
      deviceId: 'device-1',
    });

    expect(result).toEqual(tokenPair);
    expect(mockUserRepo.findByContractNumber).toHaveBeenCalledWith(
      'CONTRACT-001',
    );
    expect(mockHashService.compare).toHaveBeenCalledWith(
      'password123',
      'hashed-pw',
    );
    expect(mockBillingGateway.getSubscriptionStatus).toHaveBeenCalledWith(
      'account-1',
    );
    expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith({
      sub: 'user-1',
      role: UserRole.CLIENTE,
      permissions: ['app:playback', 'app:profiles'],
      aud: Audience.APP,
      accountId: 'account-1',
      entitlements: ['hd', '4k'],
    });
    expect(mockSessionRepo.save).toHaveBeenCalled();
  });

  it('should throw when user not found', async () => {
    mockUserRepo.findByContractNumber.mockResolvedValue(null);

    await expect(
      useCase.execute({
        contractNumber: 'INVALID',
        password: 'password123',
        deviceId: 'device-1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when user is inactive', async () => {
    const inactiveUser = new User({
      ...activeClient,
      status: UserStatus.INACTIVE,
      createdAt: new Date(),
    });
    mockUserRepo.findByContractNumber.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'device-1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when password is wrong', async () => {
    mockUserRepo.findByContractNumber.mockResolvedValue(activeClient);
    mockHashService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        contractNumber: 'CONTRACT-001',
        password: 'wrong-password',
        deviceId: 'device-1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when subscription is not active', async () => {
    mockUserRepo.findByContractNumber.mockResolvedValue(activeClient);
    mockHashService.compare.mockResolvedValue(true);
    mockBillingGateway.getSubscriptionStatus.mockResolvedValue({
      canPlay: false,
      entitlements: [],
    });

    await expect(
      useCase.execute({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'device-1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
