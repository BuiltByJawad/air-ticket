import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AgenciesService', () => {
  let service: AgenciesService;
  let prisma: {
    agency: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    booking: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    user: {
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      agency: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      booking: {
        count: jest.fn(),
        findMany: jest.fn()
      },
      user: {
        count: jest.fn()
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgenciesService,
        { provide: PrismaService, useValue: prisma }
      ]
    }).compile();

    service = module.get<AgenciesService>(AgenciesService);
  });

  describe('getDetail', () => {
    it('should return null when agency does not exist', async () => {
      prisma.agency.findUnique.mockResolvedValue(null);

      const result = await service.getDetail('non-existent-id');

      expect(result).toBeNull();
      expect(prisma.agency.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          users: {
            where: { role: 'agent' },
            select: { id: true, email: true, name: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            skip: 0,
            take: 20
          }
        }
      });
    });

    it('should return agency detail with agents and revenue', async () => {
      const agencyRow = {
        id: 'agency-1',
        name: 'Test Agency',
        createdAt: new Date('2024-01-01'),
        users: [
          { id: 'user-1', email: 'agent@test.com', name: 'Agent One', createdAt: new Date('2024-02-01') },
          { id: 'user-2', email: 'agent2@test.com', name: 'Agent Two', createdAt: new Date('2024-03-01') }
        ]
      };

      prisma.agency.findUnique.mockResolvedValue(agencyRow);
      prisma.user.count.mockResolvedValue(2);
      prisma.booking.count.mockResolvedValue(10);
      prisma.booking.findMany.mockResolvedValue([
        { currency: 'USD', amount: '500.00' },
        { currency: 'USD', amount: '300.00' },
        { currency: 'EUR', amount: '100.00' }
      ]);

      const result = await service.getDetail('agency-1');

      expect(result).toEqual({
        id: 'agency-1',
        name: 'Test Agency',
        createdAt: agencyRow.createdAt,
        agents: agencyRow.users,
        agentsTotal: 2,
        bookingsCount: 10,
        confirmedRevenue: '800.00',
        revenueCurrency: 'USD'
      });

      expect(prisma.booking.count).toHaveBeenCalledWith({ where: { agencyId: 'agency-1' } });
      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: { agencyId: 'agency-1', status: 'confirmed' },
        select: { currency: true, amount: true }
      });
    });

    it('should pick EUR as primary currency when EUR revenue is higher', async () => {
      const agencyRow = {
        id: 'agency-2',
        name: 'Euro Agency',
        createdAt: new Date('2024-01-01'),
        users: []
      };

      prisma.agency.findUnique.mockResolvedValue(agencyRow);
      prisma.user.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(5);
      prisma.booking.findMany.mockResolvedValue([
        { currency: 'USD', amount: '200.00' },
        { currency: 'EUR', amount: '500.00' }
      ]);

      const result = await service.getDetail('agency-2');

      expect(result).toEqual({
        id: 'agency-2',
        name: 'Euro Agency',
        createdAt: agencyRow.createdAt,
        agents: [],
        agentsTotal: 0,
        bookingsCount: 5,
        confirmedRevenue: '500.00',
        revenueCurrency: 'EUR'
      });
    });

    it('should default to USD when no confirmed bookings exist', async () => {
      const agencyRow = {
        id: 'agency-3',
        name: 'Empty Agency',
        createdAt: new Date('2024-01-01'),
        users: []
      };

      prisma.agency.findUnique.mockResolvedValue(agencyRow);
      prisma.user.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await service.getDetail('agency-3');

      expect(result).toEqual({
        id: 'agency-3',
        name: 'Empty Agency',
        createdAt: agencyRow.createdAt,
        agents: [],
        agentsTotal: 0,
        bookingsCount: 0,
        confirmedRevenue: '0.00',
        revenueCurrency: 'USD'
      });
    });
  });

  describe('findById', () => {
    it('should return null when agency not found', async () => {
      prisma.agency.findUnique.mockResolvedValue(null);
      const result = await service.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should return agency when found', async () => {
      const row = { id: 'a-1', name: 'Test', createdAt: new Date() };
      prisma.agency.findUnique.mockResolvedValue(row);
      const result = await service.findById('a-1');
      expect(result).toEqual({ id: 'a-1', name: 'Test', createdAt: row.createdAt });
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when agency not found', async () => {
      prisma.agency.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException when agency not found', async () => {
      prisma.agency.findUnique.mockResolvedValue(null);
      await expect(service.delete('x')).rejects.toThrow(NotFoundException);
    });
  });
});
