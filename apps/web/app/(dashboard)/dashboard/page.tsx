import type { Metadata } from 'next';
import { BookOpen, Plane, TrendingUp, DollarSign, PlaneTakeoff, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const BarChart = dynamic(() => import('@/components/shared/charts').then((m) => m.BarChart), { loading: () => <div className="h-32 animate-pulse bg-muted rounded" /> });
const StatusBar = dynamic(() => import('@/components/shared/charts').then((m) => m.StatusBar), { loading: () => <div className="h-16 animate-pulse bg-muted rounded" /> });

export const metadata: Metadata = { title: 'Dashboard', description: 'Your agency overview and recent activity.' };
import { getAgentStats, listBookingsPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import Link from 'next/link';

export default async function DashboardHomePage() {
  const token = await getSessionToken();

  const stats = token
    ? await getAgentStats(token).catch((err) => {
        console.error('Failed to fetch agent stats:', err);
        return {
          totalBookings: 0,
          bookingsByStatus: { draft: 0, confirmed: 0, cancelled: 0 },
          totalRevenue: '0.00',
          revenueCurrency: 'USD',
          recentBookingsCount: 0,
          monthlyRevenue: []
        };
      })
    : {
        totalBookings: 0,
        bookingsByStatus: { draft: 0, confirmed: 0, cancelled: 0 },
        totalRevenue: '0.00',
        revenueCurrency: 'USD',
        recentBookingsCount: 0,
        monthlyRevenue: []
      };

  let recentBookings: Awaited<ReturnType<typeof listBookingsPaged>>['items'] = [];
  if (token) {
    try {
      const result = await listBookingsPaged(token, { limit: 5, offset: 0 });
      recentBookings = result.items;
    } catch (err) {
      console.error('Failed to fetch recent bookings:', err);
    }
  }

  const { totalBookings, bookingsByStatus, totalRevenue, revenueCurrency, recentBookingsCount, monthlyRevenue } = stats;
  const avgValue = totalBookings > 0 ? (parseFloat(totalRevenue) / totalBookings).toFixed(2) : '0.00';
  const statusTotal = bookingsByStatus.draft + bookingsByStatus.confirmed + bookingsByStatus.cancelled;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your agency activity.</p>
        </div>
        <Link
          href="/flights"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlaneTakeoff className="h-4 w-4" /> New Search
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Total Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl truncate">{totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">{recentBookingsCount} in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Confirmed</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{bookingsByStatus.confirmed}</div>
            {statusTotal > 0 && (
              <div className="mt-2">
                <StatusBar items={[
                  { label: 'Draft', value: bookingsByStatus.draft, total: statusTotal, color: '#eab308' },
                  { label: 'Confirmed', value: bookingsByStatus.confirmed, total: statusTotal, color: '#22c55e' },
                  { label: 'Cancelled', value: bookingsByStatus.cancelled, total: statusTotal, color: '#ef4444' }
                ]} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl truncate">{revenueCurrency} {totalRevenue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Avg. Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl truncate">{revenueCurrency} {avgValue}</div>
          </CardContent>
        </Card>
      </div>

      {monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monthly Revenue (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={monthlyRevenue.map((m) => ({
                label: m.month.slice(5),
                value: parseFloat(m.revenue),
                subtitle: `${m.bookingCount} bookings`
              }))}
              formatValue={(v) => `${revenueCurrency} ${v.toFixed(2)}`}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No bookings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Search flights to create your first booking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 sm:p-4 gap-2 hover:bg-accent transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{b.offerId}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">
                      {b.totalPrice.currency} {b.totalPrice.amount}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'draft' ? 'warning' : status === 'confirmed' ? 'success' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}
