import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { loadEnv } from '../../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { AsyncTaskService } from '../app/async-task.service';
import { JobQueueService } from '../app/job-queue.service';
import type { CreatePaymentIntentInput, CreatePaymentIntentResult, PaymentConfirmation } from './payments.types';

type StripeClient = InstanceType<typeof Stripe>;

interface PaymentIntentObject {
  id: string;
  client_secret: string | null;
  metadata: Record<string, string> | null;
  status?: string;
}

@Injectable()
export class PaymentsService {
  private readonly stripe: StripeClient | null = null;
  private readonly webhookSecret: string | null = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asyncTask: AsyncTaskService,
    private readonly jobQueue: JobQueueService
  ) {
    const env = loadEnv();
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY);
      this.webhookSecret = env.STRIPE_WEBHOOK_SECRET ?? null;
      this.logger.log('Stripe provider initialized');
    } else {
      this.logger.warn('Stripe secret key not configured — payments will throw on use');
    }
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    this.ensureStripe();

    const amountCents = Math.round(parseFloat(input.amount) * 100);
    if (amountCents <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: input.bookingId } });
    if (booking) {
      const existingMeta = this.asObject(booking.metadata);
      const existingIntentId = typeof existingMeta.paymentIntentId === 'string' ? existingMeta.paymentIntentId : null;
      const existingStatus = typeof existingMeta.paymentStatus === 'string' ? existingMeta.paymentStatus : null;
      if (existingIntentId && (existingStatus === 'requires_payment_method' || existingStatus === 'requires_confirmation')) {
        this.logger.log(`Reusing existing PaymentIntent ${existingIntentId} for booking ${input.bookingId}`);
        return { clientSecret: '', paymentIntentId: existingIntentId };
      }
    }

    const intent = await this.stripe!.paymentIntents.create(
      {
        amount: amountCents,
        currency: input.currency.toLowerCase(),
        metadata: { bookingId: input.bookingId },
        automatic_payment_methods: { enabled: true }
      },
      {
        idempotencyKey: `pi-${input.bookingId}-${amountCents}-${input.currency.toLowerCase()}`
      }
    );

    await this.prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        status: 'payment',
        metadata: this.mergeMetadata(booking?.metadata, {
          paymentIntentId: intent.id,
          paymentStatus: 'requires_payment_method'
        })
      }
    });

    this.logger.log(`PaymentIntent ${intent.id} created for booking ${input.bookingId}`);

    return {
      clientSecret: intent.client_secret!,
      paymentIntentId: intent.id
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer): Promise<PaymentConfirmation | null> {
    this.ensureStripe();

    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    const event = this.stripe!.webhooks.constructEvent(rawBody, signature, this.webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as PaymentIntentObject;
      const bookingId = intent.metadata?.bookingId;

      if (!bookingId) {
        this.logger.warn(`PaymentIntent ${intent.id} succeeded but no bookingId in metadata`);
        return null;
      }

      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'confirmed',
            metadata: {
              paymentIntentId: intent.id,
              paymentStatus: 'succeeded'
            }
          }
        });
        return { bookingId, paymentIntentId: intent.id, status: 'succeeded' };
      }

      const bookingMeta = this.asObject(booking.metadata);
      if (event.id && bookingMeta.lastWebhookEventId === event.id) {
        this.logger.log(`Skipping duplicate webhook event ${event.id} for booking ${bookingId}`);
        return {
          bookingId,
          paymentIntentId: intent.id,
          status: 'succeeded'
        };
      }

      if (booking.status === 'cancelled') {
        this.logger.warn(`Ignoring succeeded payment webhook for cancelled booking ${bookingId}`);
        return null;
      }

      const job = await this.jobQueue.enqueue({
        type: 'payment.succeeded',
        dedupeKey: event.id ? `stripe:${event.id}` : `payment-succeeded:${bookingId}:${intent.id}`,
        payload: {
          bookingId,
          paymentIntentId: intent.id,
          eventId: event.id ?? null
        }
      });
      this.logger.log(`Enqueued payment success job ${job.id} for booking ${bookingId}`);

      this.logger.log(`Booking ${bookingId} confirmed via Stripe webhook`);

      return {
        bookingId,
        paymentIntentId: intent.id,
        status: 'succeeded'
      };
    }

    if (event.type === 'payment_intent.canceled') {
      const intent = event.data.object as PaymentIntentObject;
      const bookingId = intent.metadata?.bookingId;

      if (!bookingId) return null;

      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'cancelled',
            metadata: {
              paymentIntentId: intent.id,
              paymentStatus: 'canceled'
            }
          }
        });
        return { bookingId, paymentIntentId: intent.id, status: 'canceled' };
      }
      const bookingMeta = this.asObject(booking.metadata);
      if (event.id && bookingMeta.lastWebhookEventId === event.id) {
        this.logger.log(`Skipping duplicate webhook event ${event.id} for booking ${bookingId}`);
        return {
          bookingId,
          paymentIntentId: intent.id,
          status: 'canceled'
        };
      }

      const job = await this.jobQueue.enqueue({
        type: 'payment.canceled',
        dedupeKey: event.id ? `stripe:${event.id}` : `payment-canceled:${bookingId}:${intent.id}`,
        payload: {
          bookingId,
          paymentIntentId: intent.id,
          eventId: event.id ?? null
        }
      });
      this.logger.log(`Enqueued payment canceled job ${job.id} for booking ${bookingId}`);

      this.logger.log(`Booking ${bookingId} cancelled via Stripe webhook`);

      return {
        bookingId,
        paymentIntentId: intent.id,
        status: 'canceled'
      };
    }

    return null;
  }

  private ensureStripe(): void {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
    }
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
