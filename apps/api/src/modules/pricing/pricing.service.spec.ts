import { Test, type TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import type { PricingInput } from './pricing.types';

describe('PricingService', () => {
  let service: PricingService;
  let prisma: {
    markupRule: { findMany: jest.Mock; create: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    commissionRule: { findMany: jest.Mock; create: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
  };

  const baseInput: PricingInput = {
    agencyId: 'agency-1',
    baseAmount: '1000.00',
    currency: 'USD',
    airline: 'EK',
    origin: 'DXB',
    destination: 'LHR',
    cabinClass: 'economy'
  };

  const mockMarkupRule = {
    id: 'mr-1',
    agencyId: 'agency-1',
    airline: 'EK',
    origin: null,
    destination: null,
    cabinClass: null,
    markupPct: { toNumber: () => 5 },
    priority: 10,
    active: true
  };

  const mockCommissionRule = {
    id: 'cr-1',
    agencyId: 'agency-1',
    airline: 'EK',
    origin: null,
    destination: null,
    cabinClass: null,
    commissionPct: { toNumber: () => 3 },
    commissionFlat: { toNumber: () => 10 },
    priority: 10,
    active: true
  };

  beforeEach(async () => {
    prisma = {
      markupRule: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(mockMarkupRule),
        findUnique: jest.fn().mockResolvedValue(mockMarkupRule),
        delete: jest.fn().mockResolvedValue(mockMarkupRule)
      },
      commissionRule: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(mockCommissionRule),
        findUnique: jest.fn().mockResolvedValue(mockCommissionRule),
        delete: jest.fn().mockResolvedValue(mockCommissionRule)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: prisma }
      ]
    }).compile();

    service = module.get(PricingService);
  });

  describe('calculatePrice', () => {
    it('should return base price with zero markup when no rules match', async () => {
      prisma.markupRule.findMany.mockResolvedValue([]);
      prisma.commissionRule.findMany.mockResolvedValue([]);

      const result = await service.calculatePrice(baseInput);

      expect(result.baseAmount).toBe('1000.00');
      expect(result.markupPct).toBe(0);
      expect(result.markupAmount).toBe('0.00');
      expect(result.totalAmount).toBe('1000.00');
      expect(result.appliedMarkupRuleId).toBeNull();
      expect(result.appliedCommissionRuleId).toBeNull();
    });

    it('should apply matching markup rule', async () => {
      prisma.markupRule.findMany.mockResolvedValue([mockMarkupRule]);
      prisma.commissionRule.findMany.mockResolvedValue([]);

      const result = await service.calculatePrice(baseInput);

      expect(result.markupPct).toBe(5);
      expect(result.markupAmount).toBe('50.00');
      expect(result.totalAmount).toBe('1050.00');
      expect(result.appliedMarkupRuleId).toBe('mr-1');
    });

    it('should apply matching commission rule with percentage and flat', async () => {
      prisma.markupRule.findMany.mockResolvedValue([]);
      prisma.commissionRule.findMany.mockResolvedValue([mockCommissionRule]);

      const result = await service.calculatePrice(baseInput);

      expect(result.commissionPct).toBe(3);
      expect(result.commissionFlat).toBe('10.00');
      expect(result.commissionAmount).toBe('40.00'); // 1000 * 3% + 10
      expect(result.appliedCommissionRuleId).toBe('cr-1');
    });

    it('should apply both markup and commission rules', async () => {
      prisma.markupRule.findMany.mockResolvedValue([mockMarkupRule]);
      prisma.commissionRule.findMany.mockResolvedValue([mockCommissionRule]);

      const result = await service.calculatePrice(baseInput);

      expect(result.markupPct).toBe(5);
      expect(result.markupAmount).toBe('50.00');
      expect(result.totalAmount).toBe('1050.00');
      expect(result.commissionAmount).toBe('40.00');
    });

    it('should pick highest priority matching rule', async () => {
      const lowPriorityRule = {
        ...mockMarkupRule,
        id: 'mr-low',
        priority: 1,
        markupPct: { toNumber: () => 2 }
      };
      const highPriorityRule = {
        ...mockMarkupRule,
        id: 'mr-high',
        priority: 10,
        markupPct: { toNumber: () => 8 }
      };

      prisma.markupRule.findMany.mockResolvedValue([highPriorityRule, lowPriorityRule]);
      prisma.commissionRule.findMany.mockResolvedValue([]);

      const result = await service.calculatePrice(baseInput);

      expect(result.markupPct).toBe(8);
      expect(result.appliedMarkupRuleId).toBe('mr-high');
    });

    it('should skip rule when airline does not match', async () => {
      const wrongAirlineRule = {
        ...mockMarkupRule,
        airline: 'BA',
        markupPct: { toNumber: () => 10 }
      };

      prisma.markupRule.findMany.mockResolvedValue([wrongAirlineRule]);
      prisma.commissionRule.findMany.mockResolvedValue([]);

      const result = await service.calculatePrice(baseInput);

      expect(result.markupPct).toBe(0);
      expect(result.appliedMarkupRuleId).toBeNull();
    });

    it('should match rule with null airline (wildcard)', async () => {
      const wildcardRule = {
        ...mockMarkupRule,
        airline: null,
        markupPct: { toNumber: () => 4 }
      };

      prisma.markupRule.findMany.mockResolvedValue([wildcardRule]);
      prisma.commissionRule.findMany.mockResolvedValue([]);

      const result = await service.calculatePrice(baseInput);

      expect(result.markupPct).toBe(4);
      expect(result.appliedMarkupRuleId).toBe('mr-1');
    });

    it('should match rule by origin and destination', async () => {
      const routeRule = {
        ...mockMarkupRule,
        airline: null,
        origin: 'DXB',
        destination: 'LHR',
        markupPct: { toNumber: () => 7 }
      };

      prisma.markupRule.findMany.mockResolvedValue([routeRule]);
      prisma.commissionRule.findMany.mockResolvedValue([]);

      const result = await service.calculatePrice(baseInput);

      expect(result.markupPct).toBe(7);
    });

    it('should skip rule when origin does not match', async () => {
      const wrongOriginRule = {
        ...mockMarkupRule,
        airline: null,
        origin: 'JFK',
        destination: null,
        markupPct: { toNumber: () => 6 }
      };

      prisma.markupRule.findMany.mockResolvedValue([wrongOriginRule]);
      prisma.commissionRule.findMany.mockResolvedValue([]);

      const result = await service.calculatePrice(baseInput);

      expect(result.markupPct).toBe(0);
    });

    it('should handle commission rule with null flat amount', async () => {
      const pctOnlyRule = {
        ...mockCommissionRule,
        commissionFlat: null,
        commissionPct: { toNumber: () => 5 }
      };

      prisma.markupRule.findMany.mockResolvedValue([]);
      prisma.commissionRule.findMany.mockResolvedValue([pctOnlyRule]);

      const result = await service.calculatePrice(baseInput);

      expect(result.commissionFlat).toBe('0.00');
      expect(result.commissionAmount).toBe('50.00');
    });
  });

  describe('createMarkupRule', () => {
    it('should create a markup rule', async () => {
      await service.createMarkupRule('agency-1', { markupPct: 5 });

      expect(prisma.markupRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ agencyId: 'agency-1', markupPct: 5 })
        })
      );
    });
  });

  describe('listMarkupRules', () => {
    it('should list rules for agency', async () => {
      prisma.markupRule.findMany.mockResolvedValue([mockMarkupRule]);

      const result = await service.listMarkupRules('agency-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('deleteMarkupRule', () => {
    it('should delete own rule', async () => {
      const result = await service.deleteMarkupRule('mr-1', 'agency-1');

      expect(result).toBe(true);
      expect(prisma.markupRule.delete).toHaveBeenCalledWith({ where: { id: 'mr-1' } });
    });

    it('should refuse to delete rule from other agency', async () => {
      prisma.markupRule.findUnique.mockResolvedValue({ ...mockMarkupRule, agencyId: 'other' });

      const result = await service.deleteMarkupRule('mr-1', 'agency-1');

      expect(result).toBeNull();
    });

    it('should return null for nonexistent rule', async () => {
      prisma.markupRule.findUnique.mockResolvedValue(null);

      const result = await service.deleteMarkupRule('nonexistent', 'agency-1');

      expect(result).toBeNull();
    });
  });

  describe('createCommissionRule', () => {
    it('should create a commission rule', async () => {
      await service.createCommissionRule('agency-1', { commissionPct: 3, commissionFlat: 10 });

      expect(prisma.commissionRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ agencyId: 'agency-1', commissionPct: 3, commissionFlat: 10 })
        })
      );
    });
  });

  describe('deleteCommissionRule', () => {
    it('should delete own rule', async () => {
      const result = await service.deleteCommissionRule('cr-1', 'agency-1');

      expect(result).toBe(true);
    });

    it('should refuse to delete rule from other agency', async () => {
      prisma.commissionRule.findUnique.mockResolvedValue({ ...mockCommissionRule, agencyId: 'other' });

      const result = await service.deleteCommissionRule('cr-1', 'agency-1');

      expect(result).toBeNull();
    });
  });
});
