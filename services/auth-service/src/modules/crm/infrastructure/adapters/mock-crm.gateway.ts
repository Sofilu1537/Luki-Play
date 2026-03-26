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
      identification: 'ID-10001',
      email: 'juan@example.com',
      phone: '+57300111222',
      accountId: 'acc-001',
      status: 'active',
      contractType: 'ISP',
      isIspCustomer: true,
    },
    'CONTRACT-002': {
      contractNumber: 'CONTRACT-002',
      name: 'María García',
      identification: 'ID-10002',
      email: 'maria@example.com',
      phone: '+57300333444',
      accountId: 'acc-002',
      status: 'active',
      contractType: 'ISP',
      isIspCustomer: true,
    },
    'CONTRACT-003': {
      contractNumber: 'CONTRACT-003',
      name: 'Carlos López',
      identification: 'ID-10003',
      email: 'carlos@example.com',
      phone: '+57300555666',
      accountId: 'acc-003',
      status: 'inactive',
      contractType: 'ISP',
      isIspCustomer: true,
    },
    'CONTRACT-004': {
      contractNumber: 'CONTRACT-004',
      name: 'Ana Martínez',
      identification: 'ID-10004',
      email: 'ana@example.com',
      phone: '+57300777888',
      accountId: 'acc-004',
      status: 'active',
      contractType: 'ISP',
      isIspCustomer: true,
    },
    'OTT-000001': {
      contractNumber: 'OTT-000001',
      name: 'Pedro Ramírez',
      identification: 'ID-20001',
      email: 'pedro@example.com',
      phone: '+57300999000',
      accountId: 'acc-ott-001',
      status: 'active',
      contractType: 'OTT_ONLY',
      isIspCustomer: false,
    },
  };

  async getCustomerByContract(
    contractNumber: string,
  ): Promise<CustomerInfo | null> {
    this.logger.debug(`[MOCK] Getting customer by contract: ${contractNumber}`);
    return Promise.resolve(this.mockCustomers[contractNumber] ?? null);
  }
}
