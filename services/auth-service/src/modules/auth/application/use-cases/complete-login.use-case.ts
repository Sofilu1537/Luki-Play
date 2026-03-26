import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { ACCOUNT_REPOSITORY } from '../../domain/interfaces/account.repository';
import type { AccountRepository } from '../../domain/interfaces/account.repository';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service';
import type { TokenService } from '../../domain/interfaces/token.service';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { OTP_SERVICE } from '../../domain/interfaces/otp.service';
import type { OtpService } from '../../domain/interfaces/otp.service';
import { BILLING_GATEWAY } from '../../../billing/domain/interfaces/billing.gateway';
import type { BillingGateway } from '../../../billing/domain/interfaces/billing.gateway';
import { Audience, Session } from '../../domain/entities/session.entity';
import { getPermissionsForRole } from '../../../access-control/domain/permissions';
import { VerifyLoginOtpDto } from '../dto/otp.dto';
import { AuthTokensResponse } from '../dto/auth-response.dto';
import { randomUUID } from 'crypto';

/**
 * Completes the two-phase app login flow.
 *
 * Phase 1 (LoginAppUseCase): validates credentials → sends OTP → returns loginToken
 * Phase 2 (this use case):   verifies loginToken + OTP → issues JWT + creates session
 */
@Injectable()
export class CompleteLoginUseCase {
  private readonly logger = new Logger(CompleteLoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepo: AccountRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
    @Inject(BILLING_GATEWAY) private readonly billingGateway: BillingGateway,
  ) {}

  async execute(dto: VerifyLoginOtpDto): Promise<AuthTokensResponse> {
    // 1. Verify the login challenge token
    let challenge: { sub: string; deviceId: string; aud: string };
    try {
      challenge = await this.tokenService.verifyLoginChallenge(dto.loginToken);
    } catch {
      this.logger.warn('Complete login failed: invalid or expired login token');
      throw new UnauthorizedException(
        'Invalid or expired login token. Please login again.',
      );
    }

    // 2. Verify OTP
    const otpValid = await this.otpService.verify(challenge.sub, dto.code);
    if (!otpValid) {
      this.logger.warn(
        `Complete login failed: invalid OTP for user ${challenge.sub}`,
      );
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // 3. Load user (must still be active)
    const user = await this.userRepo.findById(challenge.sub);
    if (!user || !user.isActive()) {
      throw new UnauthorizedException('Account is not active');
    }

    // 4. Evaluate OTT access
    let canAccessOtt = true;
    let restrictionMessage: string | null = null;
    let entitlements: string[] = [];

    if (user.accountId) {
      const account = await this.accountRepo.findById(user.accountId);
      if (account) {
        canAccessOtt = account.canAccessOtt;
        restrictionMessage = account.restrictionMessage;
      }

      if (canAccessOtt) {
        const subscription = await this.billingGateway.getSubscriptionStatus(
          user.accountId,
        );
        entitlements = subscription.entitlements;
      }
    }

    // 5. Generate JWT token pair
    const permissions = getPermissionsForRole(user.role);
    const tokenPair = await this.tokenService.generateTokenPair({
      sub: user.id,
      role: user.role,
      permissions,
      aud: challenge.aud,
      accountId: user.accountId,
      entitlements,
    });

    // 6. Save session
    const refreshTokenHash = await this.hashService.hash(
      tokenPair.refreshToken,
    );
    const session = new Session({
      id: randomUUID(),
      userId: user.id,
      deviceId: challenge.deviceId,
      audience: challenge.aud as Audience,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    });
    await this.sessionRepo.save(session);

    this.logger.log(`User ${user.id} completed login via APP (OTP verified)`);
    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      canAccessOtt,
      restrictionMessage,
    };
  }
}
