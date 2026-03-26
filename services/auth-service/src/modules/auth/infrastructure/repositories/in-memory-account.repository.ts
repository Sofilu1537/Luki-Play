import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  Account,
  ContractType,
  ServiceStatus,
  SubscriptionStatus,
} from '../../domain/entities/account.entity';
import { AccountRepository } from '../../domain/interfaces/account.repository';

/**
 * In-memory account repository for development/testing.
 * Replace with TypeORM/Prisma repository for production.
 */
@Injectable()
export class InMemoryAccountRepository
  implements AccountRepository, OnModuleInit
{
  private readonly logger = new Logger(InMemoryAccountRepository.name);
  private accounts: Map<string, Account> = new Map();

  onModuleInit(): void {
    this.logger.log('Seeding in-memory account repository...');

    const seedAccounts: Account[] = [
      new Account({
        id: 'acc-001',
        contractNumber: 'CONTRACT-001',
        contractType: ContractType.ISP,
        isIspCustomer: true,
        planId: 'plan-basic',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        serviceStatus: ServiceStatus.ACTIVO,
        maxDevices: 2,
      }),
      new Account({
        id: 'acc-002',
        contractNumber: 'CONTRACT-002',
        contractType: ContractType.ISP,
        isIspCustomer: true,
        planId: 'plan-premium',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        serviceStatus: ServiceStatus.ACTIVO,
        maxDevices: 5,
      }),
      new Account({
        id: 'acc-003',
        contractNumber: 'CONTRACT-003',
        contractType: ContractType.ISP,
        isIspCustomer: true,
        planId: 'plan-family',
        subscriptionStatus: SubscriptionStatus.SUSPENDED,
        serviceStatus: ServiceStatus.SUSPENDIDO,
        maxDevices: 8,
      }),
      new Account({
        id: 'acc-004',
        contractNumber: 'CONTRACT-004',
        contractType: ContractType.ISP,
        isIspCustomer: true,
        planId: 'plan-basic',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        serviceStatus: ServiceStatus.CORTESIA,
        maxDevices: 2,
      }),
      new Account({
        id: 'acc-ott-001',
        contractNumber: 'OTT-000001',
        contractType: ContractType.OTT_ONLY,
        isIspCustomer: false,
        planId: 'plan-ott-basic',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        serviceStatus: null,
        maxDevices: 3,
      }),
    ];

    for (const account of seedAccounts) {
      this.accounts.set(account.id, account);
    }
    this.logger.log(`Seeded ${seedAccounts.length} accounts`);
  }

  async findById(id: string): Promise<Account | null> {
    return Promise.resolve(this.accounts.get(id) ?? null);
  }

  async findByContractNumber(contractNumber: string): Promise<Account | null> {
    for (const account of this.accounts.values()) {
      if (account.contractNumber === contractNumber) {
        return Promise.resolve(account);
      }
    }
    return Promise.resolve(null);
  }

  async save(account: Account): Promise<Account> {
    this.accounts.set(account.id, account);
    return Promise.resolve(account);
  }
}
