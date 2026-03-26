import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/interfaces/user.repository';
import * as bcrypt from 'bcrypt';

/**
 * In-memory user repository for development/testing.
 * Replace with TypeORM/Prisma repository for production.
 */
@Injectable()
export class InMemoryUserRepository implements UserRepository, OnModuleInit {
  private readonly logger = new Logger(InMemoryUserRepository.name);
  private users: Map<string, User> = new Map();

  async onModuleInit(): Promise<void> {
    this.logger.log('Seeding in-memory user repository...');
    const hash = await bcrypt.hash('password123', 12);

    const seedUsers: User[] = [
      new User({
        id: 'usr-001',
        contractNumber: 'CONTRACT-001',
        email: 'juan@example.com',
        passwordHash: hash,
        role: UserRole.CLIENTE,
        status: UserStatus.ACTIVE,
        accountId: 'acc-001',
        createdAt: new Date(),
      }),
      new User({
        id: 'usr-002',
        contractNumber: 'CONTRACT-002',
        email: 'maria@example.com',
        passwordHash: hash,
        role: UserRole.CLIENTE,
        status: UserStatus.ACTIVE,
        accountId: 'acc-002',
        createdAt: new Date(),
      }),
      new User({
        id: 'usr-003',
        contractNumber: 'CONTRACT-003',
        email: 'carlos@example.com',
        passwordHash: hash,
        role: UserRole.CLIENTE,
        status: UserStatus.ACTIVE,
        accountId: 'acc-003',
        createdAt: new Date(),
      }),
      new User({
        id: 'usr-admin-001',
        contractNumber: null,
        email: 'admin@lukiplay.com',
        passwordHash: hash,
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        accountId: null,
        createdAt: new Date(),
      }),
      new User({
        id: 'usr-soporte-001',
        contractNumber: null,
        email: 'soporte@lukiplay.com',
        passwordHash: hash,
        role: UserRole.SOPORTE,
        status: UserStatus.ACTIVE,
        accountId: null,
        createdAt: new Date(),
      }),
    ];

    for (const user of seedUsers) {
      this.users.set(user.id, user);
    }
    this.logger.log(`Seeded ${seedUsers.length} users`);
  }

  async findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  async findByContractNumber(contractNumber: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.contractNumber === contractNumber) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
    }
    return Promise.resolve();
  }
}
