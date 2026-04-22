import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, type CurrentUserData } from '../../auth/current-user.decorator';
import { Roles } from '../../auth/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface BookingStatusCount {
  draft: number;
  confirmed: number;
  cancelled: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: string;
  bookingCount: number;
}

interface AgentStats {
  totalBookings: number;
  bookingsByStatus: BookingStatusCount;
  totalRevenue: string;
  revenueCurrency: string;
  recentBookingsCount: number;
  monthlyRevenue: MonthlyRevenue[];
}

@ApiTags('Agent - Stats')
@ApiBearerAuth()
@Controller('agent/stats')
@Roles('agent')
export class AgentStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get agent dashboard stats' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agent stats returned' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getStats(@CurrentUser() user: CurrentUserData): Promise<AgentStats> {
    if (!user.agencyId) {
      return {
        totalBookings: 0,
        bookingsByStatus: { draft: 0, confirmed: 0, cancelled: 0 },
        totalRevenue: '0.00',
        revenueCurrency: 'USD',
        recentBookingsCount: 0,
        monthlyRevenue: []
      };
    }

    const agencyId = user.agencyId;

    const [bookingsByStatus, confirmedBookings, recentBookingsCount] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { agencyId }
      }),
      this.prisma.booking.findMany({
        where: { agencyId, status: 'confirmed' },
        select: { currency: true, amount: true, createdAt: true }
      }),
      this.prisma.booking.count({
        where: {
          agencyId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    const statusMap: BookingStatusCount = { draft: 0, confirmed: 0, cancelled: 0 };
    for (const row of bookingsByStatus) {
      if (row.status in statusMap) {
        statusMap[row.status as keyof BookingStatusCount] = row._count.status;
      }
    }

    const totalBookings = statusMap.draft + statusMap.confirmed + statusMap.cancelled;

    // Revenue by currency
    const revenueByCurrency = new Map<string, number>();
    for (const b of confirmedBookings) {
      const amount = parseFloat(b.amount) || 0;
      revenueByCurrency.set(b.currency, (revenueByCurrency.get(b.currency) ?? 0) + amount);
    }

    let primaryCurrency = 'USD';
    let maxRevenue = 0;
    for (const [currency, rev] of revenueByCurrency) {
      if (rev > maxRevenue) {
        maxRevenue = rev;
        primaryCurrency = currency;
      }
    }

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const monthlyMap = new Map<string, { revenue: number; count: number }>();

    for (const b of confirmedBookings) {
      if (b.createdAt < sixMonthsAgo) continue;
      const monthKey = b.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(monthKey) ?? { revenue: 0, count: 0 };
      existing.revenue += parseFloat(b.amount) || 0;
      existing.count += 1;
      monthlyMap.set(monthKey, existing);
    }

    const monthlyRevenue: MonthlyRevenue[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue.toFixed(2),
        bookingCount: data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalBookings,
      bookingsByStatus: statusMap,
      totalRevenue: (revenueByCurrency.get(primaryCurrency) ?? 0).toFixed(2),
      revenueCurrency: primaryCurrency,
      recentBookingsCount,
      monthlyRevenue
    };
  }
}
