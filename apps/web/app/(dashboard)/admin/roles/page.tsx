import type { Metadata } from 'next';
import { listUsersPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Shield, Users, UserCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Roles & Access', description: 'Manage user roles and permissions across the platform.' };
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function AdminRolesPage() {
  const token = await getSessionToken();
  if (!token) return null;

  const [agentsResult, adminsResult] = await Promise.all([
    listUsersPaged(token, { role: 'agent', limit: 100 }).catch((err) => {
      console.error('Failed to fetch agents:', err);
      return { items: [], meta: { total: 0, limit: 100, offset: 0 } };
    }),
    listUsersPaged(token, { role: 'admin', limit: 100 }).catch((err) => {
      console.error('Failed to fetch admins:', err);
      return { items: [], meta: { total: 0, limit: 100, offset: 0 } };
    })
  ]);

  const agentCount = agentsResult.meta.total;
  const adminCount = adminsResult.meta.total;
  const totalUsers = agentCount + adminCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Roles & Access Control</h1>
        <p className="text-sm text-muted-foreground">Manage user roles and permissions across the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Flight search, bookings, own data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Full platform access</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Admins have full platform access. They can manage agencies, users, view all bookings, and access audit logs.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accessible Routes</p>
              <div className="flex flex-wrap gap-2">
                {['/admin', '/admin/agencies', '/admin/users', '/admin/bookings', '/admin/audit', '/profile'].map((route) => (
                  <Badge key={route} variant="default" className="text-xs">{route}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Permissions</p>
              <div className="flex flex-wrap gap-2">
                {['admin.stats', 'admin.agencies.*', 'admin.users.*', 'admin.audit-log', 'bookings.read.all', 'bookings.confirm', 'bookings.cancel'].map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                ))}
              </div>
            </div>
            {adminsResult.items.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Admins</p>
                {adminsResult.items.map((u) => (
                  <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent transition-colors">
                    <div>
                      <p className="text-sm font-medium">{u.name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Agent Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Agents can search flights, create and manage bookings for their agency, and view their own profile. They cannot access admin routes.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accessible Routes</p>
              <div className="flex flex-wrap gap-2">
                {['/dashboard', '/flights', '/bookings', '/bookings/[id]', '/profile'].map((route) => (
                  <Badge key={route} variant="secondary" className="text-xs">{route}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Permissions</p>
              <div className="flex flex-wrap gap-2">
                {['agent.stats', 'flights.search', 'flights.quote', 'bookings.create', 'bookings.read.own', 'bookings.confirm.own', 'bookings.cancel.own'].map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                ))}
              </div>
            </div>
            {agentsResult.items.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Agents</p>
                {agentsResult.items.slice(0, 5).map((u) => (
                  <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent transition-colors">
                    <div>
                      <p className="text-sm font-medium">{u.name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
                {agentCount > 5 && (
                  <Link href="/admin/users?role=agent" className="text-xs text-primary hover:underline">
                    View all {agentCount} agents →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            <Users className="h-4 w-4" />
            Manage Users
          </Link>
          <Link href="/admin/audit" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            <Shield className="h-4 w-4" />
            View Audit Logs
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
