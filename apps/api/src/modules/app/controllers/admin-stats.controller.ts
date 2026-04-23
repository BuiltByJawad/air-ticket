import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../auth/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface BookingStatusCount {
  draft: number;
  confirmed: number;
  cancelled: number;
}

interface AgencyRevenue {
  agencyId: string;
  agencyName: string;
  revenue: string;
  bookingCount: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: string;
  bookingCount: number;
}

interface AdminStats {
  totalAgencies: number;
  totalUsers: number;
  totalAgents: number;
  totalBookings: number;
  bookingsByStatus: BookingStatusCount;
  totalRevenue: string;
  revenueCurrency: string;
  topAgencies: AgencyRevenue[];
  recentBookingsCount: number;
  monthlyRevenue: MonthlyRevenue[];
}

@ApiTags('Admin - Stats')
@ApiBearerAuth()
@Controller('admin/stats')
@Roles('admin')
export class AdminStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Admin stats returned' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getStats(): Promise<AdminStats> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [totalAgencies, totalUsers, totalAgents, bookingsByStatus, confirmedBookings, thirtyDaysAgo] = await Promise.all([
      this.prisma.agency.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'agent' } }),
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      this.prisma.booking.findMany({
        where: { status: 'confirmed' },
        select: { currency: true, amount: true, agencyId: true }
      }),
      this.prisma.booking.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      })
    ]);

    const statusMap: BookingStatusCount = { draft: 0, confirmed: 0, cancelled: 0 };
    for (const row of bookingsByStatus) {
      if (row.status in statusMap) {
        statusMap[row.status as keyof BookingStatusCount] = row._count.status;
      }
    }

    const totalBookings = statusMap.draft + statusMap.confirmed + statusMap.cancelled;

    // Calculate total revenue from confirmed bookings (group by currency)
    const revenueByCurrency = new Map<string, number>();
    const revenueByAgency = new Map<string, { revenue: number; count: number }>();

    for (const b of confirmedBookings) {
      const amount = parseFloat(b.amount) || 0;
      revenueByCurrency.set(b.currency, (revenueByCurrency.get(b.currency) ?? 0) + amount);
      if (b.agencyId) {
        const existing = revenueByAgency.get(b.agencyId) ?? { revenue: 0, count: 0 };
        existing.revenue += amount;
        existing.count += 1;
        revenueByAgency.set(b.agencyId, existing);
      }
    }

    // Pick the primary currency (most common)
    let primaryCurrency = 'USD';
    let maxRevenue = 0;
    for (const [currency, rev] of revenueByCurrency) {
      if (rev > maxRevenue) {
        maxRevenue = rev;
        primaryCurrency = currency;
      }
    }

    // Top agencies by revenue
    const agencyIds = Array.from(revenueByAgency.keys()).slice(0, 10);
    const agencies = await this.prisma.agency.findMany({
      where: { id: { in: agencyIds } },
      select: { id: true, name: true }
    });
    const agencyNameMap = new Map(agencies.map((a) => [a.id, a.name]));

    const topAgencies: AgencyRevenue[] = Array.from(revenueByAgency.entries())
      .map(([agencyId, data]) => ({
        agencyId,
        agencyName: agencyNameMap.get(agencyId) ?? 'Unknown',
        revenue: data.revenue.toFixed(2),
        bookingCount: data.count
      }))
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
      .slice(0, 5);

    // Monthly revenue for last 6 months (primary currency only)
    const monthlyRevenue: MonthlyRevenue[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);

      const monthBookings = await this.prisma.booking.findMany({
        where: {
          status: 'confirmed',
          currency: primaryCurrency,
          createdAt: { gte: start, lt: end }
        },
        select: { amount: true }
      });

      const rev = monthBookings.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
      monthlyRevenue.push({
        month: label,
        revenue: rev.toFixed(2),
        bookingCount: monthBookings.length
      });
    }

    return {
      totalAgencies,
      totalUsers,
      totalAgents,
      totalBookings,
      bookingsByStatus: statusMap,
      totalRevenue: (revenueByCurrency.get(primaryCurrency) ?? 0).toFixed(2),
      revenueCurrency: primaryCurrency,
      topAgencies,
      recentBookingsCount: thirtyDaysAgo,
      monthlyRevenue
    };
  }
}
