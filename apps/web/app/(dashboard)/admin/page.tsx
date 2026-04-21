import { listAgenciesPaged, listUsersPaged, listBookingsPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Building2, Users, BookOpen, ShieldCheck, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function AdminPage() {
  const token = await getSessionToken();
  if (!token) return null;

  const [agenciesResult, usersResult, bookingsResult] = await Promise.all([
    listAgenciesPaged(token, { limit: 1, offset: 0 }).catch(() => ({ items: [], meta: { total: 0, limit: 1, offset: 0 } })),
    listUsersPaged(token, { limit: 1, offset: 0 }).catch(() => ({ items: [], meta: { total: 0, limit: 1, offset: 0 } })),
    listBookingsPaged(token, { limit: 1, offset: 0 }).catch(() => ({ items: [], meta: { total: 0, limit: 1, offset: 0 } }))
  ]);

  const sections = [
    {
      title: 'Agencies',
      description: 'Manage travel agencies',
      count: agenciesResult.meta.total,
      href: '/admin/agencies',
      icon: Building2
    },
    {
      title: 'Users',
      description: 'Manage users and roles',
      count: usersResult.meta.total,
      href: '/admin/users',
      icon: Users
    },
    {
      title: 'Bookings',
      description: 'View and manage all bookings',
      count: bookingsResult.meta.total,
      href: '/admin/bookings',
      icon: BookOpen
    },
    {
      title: 'Audit Logs',
      description: 'Track system activity and changes',
      count: null,
      href: '/admin/audit',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage agencies, users, bookings, and audit logs</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">{s.title}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {s.count !== null ? (
                  <div className="text-2xl font-bold">{s.count}</div>
                ) : (
                  <div className="flex items-center text-sm text-muted-foreground">
                    View logs <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
