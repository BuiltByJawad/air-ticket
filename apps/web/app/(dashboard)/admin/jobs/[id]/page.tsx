import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/auth/session';
import { getAdminJob } from '@/lib/api/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'failed') return 'destructive';
  if (status === 'completed') return 'default';
  if (status === 'processing') return 'secondary';
  return 'outline';
}

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) redirect('/login');

  const { id } = await params;
  const job = await getAdminJob(token, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Job Detail</h1>
        <p className="text-sm text-muted-foreground">{job.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>{job.type}</span>
            <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Attempts:</span> {job.attempts}/{job.maxAttempts}</p>
          <p><span className="text-muted-foreground">Run After:</span> {new Date(job.runAfter).toLocaleString()}</p>
          <p><span className="text-muted-foreground">Created:</span> {new Date(job.createdAt).toLocaleString()}</p>
          <p><span className="text-muted-foreground">Updated:</span> {new Date(job.updatedAt).toLocaleString()}</p>
          {job.lastError ? <p className="text-red-600">{job.lastError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[420px] overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(job.payload, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
