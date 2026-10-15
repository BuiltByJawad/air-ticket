import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserData } from '../auth/current-user.decorator';
import { AsyncTaskService } from '../app/async-task.service';
import { JobQueueService } from '../app/job-queue.service';
import { JobWorkerService } from '../app/job-worker.service';

describe('RefundsService', () => {
  let service: RefundsService;
  let prisma: {
    booking: { findUnique: jest.Mock; update: jest.Mock };
    refundRequest: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; count: jest.Mock };
  };

  const agentUser: CurrentUserData = {
    sub: 'user-1',
    email: 'agent@test.com',
    role: 'agent',
    agencyId: 'agency-1'
  };

  const adminUser: CurrentUserData = {
    sub: 'admin-1',
    email: 'admin@test.com',
    role: 'admin',
    agencyId: null
  };

  const mockBooking = {
    id: 'booking-1',
    status: 'confirmed',
    agencyId: 'agency-1',
    amount: '500.00',
    currency: 'USD'
  };

  const mockRefundRequest = {
    id: 'refund-1',
    bookingId: 'booking-1',
    agencyId: 'agency-1',
    requestedBy: 'user-1',
    reason: 'Customer cancellation',
    refundAmount: { toNumber: () => 500 },
    currency: 'USD',
    status: 'pending',
    reviewedBy: null,
    reviewNote: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(mockBooking),
        update: jest.fn().mockResolvedValue({ ...mockBooking, status: 'cancelled' })
      },
      refundRequest: {
        create: jest.fn().mockResolvedValue(mockRefundRequest),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([mockRefundRequest]),
        findUnique: jest.fn().mockResolvedValue(mockRefundRequest),
        update: jest.fn().mockResolvedValue(mockRefundRequest),
        count: jest.fn().mockResolvedValue(1)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundsService,
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
            enqueue: jest.fn(async () => ({ id: 'job-1', deduped: false }))
          }
        },
        {
          provide: JobWorkerService,
          useValue: {
            process: jest.fn(async (_id: string, handler: (payload: unknown) => Promise<void>) =>
              handler({ refundRequestId: 'refund-1', bookingId: 'booking-1' })
            )
          }
        }
      ]
    }).compile();

    service = module.get(RefundsService);
  });

  describe('createRequest', () => {
    it('should create a refund request for an agent', async () => {
      const result = await service.createRequest(agentUser, {
        bookingId: 'booking-1',
        reason: 'Customer cancellation',
        refundAmount: '500.00',
        currency: 'USD'
      });

      expect(result.id).toBe('refund-1');
      expect(prisma.refundRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-1',
            agencyId: 'agency-1',
            requestedBy: 'user-1'
          })
        })
      );
    });

    it('should reject non-agent users', async () => {
      await expect(
        service.createRequest(adminUser, {
          bookingId: 'booking-1',
          reason: 'test',
          refundAmount: '500.00',
          currency: 'USD'
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject agent without agencyId', async () => {
      const noAgencyUser: CurrentUserData = { sub: 'user-2', email: 'a@b.com', role: 'agent', agencyId: null };

      await expect(
        service.createRequest(noAgencyUser, {
          bookingId: 'booking-1',
          reason: 'test',
          refundAmount: '500.00',
          currency: 'USD'
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for missing booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createRequest(agentUser, {
          bookingId: 'nonexistent',
          reason: 'test',
          refundAmount: '500.00',
          currency: 'USD'
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject refund for other agency booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBooking, agencyId: 'other-agency' });

      await expect(
        service.createRequest(agentUser, {
          bookingId: 'booking-1',
          reason: 'test',
          refundAmount: '500.00',
          currency: 'USD'
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject refund for non-confirmed booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBooking, status: 'draft' });

      await expect(
        service.createRequest(agentUser, {
          bookingId: 'booking-1',
          reason: 'test',
          refundAmount: '500.00',
          currency: 'USD'
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate pending refund', async () => {
      prisma.refundRequest.findFirst.mockResolvedValue(mockRefundRequest);

      await expect(
        service.createRequest(agentUser, {
          bookingId: 'booking-1',
          reason: 'test',
          refundAmount: '500.00',
          currency: 'USD'
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listRequests', () => {
    it('should list requests for agent scoped to agency', async () => {
      const result = await service.listRequests(agentUser, {});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should list all requests for admin', async () => {
      const result = await service.listRequests(adminUser, {});

      expect(result.items).toHaveLength(1);
    });

    it('should filter by status', async () => {
      await service.listRequests(agentUser, { status: 'pending' });

      const where = (prisma.refundRequest.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.status).toBe('pending');
    });
  });

  describe('approveRequest', () => {
    it('should approve a pending request as admin', async () => {
      prisma.refundRequest.update.mockResolvedValue({
        ...mockRefundRequest,
        status: 'approved',
        reviewedBy: 'admin-1'
      });

      const result = await service.approveRequest(adminUser, 'refund-1', 'Looks good');

      expect(result.status).toBe('approved');
      expect(prisma.refundRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'approved', reviewedBy: 'admin-1' })
        })
      );
    });

    it('should reject non-admin approval', async () => {
      await expect(
        service.approveRequest(agentUser, 'refund-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for missing request', async () => {
      prisma.refundRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.approveRequest(adminUser, 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject approval of non-pending request', async () => {
      prisma.refundRequest.findUnique.mockResolvedValue({ ...mockRefundRequest, status: 'approved' });

      await expect(
        service.approveRequest(adminUser, 'refund-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectRequest', () => {
    it('should reject a pending request as admin', async () => {
      prisma.refundRequest.update.mockResolvedValue({
        ...mockRefundRequest,
        status: 'rejected',
        reviewedBy: 'admin-1'
      });

      const result = await service.rejectRequest(adminUser, 'refund-1', 'Invalid reason');

      expect(result.status).toBe('rejected');
    });

    it('should reject non-admin rejection', async () => {
      await expect(
        service.rejectRequest(agentUser, 'refund-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('markProcessed', () => {
    it('should mark approved request as processed and cancel booking', async () => {
      prisma.refundRequest.findUnique
        .mockResolvedValueOnce({ ...mockRefundRequest, status: 'approved' })
        .mockResolvedValueOnce({ ...mockRefundRequest, status: 'processed' });
      prisma.refundRequest.update.mockResolvedValue({
        ...mockRefundRequest,
        status: 'processed'
      });

      const result = await service.markProcessed(adminUser, 'refund-1');

      expect(result.status).toBe('processed');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: 'cancelled' }
      });
    });

    it('should reject processing non-approved request', async () => {
      prisma.refundRequest.findUnique.mockResolvedValue(mockRefundRequest);

      await expect(
        service.markProcessed(adminUser, 'refund-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-admin processing', async () => {
      await expect(
        service.markProcessed(agentUser, 'refund-1')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
