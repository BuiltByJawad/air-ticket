import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PricingInput, PricingResult, MarkupRuleRow, CommissionRuleRow } from './pricing.types';

function ruleMatches(
  rule: { airline: string | null; origin: string | null; destination: string | null; cabinClass: string | null },
  input: { airline: string; origin: string; destination: string; cabinClass: string }
): boolean {
  if (rule.airline && rule.airline !== input.airline) return false;
  if (rule.origin && rule.origin !== input.origin) return false;
  if (rule.destination && rule.destination !== input.destination) return false;
  if (rule.cabinClass && rule.cabinClass !== input.cabinClass) return false;
  return true;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculatePrice(input: PricingInput): Promise<PricingResult> {
    const baseAmount = parseFloat(input.baseAmount);

    const [markupRules, commissionRules] = await Promise.all([
      this.prisma.markupRule.findMany({
        where: { agencyId: input.agencyId, active: true },
        orderBy: { priority: 'desc' }
      }),
      this.prisma.commissionRule.findMany({
        where: { agencyId: input.agencyId, active: true },
        orderBy: { priority: 'desc' }
      })
    ]);

    // Find first matching markup rule (highest priority first)
    const matchedMarkup = (markupRules as unknown as MarkupRuleRow[]).find((rule) =>
      ruleMatches(rule, input)
    );

    // Find first matching commission rule (highest priority first)
    const matchedCommission = (commissionRules as unknown as CommissionRuleRow[]).find((rule) =>
      ruleMatches(rule, input)
    );

    const markupPct = matchedMarkup ? matchedMarkup.markupPct.toNumber() : 0;
    const markupAmount = +(baseAmount * (markupPct / 100)).toFixed(2);

    const commissionPct = matchedCommission ? matchedCommission.commissionPct.toNumber() : 0;
    const commissionFlat = matchedCommission?.commissionFlat?.toNumber() ?? 0;
    const commissionAmount = +((baseAmount * (commissionPct / 100)) + commissionFlat).toFixed(2);

    const totalAmount = +(baseAmount + markupAmount).toFixed(2);

    return {
      baseAmount: input.baseAmount,
      markupPct,
      markupAmount: markupAmount.toFixed(2),
      commissionPct,
      commissionFlat: commissionFlat.toFixed(2),
      commissionAmount: commissionAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      currency: input.currency,
      appliedMarkupRuleId: matchedMarkup?.id ?? null,
      appliedCommissionRuleId: matchedCommission?.id ?? null
    };
  }

  async createMarkupRule(
    agencyId: string,
    input: { airline?: string; origin?: string; destination?: string; cabinClass?: string; markupPct: number; priority?: number }
  ) {
    return this.prisma.markupRule.create({
      data: {
        agencyId,
        airline: input.airline ?? null,
        origin: input.origin ?? null,
        destination: input.destination ?? null,
        cabinClass: input.cabinClass ?? null,
        markupPct: input.markupPct,
        priority: input.priority ?? 0
      }
    });
  }

  async listMarkupRules(agencyId: string) {
    return this.prisma.markupRule.findMany({
      where: { agencyId },
      orderBy: { priority: 'desc' }
    });
  }

  async deleteMarkupRule(id: string, agencyId: string) {
    const rule = await this.prisma.markupRule.findUnique({ where: { id } });
    if (!rule || rule.agencyId !== agencyId) return null;
    await this.prisma.markupRule.delete({ where: { id } });
    return true;
  }

  async createCommissionRule(
    agencyId: string,
    input: { airline?: string; origin?: string; destination?: string; cabinClass?: string; commissionPct: number; commissionFlat?: number; priority?: number }
  ) {
    return this.prisma.commissionRule.create({
      data: {
        agencyId,
        airline: input.airline ?? null,
        origin: input.origin ?? null,
        destination: input.destination ?? null,
        cabinClass: input.cabinClass ?? null,
        commissionPct: input.commissionPct,
        commissionFlat: input.commissionFlat ?? null,
        priority: input.priority ?? 0
      }
    });
  }

  async listCommissionRules(agencyId: string) {
    return this.prisma.commissionRule.findMany({
      where: { agencyId },
      orderBy: { priority: 'desc' }
    });
  }

  async deleteCommissionRule(id: string, agencyId: string) {
    const rule = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!rule || rule.agencyId !== agencyId) return null;
    await this.prisma.commissionRule.delete({ where: { id } });
    return true;
  }
}
