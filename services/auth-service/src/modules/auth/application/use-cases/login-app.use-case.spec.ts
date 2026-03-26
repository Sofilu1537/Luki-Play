/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { UnauthorizedException } from '@nestjs/common';
import { LoginAppUseCase } from './login-app.use-case';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
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

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new LoginAppUseCase(
      mockUserRepo as any,
      mockAccountRepo as any,
      mockTokenService as any,
      mockHashService as any,
      mockOtpService as any,
    );
  });

  it('should validate credentials and return login challenge with OTP sent', async () => {
    mockUserRepo.findByContractNumber.mockResolvedValue(activeClient);
    mockHashService.compare.mockResolvedValue(true);
    mockAccountRepo.findById.mockResolvedValue(activeAccount);
    mockOtpService.generateAndSend.mockResolvedValue(undefined);
    mockTokenService.generateLoginChallenge.mockResolvedValue(
      'login-challenge-token',
    );

    const result = await useCase.execute({
      contractNumber: 'CONTRACT-001',
      password: 'password123',
      deviceId: 'device-1',
    });

    // Should return challenge, NOT JWT tokens
    expect(result.otpRequired).toBe(true);
    expect(result.loginToken).toBe('login-challenge-token');
    expect(result.message).toContain('OTP');
    expect(result.canAccessOtt).toBe(true);
    expect(result.restrictionMessage).toBeNull();

    // Should NOT have accessToken or refreshToken
    expect(result).not.toHaveProperty('accessToken');
    expect(result).not.toHaveProperty('refreshToken');

    // Verify OTP was sent
    expect(mockOtpService.generateAndSend).toHaveBeenCalledWith(
      'user-1',
      'client@test.com',
    );
    // Verify login challenge token was generated
    expect(mockTokenService.generateLoginChallenge).toHaveBeenCalledWith({
      sub: 'user-1',
      deviceId: 'device-1',
      aud: 'app',
    });
    // Should NOT generate JWT or save session
    expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
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

    // Should NOT send OTP when password is wrong
    expect(mockOtpService.generateAndSend).not.toHaveBeenCalled();
  });

  it('should return challenge with OTT restriction when ISP service is SUSPENDIDO', async () => {
    mockUserRepo.findByContractNumber.mockResolvedValue(activeClient);
    mockHashService.compare.mockResolvedValue(true);
    mockAccountRepo.findById.mockResolvedValue(suspendedAccount);
    mockOtpService.generateAndSend.mockResolvedValue(undefined);
    mockTokenService.generateLoginChallenge.mockResolvedValue(
      'challenge-token',
    );

    const result = await useCase.execute({
      contractNumber: 'CONTRACT-001',
      password: 'password123',
      deviceId: 'device-1',
    });

    // Challenge is still returned (auth succeeds, OTT is restricted)
    expect(result.otpRequired).toBe(true);
    expect(result.loginToken).toBe('challenge-token');
    expect(result.canAccessOtt).toBe(false);
    expect(result.restrictionMessage).toContain('SUSPENDIDO');

    // OTP should still be sent even if OTT is restricted
    expect(mockOtpService.generateAndSend).toHaveBeenCalled();
  });

  it('should throw when user has no email registered', async () => {
    const noEmailUser = new User({
      ...activeClient,
      email: '',
      createdAt: new Date(),
    });
    mockUserRepo.findByContractNumber.mockResolvedValue(noEmailUser);
    mockHashService.compare.mockResolvedValue(true);
    mockAccountRepo.findById.mockResolvedValue(activeAccount);

    await expect(
      useCase.execute({
        contractNumber: 'CONTRACT-001',
        password: 'password123',
        deviceId: 'device-1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
