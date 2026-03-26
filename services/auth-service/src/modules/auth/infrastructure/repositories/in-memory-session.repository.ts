import { Injectable, Logger } from '@nestjs/common';
import { Session } from '../../domain/entities/session.entity';
import { SessionRepository } from '../../domain/interfaces/session.repository';

/**
 * In-memory session repository for development/testing.
 * Replace with Redis-backed repository for production.
 */
@Injectable()
export class InMemorySessionRepository implements SessionRepository {
  private readonly logger = new Logger(InMemorySessionRepository.name);
  private sessions: Map<string, Session> = new Map();

  async findById(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const result: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        result.push(session);
      }
    }
    return result;
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.refreshTokenHash === hash) {
        return session;
      }
    }
    return null;
  }

  async save(session: Session): Promise<Session> {
    this.sessions.set(session.id, session);
    return session;
  }

  async deleteById(id: string): Promise<void> {
    this.sessions.delete(id);
    this.logger.debug(`Session ${id} deleted`);
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }
    this.logger.debug(`All sessions deleted for user ${userId}`);
  }
}
