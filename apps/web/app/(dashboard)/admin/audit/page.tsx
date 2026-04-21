import { listAuditLogsPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationControls } from '@/components/shared/pagination-controls';

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

  const result = await listAuditLogsPaged(token, { limit, offset, action, resource }).catch(() => ({
    items: [],
    meta: { total: 0, limit, offset }
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track system activity and changes</p>
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
                <div key={log.id} className="flex flex-col gap-1 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{log.action}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Resource: <span className="font-medium text-foreground">{log.resource}</span></span>
                    {log.resourceId && <span>ID: <span className="font-mono text-foreground">{log.resourceId}</span></span>}
                    {log.userId && <span>User: <span className="font-mono text-foreground">{log.userId}</span></span>}
                    {log.agencyId && <span>Agency: <span className="font-mono text-foreground">{log.agencyId}</span></span>}
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="mt-1 text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            basePath="/admin/audit"
            meta={result.meta}
            params={{ action, resource }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
