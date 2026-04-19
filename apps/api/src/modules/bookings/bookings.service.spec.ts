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

  beforeEach(async () => {
    prisma = {
      booking: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      }
    };

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
