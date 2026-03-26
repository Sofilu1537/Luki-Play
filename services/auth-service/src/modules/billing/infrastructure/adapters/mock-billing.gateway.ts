import { Injectable, Logger } from '@nestjs/common';
import {
  BillingGateway,
  BillingCustomerRecord,
  ContractValidation,
  SubscriptionInfo,
} from '../../domain/interfaces/billing.gateway';

/**
 * Mock implementation of BillingGateway.
 * Replace with HTTP client adapter when real billing API is available.
 */
@Injectable()
export class MockBillingGateway implements BillingGateway {
  private readonly logger = new Logger(MockBillingGateway.name);

  private readonly mockContracts: Record<
    string,
    { accountId: string; planId: string }
  > = {
    'CONTRACT-001': { accountId: 'acc-001', planId: 'plan-basic' },
    'CONTRACT-002': { accountId: 'acc-002', planId: 'plan-premium' },
    'CONTRACT-003': { accountId: 'acc-003', planId: 'plan-family' },
    'CONTRACT-004': { accountId: 'acc-004', planId: 'plan-basic' },
    'OTT-000001': { accountId: 'acc-ott-001', planId: 'plan-ott-basic' },
  };

  private readonly mockSubscriptions: Record<string, SubscriptionInfo> = {
    'acc-001': {
      status: 'active',
      planId: 'plan-basic',
      maxDevices: 2,
      canPlay: true,
      entitlements: ['live-tv', 'vod-basic'],
    },
    'acc-002': {
      status: 'active',
      planId: 'plan-premium',
      maxDevices: 5,
      canPlay: true,
      entitlements: ['live-tv', 'vod-basic', 'vod-premium', '4k', 'downloads'],
    },
    'acc-003': {
      status: 'suspended',
      planId: 'plan-family',
      maxDevices: 8,
      canPlay: false,
      entitlements: [],
    },
    'acc-004': {
      status: 'active',
      planId: 'plan-basic',
      maxDevices: 2,
      canPlay: true,
      entitlements: ['live-tv', 'vod-basic'],
    },
    'acc-ott-001': {
      status: 'active',
      planId: 'plan-ott-basic',
      maxDevices: 3,
      canPlay: true,
      entitlements: ['live-tv', 'vod-basic'],
    },
  };

  /**
   * Full billing customer records with ISP service statuses.
   */
  private readonly mockCustomerRecords: Record<string, BillingCustomerRecord> =
    {
      'CONTRACT-001': {
        contractNumber: 'CONTRACT-001',
        customerName: 'Juan Pérez',
        identification: 'ID-10001',
        email: 'juan@example.com',
        phone: '+57300111222',
        serviceStatus: 'ACTIVO',
        product: 'Internet 50Mbps + Luki OTT',
        balance: 0,
        lastStatusChangeDate: '2025-01-15',
        statusReason: '',
        statusNote: '',
        isIspCustomer: true,
        contractType: 'ISP',
        canAccessOtt: true,
        restrictionMessage: null,
      },
      'CONTRACT-002': {
        contractNumber: 'CONTRACT-002',
        customerName: 'María García',
        identification: 'ID-10002',
        email: 'maria@example.com',
        phone: '+57300333444',
        serviceStatus: 'ACTIVO',
        product: 'Internet 100Mbps + Luki OTT Premium',
        balance: 0,
        lastStatusChangeDate: '2025-02-01',
        statusReason: '',
        statusNote: '',
        isIspCustomer: true,
        contractType: 'ISP',
        canAccessOtt: true,
        restrictionMessage: null,
      },
      'CONTRACT-003': {
        contractNumber: 'CONTRACT-003',
        customerName: 'Carlos López',
        identification: 'ID-10003',
        email: 'carlos@example.com',
        phone: '+57300555666',
        serviceStatus: 'SUSPENDIDO',
        product: 'Internet 30Mbps + Luki OTT',
        balance: 85000,
        lastStatusChangeDate: '2025-06-01',
        statusReason: 'Mora en pago',
        statusNote: 'Factura vencida hace 60 días',
        isIspCustomer: true,
        contractType: 'ISP',
        canAccessOtt: false,
        restrictionMessage:
          'Tu acceso a Luki OTT está restringido porque tu servicio se encuentra en estado SUSPENDIDO.',
      },
      'CONTRACT-004': {
        contractNumber: 'CONTRACT-004',
        customerName: 'Ana Martínez',
        identification: 'ID-10004',
        email: 'ana@example.com',
        phone: '+57300777888',
        serviceStatus: 'CORTESIA',
        product: 'Internet 50Mbps + Luki OTT (Cortesía)',
        balance: 0,
        lastStatusChangeDate: '2025-05-10',
        statusReason: 'Promoción especial',
        statusNote: 'Cortesía por evento FIFA 2026',
        isIspCustomer: true,
        contractType: 'ISP',
        canAccessOtt: true,
        restrictionMessage: null,
      },
      'OTT-000001': {
        contractNumber: 'OTT-000001',
        customerName: 'Pedro Ramírez',
        identification: 'ID-20001',
        email: 'pedro@example.com',
        phone: '+57300999000',
        serviceStatus: 'ACTIVO',
        product: 'Luki OTT Basic',
        balance: 0,
        lastStatusChangeDate: '2025-04-01',
        statusReason: '',
        statusNote: '',
        isIspCustomer: false,
        contractType: 'OTT_ONLY',
        canAccessOtt: true,
        restrictionMessage: null,
      },
    };

  async validateContract(contractNumber: string): Promise<ContractValidation> {
    this.logger.debug(`[MOCK] Validating contract: ${contractNumber}`);
    const contract = this.mockContracts[contractNumber];
    if (!contract) {
      return Promise.resolve({ isValid: false, accountId: null, planId: null });
    }
    return Promise.resolve({
      isValid: true,
      accountId: contract.accountId,
      planId: contract.planId,
    });
  }

  async getSubscriptionStatus(accountId: string): Promise<SubscriptionInfo> {
    this.logger.debug(`[MOCK] Getting subscription for account: ${accountId}`);
    const sub = this.mockSubscriptions[accountId];
    if (!sub) {
      return Promise.resolve({
        status: 'cancelled',
        planId: 'none',
        maxDevices: 0,
        canPlay: false,
        entitlements: [],
      });
    }
    return Promise.resolve(sub);
  }

  async getCustomerRecord(
    contractNumber: string,
  ): Promise<BillingCustomerRecord | null> {
    this.logger.debug(
      `[MOCK] Getting customer record for contract: ${contractNumber}`,
    );
    return Promise.resolve(this.mockCustomerRecords[contractNumber] ?? null);
  }
}
