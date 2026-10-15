import { Module } from '@nestjs/common';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import { AuditModule } from '../audit/audit.module';
import { AsyncTaskModule } from '../app/async-task.module';

@Module({
  imports: [AuditModule, AsyncTaskModule],
  providers: [RefundsService],
  controllers: [RefundsController],
  exports: [RefundsService]
})
export class RefundsModule {}
