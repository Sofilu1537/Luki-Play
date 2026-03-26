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
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service';
import type {
  TokenService,
  TokenPair,
} from '../../domain/interfaces/token.service';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { Audience, Session } from '../../domain/entities/session.entity';
import { getPermissionsForRole } from '../../../access-control/domain/permissions';
import { LoginCmsDto } from '../dto/login-cms.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LoginCmsUseCase {
  private readonly logger = new Logger(LoginCmsUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
  ) {}

  async execute(dto: LoginCmsDto): Promise<TokenPair> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`CMS login failed: email not found ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('Account is not active');
    }

    if (!user.isCmsUser()) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.hashService.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      this.logger.warn(
        `CMS login failed: invalid password for user ${user.id}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = getPermissionsForRole(user.role);

    const tokenPair = await this.tokenService.generateTokenPair({
      sub: user.id,
      role: user.role,
      permissions,
      aud: Audience.CMS,
      accountId: null,
      entitlements: [],
    });

    const refreshTokenHash = await this.hashService.hash(
      tokenPair.refreshToken,
    );
    const session = new Session({
      id: randomUUID(),
      userId: user.id,
      deviceId: dto.deviceId,
      audience: Audience.CMS,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day for CMS
      createdAt: new Date(),
    });
    await this.sessionRepo.save(session);

    this.logger.log(`CMS user ${user.id} logged in`);
    return tokenPair;
  }
}
