import { getUserDetail } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Users, BookOpen, DollarSign, ArrowLeft, Mail, Phone, Building2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RoleChangeForm } from './components/role-change-form';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return null;

  const { id } = await params;
  const user = await getUserDetail(token, id).catch((err) => {
    console.error('Failed to fetch user detail:', err);
    return null;
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{user.name || user.email}</h1>
          <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-medium truncate">{user.email}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Role</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
              <RoleChangeForm userId={user.id} currentRole={user.role} userName={user.name || user.email} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Phone</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-medium">{user.phone || 'Not set'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Agency</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {user.agencyName ? (
              <Link href={`/admin/agencies/${user.agencyId}`} className="text-base font-medium hover:underline">
                {user.agencyName}
              </Link>
            ) : (
              <div className="text-base text-muted-foreground">No agency</div>
            )}
          </CardContent>
        </Card>
      </div>

      {user.role === 'agent' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Bookings</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.bookingsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Created by this agent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.revenueCurrency} {user.confirmedRevenue}</div>
              <p className="text-xs text-muted-foreground mt-1">From confirmed bookings</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Created</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
