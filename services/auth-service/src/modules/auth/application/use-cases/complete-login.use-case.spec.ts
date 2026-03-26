/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { UnauthorizedException } from '@nestjs/common';
import { CompleteLoginUseCase } from './complete-login.use-case';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { Audience } from '../../domain/entities/session.entity';
import {
  Account,
  ContractType,
  ServiceStatus,
  SubscriptionStatus,
} from '../../domain/entities/account.entity';

describe('CompleteLoginUseCase', () => {
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
    generateLoginChallenge: jest.fn(),
    verifyLoginChallenge: jest.fn(),
  };

  const mockHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockOtpService = {
    generateAndSend: jest.fn(),
    verify: jest.fn(),
  };

  const mockBillingGateway = {
    validateContract: jest.fn(),
    getSubscriptionStatus: jest.fn(),
    getCustomerRecord: jest.fn(),
  };

  let useCase: CompleteLoginUseCase;

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

  const challengePayload = {
    sub: 'user-1',
    deviceId: 'device-1',
    aud: 'app',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CompleteLoginUseCase(
      mockUserRepo as any,
      mockSessionRepo as any,
      mockAccountRepo as any,
      mockTokenService as any,
      mockHashService as any,
      mockOtpService as any,
      mockBillingGateway as any,
    );
  });

  it('should issue JWT tokens after valid OTP verification', async () => {
    mockTokenService.verifyLoginChallenge.mockResolvedValue(challengePayload);
    mockOtpService.verify.mockResolvedValue(true);
    mockUserRepo.findById.mockResolvedValue(activeClient);
    mockAccountRepo.findById.mockResolvedValue(activeAccount);
    mockBillingGateway.getSubscriptionStatus.mockResolvedValue({
      canPlay: true,
      entitlements: ['hd', '4k'],
    });
    mockTokenService.generateTokenPair.mockResolvedValue(tokenPair);
    mockHashService.hash.mockResolvedValue('hashed-refresh');
    mockSessionRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      loginToken: 'valid-login-token',
      code: '123456',
    });

    // Should issue real JWT tokens
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.canAccessOtt).toBe(true);
    expect(result.restrictionMessage).toBeNull();

    // Verify OTP was checked
    expect(mockOtpService.verify).toHaveBeenCalledWith('user-1', '123456');
    // Verify JWT was generated with correct payload
    expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith({
      sub: 'user-1',
      role: UserRole.CLIENTE,
      permissions: ['app:playback', 'app:profiles'],
      aud: Audience.APP,
      accountId: 'account-1',
      entitlements: ['hd', '4k'],
    });
    // Verify session was saved
    expect(mockSessionRepo.save).toHaveBeenCalled();
  });

  it('should throw when login token is invalid', async () => {
    mockTokenService.verifyLoginChallenge.mockRejectedValue(
      new Error('Invalid token'),
    );

    await expect(
      useCase.execute({ loginToken: 'invalid-token', code: '123456' }),
    ).rejects.toThrow(UnauthorizedException);

    // Should NOT attempt OTP verification
    expect(mockOtpService.verify).not.toHaveBeenCalled();
  });

  it('should throw when OTP code is invalid', async () => {
    mockTokenService.verifyLoginChallenge.mockResolvedValue(challengePayload);
    mockOtpService.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({ loginToken: 'valid-token', code: 'wrong-code' }),
    ).rejects.toThrow(UnauthorizedException);

    // Should NOT generate JWT tokens
    expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
  });

  it('should throw when user is no longer active', async () => {
    const inactiveUser = new User({
      ...activeClient,
      status: UserStatus.INACTIVE,
      createdAt: new Date(),
    });
    mockTokenService.verifyLoginChallenge.mockResolvedValue(challengePayload);
    mockOtpService.verify.mockResolvedValue(true);
    mockUserRepo.findById.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({ loginToken: 'valid-token', code: '123456' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should issue tokens but restrict OTT when ISP is SUSPENDIDO', async () => {
    mockTokenService.verifyLoginChallenge.mockResolvedValue(challengePayload);
    mockOtpService.verify.mockResolvedValue(true);
    mockUserRepo.findById.mockResolvedValue(activeClient);
    mockAccountRepo.findById.mockResolvedValue(suspendedAccount);
    mockTokenService.generateTokenPair.mockResolvedValue(tokenPair);
    mockHashService.hash.mockResolvedValue('hashed-refresh');
    mockSessionRepo.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      loginToken: 'valid-token',
      code: '123456',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.canAccessOtt).toBe(false);
    expect(result.restrictionMessage).toContain('SUSPENDIDO');
    // Should NOT fetch entitlements when OTT is restricted
    expect(mockBillingGateway.getSubscriptionStatus).not.toHaveBeenCalled();
  });
});
