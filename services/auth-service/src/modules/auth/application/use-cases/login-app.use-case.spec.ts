/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { UnauthorizedException } from '@nestjs/common';
import { LoginAppUseCase } from './login-app.use-case';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { Audience } from '../../domain/entities/session.entity';
import {
  Account,
  ContractType,
  ServiceStatus,
  SubscriptionStatus,
} from '../../domain/entities/account.entity';

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

  const mockAccountRepo = {
    findById: jest.fn(),
    findByContractNumber: jest.fn(),
    save: jest.fn(),
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
    getCustomerRecord: jest.fn(),
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

  const activeAccount = new Account({
    id: 'account-1',
    contractNumber: 'CONTRACT-001',
    contractType: ContractType.ISP,
    isIspCustomer: true,
    planId: 'plan-basic',
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    serviceStatus: ServiceStatus.ACTIVO,
    maxDevices: 2,
  });

  const suspendedAccount = new Account({
    id: 'account-1',
    contractNumber: 'CONTRACT-001',
    contractType: ContractType.ISP,
    isIspCustomer: true,
    planId: 'plan-basic',
    subscriptionStatus: SubscriptionStatus.SUSPENDED,
    serviceStatus: ServiceStatus.SUSPENDIDO,
    maxDevices: 2,
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
      mockAccountRepo as any,
      mockTokenService as any,
      mockHashService as any,
      mockBillingGateway as any,
    );
  });

  it('should login successfully with valid contract and password', async () => {
    mockUserRepo.findByContractNumber.mockResolvedValue(activeClient);
    mockHashService.compare.mockResolvedValue(true);
    mockAccountRepo.findById.mockResolvedValue(activeAccount);
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

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.canAccessOtt).toBe(true);
    expect(result.restrictionMessage).toBeNull();
    expect(mockUserRepo.findByContractNumber).toHaveBeenCalledWith(
      'CONTRACT-001',
    );
    expect(mockHashService.compare).toHaveBeenCalledWith(
      'password123',
      'hashed-pw',
    );
    expect(mockAccountRepo.findById).toHaveBeenCalledWith('account-1');
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

  it('should allow login but restrict OTT when ISP service is SUSPENDIDO', async () => {
    mockUserRepo.findByContractNumber.mockResolvedValue(activeClient);
    mockHashService.compare.mockResolvedValue(true);
    mockAccountRepo.findById.mockResolvedValue(suspendedAccount);
    mockTokenService.generateTokenPair.mockResolvedValue(tokenPair);
    mockHashService.hash.mockResolvedValue('hashed-refresh');
    mockSessionRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      contractNumber: 'CONTRACT-001',
      password: 'password123',
      deviceId: 'device-1',
    });

    // Auth succeeds but OTT access is restricted
    expect(result.accessToken).toBe('access-token');
    expect(result.canAccessOtt).toBe(false);
    expect(result.restrictionMessage).toContain('SUSPENDIDO');
    // Should NOT fetch entitlements when OTT is restricted
    expect(mockBillingGateway.getSubscriptionStatus).not.toHaveBeenCalled();
  });
});
