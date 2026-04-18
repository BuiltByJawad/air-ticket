import { redirect } from 'next/navigation';
import { ApiError, fetchMe, listAgencies, listUsers, listBookings } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Building2, Users, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function AdminPage() {
  const token = await getSessionToken();
  if (!token) redirect('/login');

  let me: Awaited<ReturnType<typeof fetchMe>>;
  try {
    me = await fetchMe(token);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/login');
    }
    throw err;
  }

  if (me.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const [agencies, users, bookings] = await Promise.all([
    listAgencies(token).catch(() => []),
    listUsers(token).catch(() => []),
    listBookings(token).catch(() => [])
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage agencies, users, and bookings</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Agencies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Agencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Agencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agencies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No agencies yet.</p>
          ) : (
            <div className="space-y-3">
              {agencies.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{a.id}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-xs">
                      {u.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Link key={b.id} href={`/bookings/${b.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.offerId}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{b.id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'destructive' : 'warning'}
                        className="capitalize text-xs"
                      >
                        {b.status}
                      </Badge>
                      <span className="text-xs font-medium">{b.totalPrice.currency} {b.totalPrice.amount}</span>
                    </div>
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
