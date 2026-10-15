export interface RefundRequestResult {
  id: string;
  bookingId: string;
  agencyId: string;
  requestedBy: string;
  reason: string;
  refundAmount: string;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function toRefundRequest(dto: {
  id: string;
  bookingId: string;
  agencyId: string;
  requestedBy: string;
  reason: string;
  refundAmount: { toNumber: () => number };
  currency: string;
  status: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): RefundRequestResult {
  return {
    id: dto.id,
    bookingId: dto.bookingId,
    agencyId: dto.agencyId,
    requestedBy: dto.requestedBy,
    reason: dto.reason,
    refundAmount: dto.refundAmount.toNumber().toFixed(2),
    currency: dto.currency,
    status: dto.status as RefundRequestResult['status'],
    reviewedBy: dto.reviewedBy ?? undefined,
    reviewNote: dto.reviewNote ?? undefined,
    reviewedAt: dto.reviewedAt ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}
