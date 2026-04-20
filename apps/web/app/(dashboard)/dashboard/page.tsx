import { BookOpen, Plane, TrendingUp, DollarSign, PlaneTakeoff, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listBookingsPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import Link from 'next/link';

const STATS_LIMIT = 100;

export default async function DashboardHomePage() {
  const token = await getSessionToken();
  let totalBookings = 0;
  let confirmedBookings = 0;
  let totalRevenue = 0;
  let currency = 'USD';
  let recentBookings: Awaited<ReturnType<typeof listBookingsPaged>>['items'] = [];

  if (token) {
    try {
      const result = await listBookingsPaged(token, { limit: STATS_LIMIT, offset: 0 });
      totalBookings = result.meta.total;
      confirmedBookings = result.items.filter((b) => b.status === 'confirmed').length;
      totalRevenue = result.items.reduce((sum, b) => sum + parseFloat(b.totalPrice.amount), 0);
      currency = result.items[0]?.totalPrice.currency ?? 'USD';
      recentBookings = result.items.slice(0, 5);
    } catch {
      // stats will remain defaults
    }
  }

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Confirmed</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{confirmedBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl truncate">{currency} {totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Avg. Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              <span className="truncate">{currency} {totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : '0.00'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 sm:p-4 gap-2">
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
                </div>
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
