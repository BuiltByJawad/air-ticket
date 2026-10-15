import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(private readonly prisma: PrismaService) {}

  async enqueue(input: {
    type: string;
    payload: Prisma.InputJsonValue;
    dedupeKey?: string;
    maxAttempts?: number;
  }): Promise<{ id: string; deduped: boolean }> {
    if (input.dedupeKey) {
      const existing = await this.prisma.asyncJob.findUnique({ where: { dedupeKey: input.dedupeKey } });
      if (existing && existing.status !== 'failed' && existing.status !== 'completed') {
        return { id: existing.id, deduped: true };
      }
    }

    const created = await this.prisma.asyncJob.create({
      data: {
        type: input.type,
        payload: input.payload,
        dedupeKey: input.dedupeKey,
        maxAttempts: input.maxAttempts ?? 5
      }
    });

    this.logger.log(`Enqueued job ${created.id} (${created.type})`);
    return { id: created.id, deduped: false };
  }
}
