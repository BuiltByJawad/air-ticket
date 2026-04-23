import { listBookingsPaged } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { BookingStatusFilter } from '@/components/shared/booking-status-filter';
import { SearchFilter } from '@/components/shared/search-filter';
import { BookingActions } from './components/booking-actions';
import { BookingExport } from '@/components/shared/booking-export';
import { BookingDateFilter } from '@/components/shared/booking-date-filter';
import { exportBookingsCsvAction, exportBookingsPdfAction } from './actions';
import Link from 'next/link';

const DEFAULT_LIMIT = 20;

export default async function AdminBookingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await getSessionToken();
  if (!token) return null;

  const sp = await searchParams;
  const limit = Number(sp.limit) || DEFAULT_LIMIT;
  const offset = Number(sp.offset) || 0;
  const status = typeof sp.status === 'string' ? (sp.status as 'draft' | 'confirmed' | 'cancelled') : undefined;
  const search = typeof sp.search === 'string' ? sp.search : undefined;
  const fromDate = typeof sp.fromDate === 'string' ? sp.fromDate : undefined;
  const toDate = typeof sp.toDate === 'string' ? sp.toDate : undefined;

  const result = await listBookingsPaged(token, { limit, offset, status, search, fromDate, toDate }).catch(() => ({
    items: [],
    meta: { total: 0, limit, offset }
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">All Bookings</h1>
        <p className="text-sm text-muted-foreground">View and manage all bookings across agencies</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <BookingStatusFilter basePath="/admin/bookings" currentStatus={status} />
          <SearchFilter basePath="/admin/bookings" param="search" placeholder="Search offer ID..." />
          <BookingDateFilter basePath="/admin/bookings" fromDate={fromDate} toDate={toDate} />
        </div>
        <BookingExport
          status={status}
          search={search}
          onExportCsv={exportBookingsCsvAction}
          onExportPdf={exportBookingsPdfAction}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {result.items.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                  <Link href={`/bookings/${b.id}`} className="flex items-center justify-between flex-1 min-w-0 hover:bg-accent transition-colors -m-3 p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{b.offerId}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{b.id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'destructive' : 'warning'}
                        className="capitalize text-xs"
                      >
                        {b.status}
                      </Badge>
                      <span className="text-xs font-medium">{b.totalPrice.currency} {b.totalPrice.amount}</span>
                    </div>
                  </Link>
                  <BookingActions id={b.id} status={b.status} />
                </div>
              ))}
            </div>
          )}
          <PaginationControls basePath="/admin/bookings" meta={result.meta} params={{ status, search, fromDate, toDate }} />
        </CardContent>
      </Card>
    </div>
  );
}
