import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { BILLING_GATEWAY } from '../../../billing/domain/interfaces/billing.gateway';
import type { BillingGateway } from '../../../billing/domain/interfaces/billing.gateway';
import { getPermissionsForRole } from '../../../access-control/domain/permissions';
import { UserProfileResponse } from '../dto/auth-response.dto';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(BILLING_GATEWAY) private readonly billingGateway: BillingGateway,
  ) {}

  async execute(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const permissions = getPermissionsForRole(user.role);
    let entitlements: string[] = [];
    if (user.isClient() && user.accountId) {
      const subscription = await this.billingGateway.getSubscriptionStatus(user.accountId);
      entitlements = subscription.entitlements;
    }

    return {
      id: user.id,
      contractNumber: user.contractNumber,
      email: user.email,
      role: user.role,
      status: user.status,
      accountId: user.accountId,
      permissions,
      entitlements,
    };
  }
}
