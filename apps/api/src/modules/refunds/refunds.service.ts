import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserData } from '../auth/current-user.decorator';
import { toRefundRequest, type RefundRequestResult } from './refunds.types';
import { AsyncTaskService } from '../app/async-task.service';
import { JobQueueService } from '../app/job-queue.service';
import { JobWorkerService } from '../app/job-worker.service';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asyncTask: AsyncTaskService,
    private readonly jobQueue: JobQueueService,
    private readonly jobWorker: JobWorkerService
  ) {}

  async createRequest(
    user: CurrentUserData,
    input: { bookingId: string; reason: string; refundAmount: string; currency: string }
  ): Promise<RefundRequestResult> {
    if (user.role !== 'agent') {
      throw new BadRequestException('Only agents can request refunds');
    }
    if (!user.agencyId) {
      throw new BadRequestException('User has no agency');
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: input.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.agencyId !== user.agencyId) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed bookings can be refunded');
    }

    // Check for existing pending refund on same booking
    const existing = await this.prisma.refundRequest.findFirst({
      where: { bookingId: input.bookingId, status: 'pending' }
    });
    if (existing) {
      throw new BadRequestException('A pending refund request already exists for this booking');
    }

    const created = await this.prisma.refundRequest.create({
      data: {
        bookingId: input.bookingId,
        agencyId: user.agencyId,
        requestedBy: user.sub,
        reason: input.reason,
        refundAmount: parseFloat(input.refundAmount),
        currency: input.currency
      }
    });

    return toRefundRequest(created);
  }

  async listRequests(
    user: CurrentUserData,
    input: { status?: string; agencyId?: string; limit?: number; offset?: number }
  ): Promise<{ items: RefundRequestResult[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (user.role === 'agent') {
      if (!user.agencyId) throw new BadRequestException('User has no agency');
      where.agencyId = user.agencyId;
    } else if (input.agencyId) {
      where.agencyId = input.agencyId;
    }

    if (input.status) {
      where.status = input.status;
    }

    const [total, rows] = await Promise.all([
      this.prisma.refundRequest.count({ where }),
      this.prisma.refundRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: input.offset,
        take: input.limit ?? 20
      })
    ]);

    return { items: rows.map(toRefundRequest), total };
  }

  async approveRequest(user: CurrentUserData, id: string, note?: string): Promise<RefundRequestResult> {
    if (user.role !== 'admin') {
      throw new BadRequestException('Only admins can approve refund requests');
    }

    const request = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Refund request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be approved');
    }

    const updated = await this.prisma.refundRequest.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy: user.sub,
        reviewNote: note ?? null,
        reviewedAt: new Date()
      }
    });

    return toRefundRequest(updated);
  }

  async rejectRequest(user: CurrentUserData, id: string, note?: string): Promise<RefundRequestResult> {
    if (user.role !== 'admin') {
      throw new BadRequestException('Only admins can reject refund requests');
    }

    const request = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Refund request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const updated = await this.prisma.refundRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedBy: user.sub,
        reviewNote: note ?? null,
        reviewedAt: new Date()
      }
    });

    return toRefundRequest(updated);
  }

  async markProcessed(user: CurrentUserData, id: string): Promise<RefundRequestResult> {
    if (user.role !== 'admin') {
      throw new BadRequestException('Only admins can mark refunds as processed');
    }

    const request = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Refund request not found');
    if (request.status !== 'approved') {
      throw new BadRequestException('Only approved requests can be marked as processed');
    }

    const job = await this.jobQueue.enqueue({
      type: 'refund.process',
      dedupeKey: `refund-process:${id}`,
      payload: { refundRequestId: id, bookingId: request.bookingId }
    });

    await this.jobWorker.process(job.id, async (payload) => {
      const data = payload as { refundRequestId: string; bookingId: string };
      await this.prisma.refundRequest.update({
        where: { id: data.refundRequestId },
        data: { status: 'processed' }
      });
      await this.prisma.booking.update({
        where: { id: data.bookingId },
        data: { status: 'cancelled' }
      });
    });

    const updated = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!updated) {
      throw new NotFoundException('Refund request not found after processing');
    }

    return toRefundRequest(updated);
  }
}
