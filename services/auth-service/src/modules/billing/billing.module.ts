import { Module } from '@nestjs/common';
import { BILLING_GATEWAY } from './domain/interfaces/billing.gateway';
import { MockBillingGateway } from './infrastructure/adapters/mock-billing.gateway';

@Module({
  providers: [
    {
      provide: BILLING_GATEWAY,
      useClass: MockBillingGateway,
    },
  ],
  exports: [BILLING_GATEWAY],
})
export class BillingModule {}
