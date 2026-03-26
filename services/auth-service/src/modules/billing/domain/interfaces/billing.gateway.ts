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

/**
 * Full billing customer record as defined by the billing/ISP system.
 * This is the provisional data contract (aligned with the billing Excel model).
 */
export interface BillingCustomerRecord {
  contractNumber: string;
  customerName: string;
  identification: string;
  email: string;
  phone: string;
  serviceStatus: string; // ACTIVO | CORTESIA | PENDIENTE | SUSPENDIDO | ANULADO | CORTADO
  product: string;
  balance: number;
  lastStatusChangeDate: string;
  statusReason: string;
  statusNote: string;
  isIspCustomer: boolean;
  contractType: 'ISP' | 'OTT_ONLY';
  canAccessOtt: boolean;
  restrictionMessage: string | null;
}

export interface BillingGateway {
  validateContract(contractNumber: string): Promise<ContractValidation>;
  getSubscriptionStatus(accountId: string): Promise<SubscriptionInfo>;
  /** Retrieve full billing customer record by contract number */
  getCustomerRecord(
    contractNumber: string,
  ): Promise<BillingCustomerRecord | null>;
}
