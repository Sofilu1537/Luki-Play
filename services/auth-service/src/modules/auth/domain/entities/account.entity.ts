export enum SubscriptionStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export class Account {
  readonly id: string;
  readonly planId: string;
  subscriptionStatus: SubscriptionStatus;
  readonly maxDevices: number;

  constructor(props: {
    id: string;
    planId: string;
    subscriptionStatus: SubscriptionStatus;
    maxDevices: number;
  }) {
    this.id = props.id;
    this.planId = props.planId;
    this.subscriptionStatus = props.subscriptionStatus;
    this.maxDevices = props.maxDevices;
  }

  isSubscriptionActive(): boolean {
    return this.subscriptionStatus === SubscriptionStatus.ACTIVE;
  }
}
