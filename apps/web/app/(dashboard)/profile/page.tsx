import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApiError, fetchMe } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProfileEditForm } from './components/profile-edit-form';

export default async function ProfilePage() {
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

  const u = me.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Full Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-medium">{u.name || 'Not set'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-medium truncate">{u.email}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-medium">{u.phone || 'Not set'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{u.role}</Badge>
          </CardContent>
        </Card>
      </div>

      {u.agency && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Agency Name</p>
                <p className="font-medium"><Link href={`/admin/agencies/${u.agency.id}`} className="hover:underline">{u.agency.name}</Link></p>
              </div>
              <div>
                <p className="text-muted-foreground">Agency ID</p>
                <p className="font-medium font-mono text-xs truncate">{u.agency.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm initialName={u.name ?? null} initialPhone={u.phone ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
