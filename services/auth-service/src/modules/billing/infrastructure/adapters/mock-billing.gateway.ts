import { Injectable, Logger } from '@nestjs/common';
import {
  BillingGateway,
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
}
