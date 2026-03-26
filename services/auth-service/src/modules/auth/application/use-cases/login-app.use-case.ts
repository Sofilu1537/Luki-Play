import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service';
import type { TokenService, TokenPair } from '../../domain/interfaces/token.service';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { BILLING_GATEWAY } from '../../../billing/domain/interfaces/billing.gateway';
import type { BillingGateway } from '../../../billing/domain/interfaces/billing.gateway';
import { Audience, Session } from '../../domain/entities/session.entity';
import { getPermissionsForRole } from '../../../access-control/domain/permissions';
import { LoginAppDto } from '../dto/login-app.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoginAppUseCase {
  private readonly logger = new Logger(LoginAppUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(BILLING_GATEWAY) private readonly billingGateway: BillingGateway,
  ) {}

  async execute(dto: LoginAppDto): Promise<TokenPair> {
    const user = await this.userRepo.findByContractNumber(dto.contractNumber);
    if (!user) {
      this.logger.warn(`Login failed: contract not found ${dto.contractNumber}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive()) {
      this.logger.warn(`Login failed: user inactive ${user.id}`);
      throw new UnauthorizedException('Account is not active');
    }

    if (!user.isClient()) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.hashService.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      this.logger.warn(`Login failed: invalid password for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate subscription via billing gateway
    let entitlements: string[] = [];
    if (user.accountId) {
      const subscription = await this.billingGateway.getSubscriptionStatus(user.accountId);
      if (!subscription.canPlay) {
        this.logger.warn(`Login failed: subscription not active for account ${user.accountId}`);
        throw new UnauthorizedException('Subscription is not active');
      }
      entitlements = subscription.entitlements;
    }

    const permissions = getPermissionsForRole(user.role);

    const tokenPair = await this.tokenService.generateTokenPair({
      sub: user.id,
      role: user.role,
      permissions,
      aud: Audience.APP,
      accountId: user.accountId,
      entitlements,
    });

    // Save session
    const refreshTokenHash = await this.hashService.hash(tokenPair.refreshToken);
    const session = new Session({
      id: uuidv4(),
      userId: user.id,
      deviceId: dto.deviceId,
      audience: Audience.APP,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    });
    await this.sessionRepo.save(session);

    this.logger.log(`User ${user.id} logged in via APP`);
    return tokenPair;
  }
}
