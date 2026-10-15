import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AdminReconciliationController } from './admin-reconciliation.controller';
import { AdminReconciliationService } from './admin-reconciliation.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdminReconciliationController],
  providers: [AdminReconciliationService]
})
export class AdminReconciliationModule {}
