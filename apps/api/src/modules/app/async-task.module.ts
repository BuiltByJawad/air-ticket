import { Module } from '@nestjs/common';
import { AsyncTaskService } from './async-task.service';
import { JobQueueService } from './job-queue.service';
import { JobWorkerService } from './job-worker.service';
import { JobDispatcherService } from './job-dispatcher.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AsyncTaskService, JobQueueService, JobWorkerService, JobDispatcherService],
  exports: [AsyncTaskService, JobQueueService, JobWorkerService]
})
export class AsyncTaskModule {}
