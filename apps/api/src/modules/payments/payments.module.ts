import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AsyncTaskModule } from '../app/async-task.module';

@Module({
  imports: [PrismaModule, AsyncTaskModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
