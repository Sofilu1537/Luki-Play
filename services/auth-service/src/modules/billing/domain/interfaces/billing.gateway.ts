export const BILLING_GATEWAY = Symbol('BILLING_GATEWAY');

export interface ContractValidation {
  isValid: boolean;
  accountId: string | null;
  planId: string | null;
}

export interface SubscriptionInfo {
  status: 'active' | 'suspended' | 'cancelled';
  planId: string;
  maxDevices: number;
  canPlay: boolean;
  entitlements: string[];
}

export interface BillingGateway {
  validateContract(contractNumber: string): Promise<ContractValidation>;
  getSubscriptionStatus(accountId: string): Promise<SubscriptionInfo>;
}
