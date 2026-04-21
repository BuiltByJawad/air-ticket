import { listAgenciesPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SearchFilter } from '@/components/shared/search-filter';
import { AgencyActions } from './components/agency-actions';
import { CreateAgencyForm } from './components/create-agency-form';

const DEFAULT_LIMIT = 20;

export default async function AdminAgenciesPage({
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

  const result = await listAgenciesPaged(token, { limit, offset, search }).catch(() => ({
    items: [],
    meta: { total: 0, limit, offset }
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Agencies</h1>
        <p className="text-sm text-muted-foreground">Manage travel agencies</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <SearchFilter basePath="/admin/agencies" param="search" placeholder="Search agencies..." />
        <CreateAgencyForm />
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
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <AgencyActions id={a.id} name={a.name} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <PaginationControls basePath="/admin/agencies" meta={result.meta} params={{ search }} />
        </CardContent>
      </Card>
    </div>
  );
}
