export const CRM_GATEWAY = Symbol('CRM_GATEWAY');

export interface CustomerInfo {
  contractNumber: string;
  name: string;
  identification: string;
  email: string;
  phone: string;
  accountId: string;
  status: 'active' | 'inactive';
  contractType: 'ISP' | 'OTT_ONLY';
  isIspCustomer: boolean;
}

export interface CrmGateway {
  getCustomerByContract(contractNumber: string): Promise<CustomerInfo | null>;
}
