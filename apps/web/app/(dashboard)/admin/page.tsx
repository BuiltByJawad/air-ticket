import type { Metadata } from 'next';
import { getAdminStats } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Building2, Users, BookOpen, ShieldCheck, DollarSign, TrendingUp, ChevronRight, Activity } from 'lucide-react';

export const metadata: Metadata = { title: 'Admin Dashboard', description: 'Platform overview — agencies, users, bookings, and revenue.' };
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, StatusBar } from '@/components/shared/charts';
import Link from 'next/link';

export default async function AdminPage() {
  const token = await getSessionToken();
  if (!token) return null;

  const stats = await getAdminStats(token).catch((err) => {
    console.error('Failed to fetch admin stats:', err);
    return {
      totalAgencies: 0,
      totalUsers: 0,
      totalAgents: 0,
      totalBookings: 0,
      bookingsByStatus: { draft: 0, confirmed: 0, cancelled: 0 },
      totalRevenue: '0.00',
      revenueCurrency: 'USD',
      topAgencies: [],
      recentBookingsCount: 0,
      monthlyRevenue: []
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage agencies, users, bookings, and audit logs</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/agencies">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Agencies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgencies}</div>
              <p className="text-xs text-muted-foreground mt-1">Manage travel agencies</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.totalAgents} agents</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/bookings">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Bookings</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.recentBookingsCount} in last 30 days</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/audit">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Audit Logs</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                View logs <ChevronRight className="h-4 w-4 ml-1" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Track system activity</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.revenueCurrency} {stats.totalRevenue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Bookings by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBar items={[
              { label: 'Draft', value: stats.bookingsByStatus.draft, total: stats.totalBookings, color: '#eab308' },
              { label: 'Confirmed', value: stats.bookingsByStatus.confirmed, total: stats.totalBookings, color: '#22c55e' },
              { label: 'Cancelled', value: stats.bookingsByStatus.cancelled, total: stats.totalBookings, color: '#ef4444' }
            ]} />
          </CardContent>
        </Card>
      </div>

      {stats.monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monthly Revenue (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={stats.monthlyRevenue.map((m) => ({
                label: m.month.slice(5),
                value: parseFloat(m.revenue),
                subtitle: `${m.bookingCount} bookings`
              }))}
              formatValue={(v) => `${stats.revenueCurrency} ${v.toFixed(2)}`}
            />
          </CardContent>
        </Card>
      )}

      {stats.topAgencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Agencies by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topAgencies.map((a, idx) => (
                <Link key={a.agencyId} href={`/admin/agencies/${a.agencyId}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-sm">{a.agencyName}</p>
                      <p className="text-xs text-muted-foreground">{a.bookingCount} confirmed bookings</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">{stats.revenueCurrency} {a.revenue}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
