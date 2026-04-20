import { redirect } from 'next/navigation';
import { ApiError, fetchMe, listAgenciesPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControls } from '@/components/shared/pagination-controls';

const DEFAULT_LIMIT = 20;

export default async function AdminAgenciesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  const sp = await searchParams;
  const limit = Number(sp.limit) || DEFAULT_LIMIT;
  const offset = Number(sp.offset) || 0;

  const result = await listAgenciesPaged(token, { limit, offset }).catch(() => ({
    items: [],
    meta: { total: 0, limit, offset }
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Agencies</h1>
        <p className="text-sm text-muted-foreground">Manage travel agencies</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Agencies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No agencies yet.</p>
          ) : (
            <div className="space-y-3">
              {result.items.map((a) => (
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
          <PaginationControls basePath="/admin/agencies" meta={result.meta} />
        </CardContent>
      </Card>
    </div>
  );
}
