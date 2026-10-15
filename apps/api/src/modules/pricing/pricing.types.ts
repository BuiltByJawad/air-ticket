export interface PricingInput {
  agencyId: string;
  baseAmount: string;
  currency: string;
  airline: string;
  origin: string;
  destination: string;
  cabinClass: string;
}

export interface PricingResult {
  baseAmount: string;
  markupPct: number;
  markupAmount: string;
  commissionPct: number;
  commissionFlat: string;
  commissionAmount: string;
  totalAmount: string;
  currency: string;
  appliedMarkupRuleId: string | null;
  appliedCommissionRuleId: string | null;
}

export interface MarkupRuleRow {
  id: string;
  agencyId: string;
  airline: string | null;
  origin: string | null;
  destination: string | null;
  cabinClass: string | null;
  markupPct: { toNumber: () => number };
  priority: number;
  active: boolean;
}

export interface CommissionRuleRow {
  id: string;
  agencyId: string;
  airline: string | null;
  origin: string | null;
  destination: string | null;
  cabinClass: string | null;
  commissionPct: { toNumber: () => number };
  commissionFlat: { toNumber: () => number } | null;
  priority: number;
  active: boolean;
}
