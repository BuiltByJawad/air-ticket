import { listAuditLogsPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { AuditActionFilter } from '@/components/shared/audit-action-filter';
import { AuditResourceFilter } from '@/components/shared/audit-resource-filter';
import { SearchFilter } from '@/components/shared/search-filter';
import { BookingDateFilter } from '@/components/shared/booking-date-filter';
import { AuditLogDetail } from './components/audit-log-detail';

const DEFAULT_LIMIT = 20;

export default async function AuditLogsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await getSessionToken();
  if (!token) return null;

  const sp = await searchParams;
  const limit = Number(sp.limit) || DEFAULT_LIMIT;
  const offset = Number(sp.offset) || 0;
  const action = typeof sp.action === 'string' ? sp.action : undefined;
  const resource = typeof sp.resource === 'string' ? sp.resource : undefined;
  const search = typeof sp.search === 'string' ? sp.search : undefined;
  const fromDate = typeof sp.fromDate === 'string' ? sp.fromDate : undefined;
  const toDate = typeof sp.toDate === 'string' ? sp.toDate : undefined;

  const result = await listAuditLogsPaged(token, { limit, offset, action, resource, search, fromDate, toDate }).catch(() => ({
    items: [],
    meta: { total: 0, limit, offset }
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track system activity and changes</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AuditActionFilter basePath="/admin/audit" currentAction={action} />
        <AuditResourceFilter basePath="/admin/audit" currentResource={resource} />
        <SearchFilter basePath="/admin/audit" param="search" placeholder="Search actions..." />
        <BookingDateFilter basePath="/admin/audit" fromDate={fromDate} toDate={toDate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No audit logs found.</p>
          ) : (
            <div className="space-y-3">
              {result.items.map((log) => (
                <AuditLogDetail key={log.id} log={log} />
              ))}
            </div>
          )}
          <PaginationControls
            basePath="/admin/audit"
            meta={result.meta}
            params={{ action, resource, search, fromDate, toDate }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
