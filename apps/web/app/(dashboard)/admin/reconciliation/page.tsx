import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionToken } from '@/lib/auth/session';
import { getReconciliationSummary, listAgenciesPaged } from '@/lib/api/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingDateFilter } from '@/components/shared/booking-date-filter';

export default async function AdminReconciliationPage({
  searchParams
}: {
  searchParams?: Promise<{ agencyId?: string; fromDate?: string; toDate?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect('/login');

  const sp = (await searchParams) ?? {};
  const agencyId = sp.agencyId;
  const fromDate = sp.fromDate;
  const toDate = sp.toDate;

  const [summary, agencies] = await Promise.all([
    getReconciliationSummary(token, { agencyId, fromDate, toDate }),
    listAgenciesPaged(token, { limit: 200, offset: 0 })
  ]);

  const params = new URLSearchParams();
  if (agencyId) params.set('agencyId', agencyId);
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  const exportHref = `/api/reconciliation-export${params.size > 0 ? `?${params.toString()}` : ''}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reconciliation</h1>
          <p className="text-sm text-muted-foreground">Cross-check bookings, payments, and refunds.</p>
        </div>
        <Link href={exportHref}>
          <Button>Export CSV</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form action="/admin/reconciliation" method="get" className="flex items-end gap-2">
          <div className="space-y-1">
            <label htmlFor="agencyId" className="text-xs text-muted-foreground">Agency</label>
            <select id="agencyId" name="agencyId" defaultValue={agencyId ?? ''} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">All agencies</option>
              {agencies.items.map((agency) => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
            </select>
          </div>
          {fromDate ? <input type="hidden" name="fromDate" value={fromDate} /> : null}
          {toDate ? <input type="hidden" name="toDate" value={toDate} /> : null}
          <Button size="sm" type="submit" variant="outline">Apply</Button>
          {agencyId ? <Link href={fromDate || toDate ? `/admin/reconciliation?${new URLSearchParams({ ...(fromDate ? { fromDate } : {}), ...(toDate ? { toDate } : {}) }).toString()}` : '/admin/reconciliation'}><Button size="sm" variant="ghost">Clear</Button></Link> : null}
        </form>
        <BookingDateFilter basePath="/admin/reconciliation" fromDate={fromDate} toDate={toDate} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Bookings</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.totals.bookings}</CardContent></Card>
        <Card><CardHeader><CardTitle>Confirmed</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.totals.confirmed}</CardContent></Card>
        <Card><CardHeader><CardTitle>Cancelled</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.totals.cancelled}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment State</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <p>Pending: <span className="font-semibold">{summary.totals.paymentState.pending}</span></p>
          <p>Succeeded: <span className="font-semibold">{summary.totals.paymentState.succeeded}</span></p>
          <p>Failed: <span className="font-semibold">{summary.totals.paymentState.failed}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Refund State</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <p>Pending: <span className="font-semibold">{summary.totals.refundsPending}</span></p>
          <p>Approved: <span className="font-semibold">{summary.totals.refundsApproved}</span></p>
          <p>Processed: <span className="font-semibold">{summary.totals.refundsProcessed}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Issues</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {summary.issues.length === 0 ? <p className="text-sm text-muted-foreground">No issues found.</p> : null}
          {summary.issues.map((issue) => (
            <div key={issue.code} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{issue.code}</span>
              <span className="font-semibold">{issue.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
