import { Test, type TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AsyncTaskService } from '../app/async-task.service';
import { JobQueueService } from '../app/job-queue.service';
import { JobWorkerService } from '../app/job-worker.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: { booking: { findUnique: jest.Mock; update: jest.Mock } };
  let lastJobPayload: unknown = null;

  beforeEach(async () => {
    prisma = {
      booking: {
        findUnique: jest.fn(),
        update: jest.fn()
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: AsyncTaskService,
          useValue: {
            runWithRetry: jest.fn(async (_name: string, task: () => Promise<unknown>) => task()),
            fireAndForget: jest.fn()
          }
        },
        {
          provide: JobQueueService,
          useValue: {
            enqueue: jest.fn(async (input: { payload: unknown }) => {
              lastJobPayload = input.payload;
              return { id: 'job-1', deduped: false };
            })
          }
        },
        {
          provide: JobWorkerService,
          useValue: {
            process: jest.fn(async (_id: string, handler: (payload: unknown) => Promise<void>) =>
              handler(lastJobPayload)
            )
          }
        }
      ]
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createPaymentIntent', () => {
    it('should throw when Stripe is not configured', async () => {
      await expect(service.createPaymentIntent({
        bookingId: 'b1',
        currency: 'USD',
        amount: '100.00'
      })).rejects.toThrow('Stripe is not configured');
    });

    it('should throw for non-positive amounts', async () => {
      (service as any).stripe = {};
      (service as any).stripe.paymentIntents = {
        create: jest.fn()
      };

      await expect(service.createPaymentIntent({
        bookingId: 'b1',
        currency: 'USD',
        amount: '0'
      })).rejects.toThrow('Payment amount must be greater than zero');
    });

    it('should create a PaymentIntent and update booking status to payment', async () => {
      const mockIntent = {
        id: 'pi_test123',
        client_secret: 'cs_test_secret'
      };

      (service as any).stripe = {
        paymentIntents: {
          create: jest.fn().mockResolvedValue(mockIntent)
        }
      };

      prisma.booking.findUnique.mockResolvedValue({ id: 'b1', metadata: null });
      prisma.booking.update.mockResolvedValue({ id: 'b1', status: 'payment' });

      const result = await service.createPaymentIntent({
        bookingId: 'b1',
        currency: 'USD',
        amount: '250.50'
      });

      expect(result).toEqual({
        clientSecret: 'cs_test_secret',
        paymentIntentId: 'pi_test123'
      });

      expect((service as any).stripe.paymentIntents.create).toHaveBeenCalledWith(
        {
          amount: 25050,
          currency: 'usd',
          metadata: { bookingId: 'b1' },
          automatic_payment_methods: { enabled: true }
        },
        { idempotencyKey: 'pi-b1-25050-usd' }
      );

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: {
          status: 'payment',
          metadata: {
            paymentIntentId: 'pi_test123',
            paymentStatus: 'requires_payment_method'
          }
        }
      });
    });
  });

  describe('handleWebhook', () => {
    it('should throw when Stripe is not configured', async () => {
      await expect(service.handleWebhook('sig', Buffer.from('')))
        .rejects.toThrow('Stripe is not configured');
    });

    it('should throw when webhook secret is not configured', async () => {
      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn()
        }
      };
      (service as any).webhookSecret = null;

      await expect(service.handleWebhook('sig', Buffer.from('')))
        .rejects.toThrow('STRIPE_WEBHOOK_SECRET not configured');
    });

    it('should confirm booking on payment_intent.succeeded', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            metadata: { bookingId: 'b1' }
          }
        }
      };

      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent)
        }
      };
      (service as any).webhookSecret = 'whsec_test';

      prisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'payment', metadata: null });
      prisma.booking.update.mockResolvedValue({ id: 'b1', status: 'confirmed' });

      const result = await service.handleWebhook('sig', Buffer.from('body'));

      expect(result).toEqual({
        bookingId: 'b1',
        paymentIntentId: 'pi_test123',
        status: 'succeeded'
      });

      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('should cancel booking on payment_intent.canceled', async () => {
      const mockEvent = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_test456',
            metadata: { bookingId: 'b2' }
          }
        }
      };

      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent)
        }
      };
      (service as any).webhookSecret = 'whsec_test';

      prisma.booking.findUnique.mockResolvedValue({ id: 'b2', status: 'payment', metadata: null });
      prisma.booking.update.mockResolvedValue({ id: 'b2', status: 'cancelled' });

      const result = await service.handleWebhook('sig', Buffer.from('body'));

      expect(result).toEqual({
        bookingId: 'b2',
        paymentIntentId: 'pi_test456',
        status: 'canceled'
      });
    });

    it('should return null for unhandled event types', async () => {
      const mockEvent = {
        type: 'payment_intent.created',
        data: { object: { id: 'pi_ignored' } }
      };

      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent)
        }
      };
      (service as any).webhookSecret = 'whsec_test';

      const result = await service.handleWebhook('sig', Buffer.from('body'));
      expect(result).toBeNull();
    });

    it('should return null when bookingId missing from metadata', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_nometa',
            metadata: {}
          }
        }
      };

      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent)
        }
      };
      (service as any).webhookSecret = 'whsec_test';

      const result = await service.handleWebhook('sig', Buffer.from('body'));
      expect(result).toBeNull();
    });

    it('should return null when booking not found for succeeded event', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test789',
            metadata: { bookingId: 'b-missing' }
          }
        }
      };

      (service as any).stripe = {
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockEvent)
        }
      };
      (service as any).webhookSecret = 'whsec_test';

      prisma.booking.findUnique.mockResolvedValue(null);
      prisma.booking.update.mockResolvedValue({ id: 'b-missing', status: 'confirmed' });

      const result = await service.handleWebhook('sig', Buffer.from('body'));
      expect(result).toEqual({
        bookingId: 'b-missing',
        paymentIntentId: 'pi_test789',
        status: 'succeeded'
      });
    });
  });
});
