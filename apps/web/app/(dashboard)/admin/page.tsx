import { getAdminStats } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Building2, Users, BookOpen, ShieldCheck, DollarSign, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function AdminPage() {
  const token = await getSessionToken();
  if (!token) return null;

  const stats = await getAdminStats(token).catch(() => ({
    totalAgencies: 0,
    totalUsers: 0,
    totalAgents: 0,
    totalBookings: 0,
    bookingsByStatus: { draft: 0, confirmed: 0, cancelled: 0 },
    totalRevenue: '0.00',
    revenueCurrency: 'USD',
    topAgencies: [],
    recentBookingsCount: 0
  }));

  const statusEntries = [
    { label: 'Draft', value: stats.bookingsByStatus.draft, variant: 'warning' as const },
    { label: 'Confirmed', value: stats.bookingsByStatus.confirmed, variant: 'success' as const },
    { label: 'Cancelled', value: stats.bookingsByStatus.cancelled, variant: 'destructive' as const }
  ];

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
            <div className="space-y-3">
              {statusEntries.map((s) => {
                const pct = stats.totalBookings > 0 ? Math.round((s.value / stats.totalBookings) * 100) : 0;
                return (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={s.variant} className="capitalize text-xs w-20 justify-center">{s.label}</Badge>
                      <span className="text-sm font-medium">{s.value}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <div className="h-2 rounded-full bg-muted flex-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.variant === 'success' ? 'bg-green-500' : s.variant === 'destructive' ? 'bg-red-500' : 'bg-yellow-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

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
                <div key={a.agencyId} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-sm">{a.agencyName}</p>
                      <p className="text-xs text-muted-foreground">{a.bookingCount} confirmed bookings</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">{stats.revenueCurrency} {a.revenue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
