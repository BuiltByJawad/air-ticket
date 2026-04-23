import { ArrowLeft, Calendar, CheckCircle2, Clock, DollarSign, Plane, Receipt, Users, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiError, getBooking } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { confirmBookingAction, cancelBookingAction } from './actions';
import { BookingToast } from './components/booking-toast';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function fmtDuration(dur?: string) {
  if (!dur) return null;
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return dur;
  return `${m[1] ?? '0'}h ${m[2] ?? '0'}m`;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'draft' ? 'warning' : status === 'confirmed' ? 'success' : status === 'cancelled' ? 'destructive' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}

interface SegmentData {
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
  marketingCarrier?: string;
  flightNumber?: string;
  duration?: string;
  aircraft?: string;
}

interface TravelerData {
  id?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  travelerType?: string;
}

function isSegmentArray(data: unknown): data is SegmentData[] {
  return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null;
}

function isTravelerArray(data: unknown): data is TravelerData[] {
  return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null;
}

export default async function BookingDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await getSessionToken();
  if (!token) {
    redirect('/login');
  }

  const { id } = await params;
  const sp = await searchParams;
  const backHref = typeof sp.from === 'string' ? sp.from : '/bookings';

  let booking: Awaited<ReturnType<typeof getBooking>>;
  try {
    booking = await getBooking(token, id);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/login');
    }
    notFound();
  }

  const offerData = booking.offerData as Record<string, unknown> | null;
  const segments: SegmentData[] = isSegmentArray(offerData?.segments)
    ? offerData.segments
    : [];
  const travelers: TravelerData[] = isTravelerArray(offerData?.travelers)
    ? offerData.travelers
    : [];
  const first = segments[0];
  const last = segments[segments.length - 1];
  const stops = Math.max(0, segments.length - 1);

  return (
    <div className="space-y-6">
      <BookingToast />
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Booking Details</h1>
          <p className="text-sm text-muted-foreground truncate">{id}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Status</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusBadge status={booking.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Total Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl truncate">
              {booking.totalPrice.currency} {booking.totalPrice.amount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(booking.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Flight Itinerary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold">
                {first?.from ?? '--'} → {last?.to ?? '--'}
              </p>
              {first?.departureTime && last?.arrivalTime && (
                <span className="text-sm text-muted-foreground">
                  {fmtTime(first.departureTime)} – {fmtTime(last.arrivalTime)}
                </span>
              )}
              {first?.duration && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {fmtDuration(first.duration)}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {stops === 0 ? 'Non-stop' : `${stops} stop${stops !== 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="space-y-3">
              {segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">
                      {seg.marketingCarrier ?? ''}{seg.flightNumber?.replace(seg.marketingCarrier ?? '', '') ?? ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {seg.from ?? '--'} → {seg.to ?? '--'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {seg.departureTime ? fmtTime(seg.departureTime) : '--'} – {seg.arrivalTime ? fmtTime(seg.arrivalTime) : '--'}
                    {seg.duration ? ` · ${fmtDuration(seg.duration)}` : ''}
                    {seg.aircraft ? ` · ${seg.aircraft}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {travelers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Passengers ({travelers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {travelers.map((t, idx) => (
                <div key={t.id ?? idx} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">
                      {t.firstName || t.lastName ? `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() : `Passenger ${idx + 1}`}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {t.travelerType && <span className="capitalize">{t.travelerType}</span>}
                      {t.gender && <span>{t.gender}</span>}
                      {t.birthDate && <span>{new Date(t.birthDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {t.email && <p className="truncate max-w-[200px]">{t.email}</p>}
                    {t.phone && <p>{t.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Booking Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Offer ID</p>
              <p className="font-medium truncate">{booking.offerId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(booking.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Agency ID</p>
              <p className="font-mono text-xs truncate">{booking.agencyId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created By</p>
              <p className="font-mono text-xs truncate">{booking.createdByUserId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {offerData && Object.keys(offerData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Raw Offer Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-muted-foreground bg-muted rounded p-3 overflow-x-auto max-h-96">
              {JSON.stringify(offerData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {booking.status === 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <form action={confirmBookingAction}>
              <input type="hidden" name="bookingId" value={id} />
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Confirm Booking
              </Button>
            </form>
            <form action={cancelBookingAction}>
              <input type="hidden" name="bookingId" value={id} />
              <Button type="submit" variant="destructive" className="gap-2">
                <XCircle className="h-4 w-4" /> Cancel Booking
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {booking.status === 'confirmed' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={cancelBookingAction}>
              <input type="hidden" name="bookingId" value={id} />
              <Button type="submit" variant="destructive" className="gap-2">
                <XCircle className="h-4 w-4" /> Cancel Booking
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
