import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SESSION_REPOSITORY } from '../../domain/interfaces/session.repository';
import type { SessionRepository } from '../../domain/interfaces/session.repository';

@Injectable()
export class RevokeSessionUseCase {
  private readonly logger = new Logger(RevokeSessionUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException("Cannot revoke another user's session");
    }

    await this.sessionRepo.deleteById(sessionId);
    this.logger.log(`Session ${sessionId} revoked by user ${userId}`);
  }
}
