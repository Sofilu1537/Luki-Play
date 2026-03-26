export enum SubscriptionStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export enum ContractType {
  ISP = 'ISP',
  OTT_ONLY = 'OTT_ONLY',
}

/** ISP service states as defined by the billing/ISP system */
export enum ServiceStatus {
  ACTIVO = 'ACTIVO',
  CORTESIA = 'CORTESIA',
  PENDIENTE = 'PENDIENTE',
  SUSPENDIDO = 'SUSPENDIDO',
  ANULADO = 'ANULADO',
  CORTADO = 'CORTADO',
}

/** States that allow OTT access */
const OTT_ALLOWED_STATES: ReadonlySet<ServiceStatus> = new Set([
  ServiceStatus.ACTIVO,
  ServiceStatus.CORTESIA,
]);

export class Account {
  readonly id: string;
  readonly contractNumber: string;
  readonly contractType: ContractType;
  readonly isIspCustomer: boolean;
  readonly planId: string;
  subscriptionStatus: SubscriptionStatus;
  serviceStatus: ServiceStatus | null;
  readonly maxDevices: number;

  constructor(props: {
    id: string;
    contractNumber: string;
    contractType: ContractType;
    isIspCustomer: boolean;
    planId: string;
    subscriptionStatus: SubscriptionStatus;
    serviceStatus: ServiceStatus | null;
    maxDevices: number;
  }) {
    this.id = props.id;
    this.contractNumber = props.contractNumber;
    this.contractType = props.contractType;
    this.isIspCustomer = props.isIspCustomer;
    this.planId = props.planId;
    this.subscriptionStatus = props.subscriptionStatus;
    this.serviceStatus = props.serviceStatus;
    this.maxDevices = props.maxDevices;
  }

  isSubscriptionActive(): boolean {
    return this.subscriptionStatus === SubscriptionStatus.ACTIVE;
  }

  /**
   * Determines if the account can access OTT content.
   * ISP customers depend on their ISP serviceStatus.
   * OTT-only customers depend on their subscription status.
   */
  get canAccessOtt(): boolean {
    if (this.contractType === ContractType.OTT_ONLY) {
      return this.isSubscriptionActive();
    }
    // ISP customer: check ISP service status
    if (!this.serviceStatus) return false;
    return OTT_ALLOWED_STATES.has(this.serviceStatus);
  }

  /**
   * Returns a restriction message if OTT access is blocked, or null if allowed.
   */
  get restrictionMessage(): string | null {
    if (this.canAccessOtt) return null;
    if (this.contractType === ContractType.OTT_ONLY) {
      return 'Tu suscripción OTT no se encuentra activa.';
    }
    const status = this.serviceStatus ?? 'DESCONOCIDO';
    return `Tu acceso a Luki OTT está restringido porque tu servicio se encuentra en estado ${status}.`;
  }
}
