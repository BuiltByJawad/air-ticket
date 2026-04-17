import { Test, type TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma }
      ]
    }).compile();

    service = module.get(AuditService);
  });

  describe('log', () => {
    it('should persist an audit log entry', async () => {
      await service.log({
        action: 'auth.login',
        resource: 'user',
        resourceId: 'user-1',
        agencyId: 'agency-1',
        userId: 'user-1',
        requestId: 'req-1'
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'auth.login',
            resource: 'user',
            resourceId: 'user-1',
            agencyId: 'agency-1',
            userId: 'user-1',
            requestId: 'req-1'
          })
        })
      );
    });

    it('should serialize metadata to JSON', async () => {
      await service.log({
        action: 'booking.create',
        resource: 'booking',
        metadata: { offerId: 'offer-1', amount: '500.00' }
      });

      const call = prisma.auditLog.create.mock.calls[0][0];
      expect(call.data.metadata).toEqual({ offerId: 'offer-1', amount: '500.00' });
    });

    it('should not throw when prisma create fails', async () => {
      prisma.auditLog.create.mockRejectedValue(new Error('DB down'));

      await expect(
        service.log({ action: 'test', resource: 'test' })
      ).resolves.toBeUndefined();
    });

    it('should handle missing optional fields', async () => {
      await service.log({ action: 'test', resource: 'test' });

      const call = prisma.auditLog.create.mock.calls[0][0];
      expect(call.data.metadata).toBeUndefined();
      expect(call.data.resourceId).toBeUndefined();
      expect(call.data.agencyId).toBeUndefined();
      expect(call.data.userId).toBeUndefined();
      expect(call.data.requestId).toBeUndefined();
    });
  });

  describe('listLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [{ id: 'log-1', action: 'auth.login' }];
      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.listLogs({ limit: 10, offset: 0 });

      expect(result.items).toEqual(mockLogs);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should apply filters when provided', async () => {
      await service.listLogs({ action: 'auth.login', resource: 'user' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { action: 'auth.login', resource: 'user' }
        })
      );
    });
  });
});
