import { Module } from '@nestjs/common';
import { CRM_GATEWAY } from './domain/interfaces/crm.gateway';
import { MockCrmGateway } from './infrastructure/adapters/mock-crm.gateway';

@Module({
  providers: [
    {
      provide: CRM_GATEWAY,
      useClass: MockCrmGateway,
    },
  ],
  exports: [CRM_GATEWAY],
})
export class CrmModule {}
