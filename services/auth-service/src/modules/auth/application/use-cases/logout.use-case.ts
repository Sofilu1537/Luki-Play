import { Inject, Injectable, Logger } from '@nestjs/common';
import { SESSION_REPOSITORY, SessionRepository } from '../../domain/interfaces/session.repository';
import { HASH_SERVICE, HashService } from '../../domain/interfaces/hash.service';

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
  ) {}

  async execute(userId: string, refreshToken: string): Promise<void> {
    const sessions = await this.sessionRepo.findByUserId(userId);
    for (const session of sessions) {
      const matches = await this.hashService.compare(refreshToken, session.refreshTokenHash);
      if (matches) {
        await this.sessionRepo.deleteById(session.id);
        this.logger.log(`User ${userId} logged out, session ${session.id} removed`);
        return;
      }
    }
    this.logger.warn(`Logout: no matching session found for user ${userId}`);
  }
}
