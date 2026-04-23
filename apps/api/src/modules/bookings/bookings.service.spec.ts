import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserData } from '../auth/current-user.decorator';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: {
    booking: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
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

  const mockBookingRow = {
    id: 'booking-1',
    status: 'draft',
    offerId: 'offer-1',
    offerData: { segments: [] },
    currency: 'USD',
    amount: '500.00',
    agencyId: 'agency-1',
    createdByUserId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPrismaCount = jest.fn();

  beforeEach(async () => {
    prisma = {
      booking: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: mockPrismaCount
      }
    };

    mockPrismaCount.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma }
      ]
    }).compile();

    service = module.get(BookingsService);
  });

  describe('createForAgent', () => {
    it('should create a booking for an agent', async () => {
      prisma.booking.create.mockResolvedValue(mockBookingRow);

      const result = await service.createForAgent(agentUser, {
        offerId: 'offer-1',
        offerData: { segments: [] },
        currency: 'USD',
        amount: '500.00'
      });

      expect(result.id).toBe('booking-1');
      expect(result.totalPrice.currency).toBe('USD');
      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agencyId: 'agency-1',
            createdByUserId: 'user-1'
          })
        })
      );
    });

    it('should reject non-agent users', async () => {
      await expect(
        service.createForAgent(adminUser, {
          offerId: 'offer-1',
          offerData: { test: true },
          currency: 'USD',
          amount: '500.00'
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject agent without agencyId', async () => {
      const noAgencyUser: CurrentUserData = { sub: 'user-2', email: 'a@b.com', role: 'agent', agencyId: null };

      await expect(
        service.createForAgent(noAgencyUser, {
          offerId: 'offer-1',
          offerData: { test: true },
          currency: 'USD',
          amount: '500.00'
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject null offerData', async () => {
      await expect(
        service.createForAgent(agentUser, {
          offerId: 'offer-1',
          offerData: null,
          currency: 'USD',
          amount: '500.00'
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listPagedForUser', () => {
    it('should return paginated bookings for agent scoped to agency', async () => {
      mockPrismaCount.mockResolvedValue(1);
      prisma.booking.findMany.mockResolvedValue([mockBookingRow]);

      const result = await service.listPagedForUser(agentUser, { limit: 20, offset: 0 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { agencyId: 'agency-1' } })
      );
    });

    it('should return paginated bookings for admin without agency filter', async () => {
      mockPrismaCount.mockResolvedValue(0);
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await service.listPagedForUser(adminUser, { limit: 20, offset: 0 });

      expect(result.items).toHaveLength(0);
      const where = (prisma.booking.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.agencyId).toBeUndefined();
    });

    it('should filter by search on offerId', async () => {
      mockPrismaCount.mockResolvedValue(1);
      prisma.booking.findMany.mockResolvedValue([mockBookingRow]);

      await service.listPagedForUser(agentUser, { search: 'offer-1', limit: 20, offset: 0 });

      const where = (prisma.booking.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.offerId).toEqual({ contains: 'offer-1', mode: 'insensitive' });
    });

    it('should filter by fromDate', async () => {
      mockPrismaCount.mockResolvedValue(0);
      prisma.booking.findMany.mockResolvedValue([]);

      await service.listPagedForUser(agentUser, { fromDate: '2024-01-01', limit: 20, offset: 0 });

      const where = (prisma.booking.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.createdAt).toEqual({ gte: expect.any(Date) });
    });

    it('should filter by toDate', async () => {
      mockPrismaCount.mockResolvedValue(0);
      prisma.booking.findMany.mockResolvedValue([]);

      await service.listPagedForUser(agentUser, { toDate: '2024-12-31', limit: 20, offset: 0 });

      const where = (prisma.booking.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.createdAt).toEqual({ lte: expect.any(Date) });
    });

    it('should filter by both fromDate and toDate', async () => {
      mockPrismaCount.mockResolvedValue(0);
      prisma.booking.findMany.mockResolvedValue([]);

      await service.listPagedForUser(agentUser, { fromDate: '2024-01-01', toDate: '2024-12-31', limit: 20, offset: 0 });

      const where = (prisma.booking.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.createdAt).toEqual({ gte: expect.any(Date), lte: expect.any(Date) });
    });

    it('should combine search, date, and status filters', async () => {
      mockPrismaCount.mockResolvedValue(1);
      prisma.booking.findMany.mockResolvedValue([mockBookingRow]);

      await service.listPagedForUser(agentUser, {
        search: 'offer',
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
        status: 'draft',
        limit: 10,
        offset: 0
      });

      const where = (prisma.booking.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.offerId).toEqual({ contains: 'offer', mode: 'insensitive' });
      expect(where.createdAt).toEqual({ gte: expect.any(Date), lte: expect.any(Date) });
      expect(where.status).toBe('draft');
      expect(where.agencyId).toBe('agency-1');
    });

    it('should throw BadRequestException for agent without agencyId', async () => {
      const noAgencyUser: CurrentUserData = { sub: 'user-2', email: 'a@b.com', role: 'agent', agencyId: null };

      await expect(
        service.listPagedForUser(noAgencyUser, { limit: 20, offset: 0 })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listForUser', () => {
    it('should list bookings for agent scoped to agency', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBookingRow]);

      const result = await service.listForUser(agentUser, {});

      expect(result).toHaveLength(1);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { agencyId: 'agency-1' } })
      );
    });

    it('should list all bookings for admin', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBookingRow]);

      const result = await service.listForUser(adminUser, {});

      expect(result).toHaveLength(1);
    });

    it('should filter by agencyId for admin', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      await service.listForUser(adminUser, { agencyId: 'agency-1' });

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { agencyId: 'agency-1' } })
      );
    });
  });

  describe('getByIdForUser', () => {
    it('should return booking for agent in same agency', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBookingRow);

      const result = await service.getByIdForUser(agentUser, 'booking-1');

      expect(result.id).toBe('booking-1');
    });

    it('should throw NotFoundException for missing booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.getByIdForUser(agentUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when agent accesses other agency booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBookingRow, agencyId: 'other-agency' });

      await expect(service.getByIdForUser(agentUser, 'booking-1')).rejects.toThrow(NotFoundException);
    });

    it('should allow admin to access any booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBookingRow);

      const result = await service.getByIdForUser(adminUser, 'booking-1');

      expect(result.id).toBe('booking-1');
    });
  });

  describe('confirmForAgent', () => {
    it('should confirm a draft booking for agent in same agency', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBookingRow);
      prisma.booking.update.mockResolvedValue({ ...mockBookingRow, status: 'confirmed' });

      const result = await service.confirmForAgent(agentUser, 'booking-1');

      expect(result.status).toBe('confirmed');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: 'confirmed' }
      });
    });

    it('should confirm a draft booking for admin', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBookingRow);
      prisma.booking.update.mockResolvedValue({ ...mockBookingRow, status: 'confirmed' });

      const result = await service.confirmForAgent(adminUser, 'booking-1');

      expect(result.status).toBe('confirmed');
    });

    it('should throw NotFoundException for missing booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.confirmForAgent(agentUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when agent accesses other agency booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBookingRow, agencyId: 'other-agency' });

      await expect(service.confirmForAgent(agentUser, 'booking-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when confirming non-draft booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBookingRow, status: 'confirmed' });

      await expect(service.confirmForAgent(agentUser, 'booking-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelForAgent', () => {
    it('should cancel a confirmed booking for agent in same agency', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBookingRow, status: 'confirmed' });
      prisma.booking.update.mockResolvedValue({ ...mockBookingRow, status: 'cancelled' });

      const result = await service.cancelForAgent(agentUser, 'booking-1');

      expect(result.status).toBe('cancelled');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: 'cancelled' }
      });
    });

    it('should cancel a draft booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBookingRow);
      prisma.booking.update.mockResolvedValue({ ...mockBookingRow, status: 'cancelled' });

      const result = await service.cancelForAgent(agentUser, 'booking-1');

      expect(result.status).toBe('cancelled');
    });

    it('should throw NotFoundException for missing booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.cancelForAgent(agentUser, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when cancelling already cancelled booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBookingRow, status: 'cancelled' });

      await expect(service.cancelForAgent(agentUser, 'booking-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when agent accesses other agency booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBookingRow, agencyId: 'other-agency' });

      await expect(service.cancelForAgent(agentUser, 'booking-1')).rejects.toThrow(NotFoundException);
    });
  });
});
