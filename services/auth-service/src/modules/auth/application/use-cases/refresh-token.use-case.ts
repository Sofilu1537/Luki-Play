import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service';
import type { TokenService, TokenPair, JwtPayload } from '../../domain/interfaces/token.service';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { Audience, Session } from '../../domain/entities/session.entity';
import { getPermissionsForRole } from '../../../access-control/domain/permissions';
import { BILLING_GATEWAY } from '../../../billing/domain/interfaces/billing.gateway';
import type { BillingGateway } from '../../../billing/domain/interfaces/billing.gateway';
import { UserRole } from '../../domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(BILLING_GATEWAY) private readonly billingGateway: BillingGateway,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find session by matching refresh token hash
    const sessions = await this.sessionRepo.findByUserId(payload.sub);
    let matchedSession: Session | null = null;
    for (const session of sessions) {
      const matches = await this.hashService.compare(refreshToken, session.refreshTokenHash);
      if (matches) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      // Possible token reuse attack - revoke all sessions
      this.logger.warn(`Refresh token reuse detected for user ${payload.sub}`);
      await this.sessionRepo.deleteAllByUserId(payload.sub);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (matchedSession.isExpired()) {
      await this.sessionRepo.deleteById(matchedSession.id);
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.isActive()) {
      await this.sessionRepo.deleteById(matchedSession.id);
      throw new UnauthorizedException('User not found or inactive');
    }

    const permissions = getPermissionsForRole(user.role);

    let entitlements: string[] = [];
    if (user.isClient() && user.accountId) {
      const subscription = await this.billingGateway.getSubscriptionStatus(user.accountId);
      entitlements = subscription.entitlements;
    }

    // Rotate refresh token
    await this.sessionRepo.deleteById(matchedSession.id);

    const newTokenPair = await this.tokenService.generateTokenPair({
      sub: user.id,
      role: user.role,
      permissions,
      aud: matchedSession.audience,
      accountId: user.accountId,
      entitlements,
    });

    const newRefreshTokenHash = await this.hashService.hash(newTokenPair.refreshToken);
    const expiresInMs = matchedSession.audience === Audience.CMS
      ? 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    const newSession = new Session({
      id: uuidv4(),
      userId: user.id,
      deviceId: matchedSession.deviceId,
      audience: matchedSession.audience,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + expiresInMs),
      createdAt: new Date(),
    });
    await this.sessionRepo.save(newSession);

    this.logger.log(`Token refreshed for user ${user.id}`);
    return newTokenPair;
  }
}
