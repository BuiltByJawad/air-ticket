import { BookOpen, Calendar, DollarSign, PlaneTakeoff, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApiError, listBookingsPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { BookingExport } from '@/components/shared/booking-export';
import { exportBookingsCsvAction, exportBookingsPdfAction } from './actions';

function parseStatus(value: string | undefined): 'draft' | 'confirmed' | 'cancelled' | undefined {
  if (value === 'draft' || value === 'confirmed' || value === 'cancelled') return value;
  return undefined;
}

function parseNonNegativeInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || Number.isNaN(n) || n < 0) return undefined;
  return n;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || Number.isNaN(n) || n <= 0) return undefined;
  return n;
}

export default async function BookingsPage({
  searchParams
}: {
  searchParams?: { status?: string; limit?: string; offset?: string };
}) {
  const token = await getSessionToken();
  if (!token) {
    redirect('/login');
  }

  const status = parseStatus(searchParams?.status);
  const limit = parsePositiveInt(searchParams?.limit) ?? 20;
  const offset = parseNonNegativeInt(searchParams?.offset) ?? 0;

  let bookings: Awaited<ReturnType<typeof listBookingsPaged>> = { items: [], meta: { total: 0, limit, offset } };
  try {
    bookings = await listBookingsPaged(token, { status, limit, offset });
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/login');
    }
    throw err;
  }

  const baseParams = new URLSearchParams();
  baseParams.set('limit', String(limit));
  if (status) baseParams.set('status', status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bookings</h1>
          <p className="text-muted-foreground">Manage your customer bookings.</p>
        </div>
        <Link
          href="/flights"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlaneTakeoff className="h-4 w-4" /> New Search
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Link
            href={`/bookings?${new URLSearchParams({ limit: String(limit) }).toString()}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              !status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            All
          </Link>
          {(['draft', 'confirmed', 'cancelled'] as const).map((s) => {
            const p = new URLSearchParams(baseParams);
            p.set('status', s);
            return (
              <Link
                key={s}
                href={`/bookings?${p.toString()}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {s}
              </Link>
            );
          })}
        </div>
        <BookingExport
          status={status ?? undefined}
          onExportCsv={exportBookingsCsvAction}
          onExportPdf={exportBookingsPdfAction}
        />
      </div>

      {bookings.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Search flights to create your first booking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.items.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold text-sm sm:text-base truncate">{b.offerId}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(b.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm sm:text-base font-semibold">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {b.totalPrice.currency} {b.totalPrice.amount}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <PaginationControls
        basePath="/bookings"
        meta={bookings.meta}
        params={{ status: status ?? undefined }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'draft' ? 'warning' : status === 'confirmed' ? 'success' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}
