import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/auth/session';
import { listAdminJobs } from '@/lib/api/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { cloneJobAction, retryJobAction, triggerJobAction } from './actions';
import { AutoRefreshToggle } from './components/auto-refresh-toggle';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'failed') return 'destructive';
  if (status === 'completed') return 'default';
  if (status === 'processing') return 'secondary';
  return 'outline';
}

export default async function AdminJobsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; type?: string; limit?: string; offset?: string }>;
}) {
  
  const token = await getSessionToken();
  if (!token) redirect('/login');

  const sp = (await searchParams) ?? {};
  const status = sp.status as 'pending' | 'processing' | 'completed' | 'failed' | undefined;
  const type = sp.type;
  const limit = Number(sp.limit) || 20;
  const offset = Number(sp.offset) || 0;

  const data = await listAdminJobs(token, { status, type, limit, offset });
  const statusOptions: Array<{ label: string; value?: 'pending' | 'processing' | 'completed' | 'failed' }> = [
    { label: 'All' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' }
  ];
  const presets: Array<{ label: string; status?: 'pending' | 'processing' | 'completed' | 'failed'; type?: string }> = [
    { label: 'Failed + payment.*', status: 'failed', type: 'payment' },
    { label: 'Failed + refund.*', status: 'failed', type: 'refund' },
    { label: 'Pending + payment.*', status: 'pending', type: 'payment' },
    { label: 'Pending + refund.*', status: 'pending', type: 'refund' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Job Operations</h1>
        <p className="text-sm text-muted-foreground">Review, retry, and trigger async jobs.</p>
      </div>
      <AutoRefreshToggle />

      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => {
          const params = new URLSearchParams();
          if (opt.value) params.set('status', opt.value);
          if (type) params.set('type', type);
          params.set('limit', String(limit));
          const q = params.toString();
          const href = q ? `/admin/jobs?${q}` : '/admin/jobs';
          const active = (status ?? '') === (opt.value ?? '');
          return (
            <Link key={opt.label} href={href}>
              <Button size="sm" variant={active ? 'default' : 'outline'}>
                {opt.label}
              </Button>
            </Link>
          );
        })}
        <form action="/admin/jobs" method="get" className="flex items-center gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input type="hidden" name="limit" value={String(limit)} />
          <Input name="type" defaultValue={type ?? ''} placeholder="Filter by type..." className="h-8 w-56" />
          <Button size="sm" type="submit" variant="outline">Apply</Button>
        </form>
        {(status || type) ? (
          <Link href="/admin/jobs">
            <Button size="sm" variant="ghost">Clear</Button>
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const params = new URLSearchParams();
          if (preset.status) params.set('status', preset.status);
          if (preset.type) params.set('type', preset.type);
          params.set('limit', String(limit));
          const href = `/admin/jobs?${params.toString()}`;
          const active = status === preset.status && type === preset.type;
          return (
            <Link key={preset.label} href={href}>
              <Button size="sm" variant={active ? 'default' : 'outline'}>
                {preset.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue ({data.total})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs found.</p>
          ) : null}
          {data.items.map((job) => (
            <div key={job.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/admin/jobs/${job.id}`} className="font-medium truncate hover:underline">
                    {job.type}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">{job.id}</p>
                </div>
                <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                attempts: {job.attempts}/{job.maxAttempts} - runAfter: {new Date(job.runAfter).toLocaleString()}
              </div>
              {job.lastError ? <p className="mt-1 text-xs text-red-600">{job.lastError}</p> : null}
              <div className="mt-3 flex items-center gap-2">
                <form action={async () => { 'use server'; await retryJobAction(job.id); }}>
                  <Button type="submit" size="sm" variant="outline">Retry</Button>
                </form>
                <form action={async () => { 'use server'; await triggerJobAction(job.id); }}>
                  <Button type="submit" size="sm">Trigger</Button>
                </form>
                <form action={async () => { 'use server'; await cloneJobAction(job.id); }}>
                  <Button type="submit" size="sm" variant="secondary">Clone</Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <PaginationControls
        basePath="/admin/jobs"
        meta={{ total: data.total, limit, offset }}
        params={{ status, type }}
      />
    </div>
  );
}
