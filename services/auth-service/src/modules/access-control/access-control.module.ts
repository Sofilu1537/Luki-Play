import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import { PermissionsGuard } from '../auth/presentation/guards/permissions.guard';
import { AudienceGuard } from '../auth/presentation/guards/audience.guard';

@Module({
  providers: [RolesGuard, PermissionsGuard, AudienceGuard],
  exports: [RolesGuard, PermissionsGuard, AudienceGuard],
})
export class AccessControlModule {}
