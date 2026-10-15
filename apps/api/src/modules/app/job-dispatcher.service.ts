import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobWorkerService } from './job-worker.service';
import type { Prisma } from '@prisma/client';
import { loadEnv } from '../../config/env';

type PaymentJobPayload = { bookingId: string; paymentIntentId: string; eventId?: string | null };
type RefundProcessPayload = { refundRequestId: string; bookingId: string };

@Injectable()
export class JobDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobDispatcherService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobWorker: JobWorkerService
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, 2000);
    this.timer.unref();
    this.logger.log('Job dispatcher started');
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const now = new Date();
      const jobs = await this.prisma.asyncJob.findMany({
        where: { status: 'pending', runAfter: { lte: now } },
        orderBy: { createdAt: 'asc' },
        take: 10
      });

      for (const job of jobs) {
        await this.jobWorker.process(job.id, async (payload) => this.handleJob(job.type, payload));
      }
      await this.checkAlertThresholds();
    } catch (error) {
      this.logger.error(`Dispatcher tick failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async checkAlertThresholds(): Promise<void> {
    const [failedCount, oldestPending] = await Promise.all([
      this.prisma.asyncJob.count({ where: { status: 'failed' } }),
      this.prisma.asyncJob.findFirst({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true, id: true }
      })
    ]);

    if (failedCount >= this.env.JOB_ALERT_FAILED_THRESHOLD) {
      this.logger.error(
        `ALERT: failed async jobs threshold breached (${failedCount} >= ${this.env.JOB_ALERT_FAILED_THRESHOLD})`
      );
    }

    if (oldestPending) {
      const ageMin = Math.floor((Date.now() - oldestPending.createdAt.getTime()) / 60000);
      if (ageMin >= this.env.JOB_ALERT_OLDEST_PENDING_MINUTES) {
        this.logger.warn(
          `ALERT: oldest pending job is stale (${ageMin}m >= ${this.env.JOB_ALERT_OLDEST_PENDING_MINUTES}m), jobId=${oldestPending.id}`
        );
      }
    }
  }

  private async handleJob(type: string, payload: unknown): Promise<void> {
    switch (type) {
      case 'payment.succeeded':
        await this.handlePaymentSucceeded(payload as PaymentJobPayload);
        return;
      case 'payment.canceled':
        await this.handlePaymentCanceled(payload as PaymentJobPayload);
        return;
      case 'refund.process':
        await this.handleRefundProcess(payload as RefundProcessPayload);
        return;
      default:
        throw new Error(`Unsupported job type: ${type}`);
    }
  }

  private async handlePaymentSucceeded(payload: PaymentJobPayload): Promise<void> {
    const booking = await this.prisma.booking.findUnique({ where: { id: payload.bookingId } });
    if (!booking) {
      throw new Error(`Booking ${payload.bookingId} not found for payment success`);
    }
    await this.prisma.booking.update({
      where: { id: payload.bookingId },
      data: {
        status: 'confirmed',
        metadata: this.mergeMetadata(booking.metadata, {
          paymentIntentId: payload.paymentIntentId,
          paymentStatus: 'succeeded',
          lastWebhookEventId: payload.eventId ?? undefined,
          lastWebhookEventAt: new Date().toISOString()
        })
      }
    });
  }

  private async handlePaymentCanceled(payload: PaymentJobPayload): Promise<void> {
    const booking = await this.prisma.booking.findUnique({ where: { id: payload.bookingId } });
    if (!booking) {
      throw new Error(`Booking ${payload.bookingId} not found for payment cancel`);
    }
    await this.prisma.booking.update({
      where: { id: payload.bookingId },
      data: {
        status: 'cancelled',
        metadata: this.mergeMetadata(booking.metadata, {
          paymentIntentId: payload.paymentIntentId,
          paymentStatus: 'canceled',
          lastWebhookEventId: payload.eventId ?? undefined,
          lastWebhookEventAt: new Date().toISOString()
        })
      }
    });
  }

  private async handleRefundProcess(payload: RefundProcessPayload): Promise<void> {
    await this.prisma.refundRequest.update({
      where: { id: payload.refundRequestId },
      data: { status: 'processed' }
    });
    await this.prisma.booking.update({
      where: { id: payload.bookingId },
      data: { status: 'cancelled' }
    });
  }

  private asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private mergeMetadata(existing: unknown, patch: Record<string, unknown>): Prisma.InputJsonValue {
    return {
      ...this.asObject(existing),
      ...patch
    } as Prisma.InputJsonValue;
  }
}
