import { Injectable, Logger } from '@nestjs/common';
import { CrmGateway, CustomerInfo } from '../../domain/interfaces/crm.gateway';

/**
 * Mock implementation of CrmGateway.
 * Replace with HTTP client adapter when real CRM API is available.
 */
@Injectable()
export class MockCrmGateway implements CrmGateway {
  private readonly logger = new Logger(MockCrmGateway.name);

  private readonly mockCustomers: Record<string, CustomerInfo> = {
    'CONTRACT-001': {
      contractNumber: 'CONTRACT-001',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      accountId: 'acc-001',
      status: 'active',
    },
    'CONTRACT-002': {
      contractNumber: 'CONTRACT-002',
      name: 'María García',
      email: 'maria@example.com',
      accountId: 'acc-002',
      status: 'active',
    },
    'CONTRACT-003': {
      contractNumber: 'CONTRACT-003',
      name: 'Carlos López',
      email: 'carlos@example.com',
      accountId: 'acc-003',
      status: 'inactive',
    },
  };

  async getCustomerByContract(
    contractNumber: string,
  ): Promise<CustomerInfo | null> {
    this.logger.debug(`[MOCK] Getting customer by contract: ${contractNumber}`);
    return Promise.resolve(this.mockCustomers[contractNumber] ?? null);
  }
}
