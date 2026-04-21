import { listUsersPaged, listAgenciesPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SearchFilter } from '@/components/shared/search-filter';
import { RoleFilter } from '@/components/shared/role-filter';
import { UserActions } from './components/user-actions';
import { CreateAgentForm } from './components/create-agent-form';

const DEFAULT_LIMIT = 20;

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await getSessionToken();
  if (!token) return null;

  const sp = await searchParams;
  const limit = Number(sp.limit) || DEFAULT_LIMIT;
  const offset = Number(sp.offset) || 0;
  const search = typeof sp.search === 'string' ? sp.search : undefined;
  const role = typeof sp.role === 'string' ? sp.role : undefined;

  const [result, agenciesResult] = await Promise.all([
    listUsersPaged(token, { limit, offset, search, role }).catch(() => ({
      items: [],
      meta: { total: 0, limit, offset }
    })),
    listAgenciesPaged(token, { limit: 100 }).catch(() => ({
      items: [],
      meta: { total: 0, limit: 100, offset: 0 }
    }))
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Users</h1>
        <p className="text-sm text-muted-foreground">Manage users and roles</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchFilter basePath="/admin/users" param="search" placeholder="Search users..." />
          <RoleFilter basePath="/admin/users" currentRole={role} />
        </div>
        <CreateAgentForm agencies={agenciesResult.items.map((a) => ({ id: a.id, name: a.name }))} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {result.items.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-xs">
                      {u.role}
                    </Badge>
                    <UserActions id={u.id} name={u.name} phone={u.phone} agencyId={u.agencyId} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <PaginationControls basePath="/admin/users" meta={result.meta} params={{ search, role }} />
        </CardContent>
      </Card>
    </div>
  );
}
