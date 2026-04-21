'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AuditLog } from '@/lib/api/api-client';

function actionVariant(action: string): 'default' | 'secondary' | 'destructive' | 'warning' | 'success' {
  if (action.includes('delete')) return 'destructive';
  if (action.includes('cancel')) return 'destructive';
  if (action.includes('create')) return 'success';
  if (action.includes('confirm')) return 'success';
  if (action.includes('update')) return 'warning';
  return 'secondary';
}

export function AuditLogDetail({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <div className="rounded-lg border p-3">
      <button
        type="button"
        className="w-full text-left flex items-start justify-between gap-2"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasMetadata && (
              <span className="shrink-0 text-muted-foreground">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            )}
            <Badge variant={actionVariant(log.action)} className="text-xs shrink-0">{log.action}</Badge>
            <span className="text-xs text-muted-foreground font-medium">{log.resource}</span>
            {log.resourceId && <span className="text-xs text-muted-foreground font-mono truncate">{log.resourceId}</span>}
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(log.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            {log.userId && (
              <div>
                <span className="text-muted-foreground">User ID</span>
                <p className="font-mono">{log.userId}</p>
              </div>
            )}
            {log.agencyId && (
              <div>
                <span className="text-muted-foreground">Agency ID</span>
                <p className="font-mono">{log.agencyId}</p>
              </div>
            )}
            {log.requestId && (
              <div>
                <span className="text-muted-foreground">Request ID</span>
                <p className="font-mono">{log.requestId}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Log ID</span>
              <p className="font-mono">{log.id}</p>
            </div>
          </div>
          {hasMetadata && (
            <div>
              <span className="text-xs text-muted-foreground">Metadata</span>
              <pre className="mt-1 text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto max-h-48">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
