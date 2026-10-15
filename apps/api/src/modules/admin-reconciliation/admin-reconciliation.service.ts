import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ReconciliationInput {
  agencyId?: string;
  fromDate?: string;
  toDate?: string;
}

@Injectable()
export class AdminReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(input: ReconciliationInput) {
    const where: Record<string, unknown> = {};
    if (input.agencyId) where.agencyId = input.agencyId;
    if (input.fromDate || input.toDate) {
      where.createdAt = {
        ...(input.fromDate ? { gte: new Date(input.fromDate) } : {}),
        ...(input.toDate ? { lte: new Date(input.toDate) } : {})
      };
    }

    const [bookings, refunds] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        select: { id: true, status: true, amount: true, metadata: true, createdAt: true, agencyId: true }
      }),
      this.prisma.refundRequest.findMany({
        where: { ...(input.agencyId ? { agencyId: input.agencyId } : {}) },
        select: { id: true, bookingId: true, status: true, refundAmount: true, createdAt: true }
      })
    ]);

    const totals = {
      bookings: bookings.length,
      paymentState: {
        pending: bookings.filter((b) => b.status === 'payment').length,
        succeeded: bookings.filter((b) => {
          const m = b.metadata as Record<string, unknown> | null;
          return typeof m?.paymentStatus === 'string' && m.paymentStatus === 'succeeded';
        }).length,
        failed: bookings.filter((b) => {
          const m = b.metadata as Record<string, unknown> | null;
          return typeof m?.paymentStatus === 'string' && m.paymentStatus === 'failed';
        }).length
      },
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      refundsPending: refunds.filter((r) => r.status === 'pending').length,
      refundsApproved: refunds.filter((r) => r.status === 'approved').length,
      refundsProcessed: refunds.filter((r) => r.status === 'processed').length
    };

    const issueRows: Array<{ bookingId: string; issue: string }> = [];
    for (const b of bookings) {
      const meta = (b.metadata && typeof b.metadata === 'object' && !Array.isArray(b.metadata))
        ? (b.metadata as Record<string, unknown>)
        : {};
      const paymentStatus = typeof meta.paymentStatus === 'string' ? meta.paymentStatus : null;
      if (b.status === 'confirmed' && paymentStatus !== 'succeeded') {
        issueRows.push({ bookingId: b.id, issue: 'confirmed_without_succeeded_payment' });
      }
      if (b.status === 'cancelled' && paymentStatus === 'succeeded') {
        issueRows.push({ bookingId: b.id, issue: 'cancelled_but_payment_succeeded' });
      }
    }

    const groupedIssues = Object.entries(issueRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.issue] = (acc[row.issue] ?? 0) + 1;
      return acc;
    }, {})).map(([code, count]) => ({ code, count }));

    const byDay = bookings.reduce<Record<string, number>>((acc, b) => {
      const key = b.createdAt.toISOString().slice(0, 10);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const trend = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, bookingsCount]) => ({ day, bookings: bookingsCount }));

    const avg = trend.length > 0 ? trend.reduce((s, t) => s + t.bookings, 0) / trend.length : 0;
    const anomalies = trend
      .filter((t) => avg > 0 && t.bookings >= avg * 2)
      .map((t) => ({ day: t.day, type: 'booking_spike', value: t.bookings, baseline: Number(avg.toFixed(2)) }));

    return { totals, issues: groupedIssues, trend, anomalies };
  }

  async exportCsv(input: ReconciliationInput): Promise<string> {
    const result = await this.summary(input);
    const header = 'metric,value';
    const rows = Object.entries(result.totals).map(([k, v]) => `${k},${v}`);
    const issueHeader = 'issue,count';
    const issueRows = result.issues.map((i) => `${i.code},${i.count}`);
    const trendHeader = 'day,bookings';
    const trendRows = result.trend.map((t) => `${t.day},${t.bookings}`);
    return [header, ...rows, '', issueHeader, ...issueRows, '', trendHeader, ...trendRows].join('\n');
  }
}
