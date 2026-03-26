import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { ACCOUNT_REPOSITORY } from '../../domain/interfaces/account.repository';
import type { AccountRepository } from '../../domain/interfaces/account.repository';
import { BILLING_GATEWAY } from '../../../billing/domain/interfaces/billing.gateway';
import type { BillingGateway } from '../../../billing/domain/interfaces/billing.gateway';
import { getPermissionsForRole } from '../../../access-control/domain/permissions';
import { UserProfileResponse } from '../dto/auth-response.dto';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepo: AccountRepository,
    @Inject(BILLING_GATEWAY) private readonly billingGateway: BillingGateway,
  ) {}

  async execute(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const permissions = getPermissionsForRole(user.role);
    let entitlements: string[] = [];
    let canAccessOtt = true;
    let restrictionMessage: string | null = null;
    let contractType: string | null = null;
    let serviceStatus: string | null = null;

    if (user.isClient() && user.accountId) {
      const account = await this.accountRepo.findById(user.accountId);
      if (account) {
        canAccessOtt = account.canAccessOtt;
        restrictionMessage = account.restrictionMessage;
        contractType = account.contractType;
        serviceStatus = account.serviceStatus;
      }

      if (canAccessOtt) {
        const subscription = await this.billingGateway.getSubscriptionStatus(
          user.accountId,
        );
        entitlements = subscription.entitlements;
      }
    }

    return {
      id: user.id,
      contractNumber: user.contractNumber,
      email: user.email,
      role: user.role,
      status: user.status,
      accountId: user.accountId,
      contractType,
      serviceStatus,
      canAccessOtt,
      restrictionMessage,
      permissions,
      entitlements,
    };
  }
}
