import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobWorkerService {
  private readonly logger = new Logger(JobWorkerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async process(jobId: string, handler: (payload: unknown) => Promise<void>): Promise<void> {
    const job = await this.prisma.asyncJob.findUnique({ where: { id: jobId } });
    if (!job) return;
    if (job.status === 'completed') return;
    if (job.status === 'failed' && job.attempts >= job.maxAttempts) return;

    await this.prisma.asyncJob.update({
      where: { id: jobId },
      data: { status: 'processing', attempts: { increment: 1 } }
    });

    try {
      await handler(job.payload);
      await this.prisma.asyncJob.update({
        where: { id: jobId },
        data: { status: 'completed', lastError: null }
      });
    } catch (error) {
      const refreshed = await this.prisma.asyncJob.findUnique({ where: { id: jobId } });
      const attempts = refreshed?.attempts ?? 1;
      const maxAttempts = refreshed?.maxAttempts ?? 5;
      const isFinal = attempts >= maxAttempts;
      await this.prisma.asyncJob.update({
        where: { id: jobId },
        data: {
          status: isFinal ? 'failed' : 'pending',
          runAfter: new Date(Date.now() + Math.min(60_000, attempts * 2_000)),
          lastError: error instanceof Error ? error.message : String(error)
        }
      });
      this.logger.warn(`Job ${jobId} failed on attempt ${attempts}/${maxAttempts}`);
      if (isFinal) {
        this.logger.error(`Job ${jobId} permanently failed`);
      }
      throw error;
    }
  }
}
