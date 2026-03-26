import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { HASH_SERVICE } from '../../domain/interfaces/hash.service';
import type { HashService } from '../../domain/interfaces/hash.service';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class ChangePasswordUseCase {
  private readonly logger = new Logger(ChangePasswordUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await this.hashService.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await this.hashService.hash(dto.newPassword);
    await this.userRepo.updatePassword(userId, newHash);

    // Invalidate all sessions to force re-login
    await this.sessionRepo.deleteAllByUserId(userId);
    this.logger.log(
      `Password changed for user ${userId}, all sessions revoked`,
    );
  }
}
