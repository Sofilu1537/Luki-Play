import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { ACCOUNT_REPOSITORY } from '../../domain/interfaces/account.repository';
import type { AccountRepository } from '../../domain/interfaces/account.repository';
import { TOKEN_SERVICE } from '../../domain/interfaces/token.service';
import type { TokenService } from '../../domain/interfaces/token.service';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { OTP_SERVICE } from '../../domain/interfaces/otp.service';
import type { OtpService } from '../../domain/interfaces/otp.service';
import { Audience } from '../../domain/entities/session.entity';
import { LoginAppDto } from '../dto/login-app.dto';
import { LoginChallengeResponse } from '../dto/auth-response.dto';

@Injectable()
export class LoginAppUseCase {
  private readonly logger = new Logger(LoginAppUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepo: AccountRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
  ) {}

  async execute(dto: LoginAppDto): Promise<LoginChallengeResponse> {
    const user = await this.userRepo.findByContractNumber(dto.contractNumber);
    if (!user) {
      this.logger.warn(
        `Login failed: contract not found ${dto.contractNumber}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive()) {
      this.logger.warn(`Login failed: user inactive ${user.id}`);
      throw new UnauthorizedException('Account is not active');
    }

    if (!user.isClient()) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.hashService.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      this.logger.warn(`Login failed: invalid password for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Evaluate OTT access via Account entity (ISP status / OTT-only subscription)
    let canAccessOtt = true;
    let restrictionMessage: string | null = null;

    if (user.accountId) {
      const account = await this.accountRepo.findById(user.accountId);
      if (account) {
        canAccessOtt = account.canAccessOtt;
        restrictionMessage = account.restrictionMessage;
      }
    }

    // Send OTP to user's email
    if (!user.email) {
      this.logger.warn(`Login failed: no email registered for user ${user.id}`);
      throw new UnauthorizedException(
        'No email registered. Please contact support to register your email.',
      );
    }
    await this.otpService.generateAndSend(user.id, user.email);

    // Generate short-lived login challenge token (NOT the real JWT)
    const loginToken = await this.tokenService.generateLoginChallenge({
      sub: user.id,
      deviceId: dto.deviceId,
      aud: Audience.APP,
    });

    this.logger.log(
      `User ${user.id} credentials validated, OTP sent. Awaiting OTP verification.`,
    );
    return {
      otpRequired: true,
      loginToken,
      message: 'OTP sent to registered email',
      canAccessOtt,
      restrictionMessage,
    };
  }
}
