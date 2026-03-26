export const CRM_GATEWAY = Symbol('CRM_GATEWAY');

export interface CustomerInfo {
  contractNumber: string;
  name: string;
  email: string;
  accountId: string;
  status: 'active' | 'inactive';
}

export interface CrmGateway {
  getCustomerByContract(contractNumber: string): Promise<CustomerInfo | null>;
}
