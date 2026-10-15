import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class AdminJobsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async list(input: { status?: 'pending' | 'processing' | 'completed' | 'failed'; type?: string; limit?: number; offset?: number }) {
    const where = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.type ? { type: input.type } : {})
    };
    const [total, items] = await Promise.all([
      this.prisma.asyncJob.count({ where }),
      this.prisma.asyncJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: input.limit ?? 50,
        skip: input.offset ?? 0
      })
    ]);
    return { total, items };
  }

  async getById(id: string) {
    const job = await this.prisma.asyncJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async retry(id: string) {
    const job = await this.prisma.asyncJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const updated = await this.prisma.asyncJob.update({
      where: { id },
      data: {
        status: 'pending',
        runAfter: new Date(),
        lastError: null
      }
    });
    return updated;
  }

  async triggerNow(id: string) {
    const job = await this.prisma.asyncJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    await this.prisma.asyncJob.update({
      where: { id },
      data: {
        status: 'pending',
        runAfter: new Date()
      }
    });
    return this.getById(id);
  }

  async cloneAsNew(id: string) {
    const job = await this.prisma.asyncJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const created = await this.prisma.asyncJob.create({
      data: {
        type: job.type,
        payload: job.payload as Prisma.InputJsonValue,
        status: 'pending',
        runAfter: new Date(),
        maxAttempts: job.maxAttempts,
        attempts: 0,
        lastError: null,
        dedupeKey: null
      }
    });

    return created;
  }

  async scheduleReconciliationCheck(input?: { agencyId?: string; runAfter?: string }) {
    const runAfter = input?.runAfter ? new Date(input.runAfter) : new Date();
    return this.prisma.asyncJob.create({
      data: {
        type: 'reconciliation.check',
        payload: {
          agencyId: input?.agencyId ?? null,
          source: 'admin-schedule'
        },
        status: 'pending',
        runAfter,
        maxAttempts: 3,
        attempts: 0,
        lastError: null,
        dedupeKey: null
      }
    });
  }
}
