import { Module } from '@nestjs/common';
import { AdminJobsController } from './admin-jobs.controller';
import { AdminJobsService } from './admin-jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdminJobsController],
  providers: [AdminJobsService]
})
export class AdminJobsModule {}
