import { Search, PlaneTakeoff, PlaneLanding, Users, Clock, Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createBooking, quoteFlight, searchFlights, type FlightOffer } from '@/lib/api/api-client';
import { clearSessionToken, getSessionToken } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

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

function OfferSourceBadge({ source }: { source?: 'duffel' | 'stub' }) {
  if (source === 'duffel') return <Badge variant="success">Duffel</Badge>;
  return <Badge variant="secondary">Demo</Badge>;
}

export default async function FlightsPage({
  searchParams
}: {
  searchParams?: Promise<{ origin?: string; destination?: string; departureDate?: string; adults?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) {
    redirect('/auth/login');
  }

  const params = (await searchParams) ?? {};
  const origin = (params.origin ?? '').trim();
  const destination = (params.destination ?? '').trim();
  const departureDate = (params.departureDate ?? '').trim();
  const adultsRaw = (params.adults ?? '').trim();
  const adults = Number(adultsRaw || '1');

  let offers: FlightOffer[] = [];
  let searched = false;

  const shouldSearch = origin.length > 0 && destination.length > 0 && departureDate.length > 0;

  if (shouldSearch) {
    searched = true;
    try {
      const res = await searchFlights(token, {
        origin,
        destination,
        departureDate,
        adults: Number.isFinite(adults) && adults > 0 ? adults : 1
      });
      offers = res.offers;
    } catch {
      await clearSessionToken();
      redirect('/auth/login');
    }
  }

  async function bookOffer(formData: FormData) {
    'use server';

    const offerId = String(formData.get('offerId') ?? '').trim();
    if (!offerId) {
      redirect('/flights');
    }

    const t = await getSessionToken();
    if (!t) {
      redirect('/auth/login');
    }

    try {
      const quote = await quoteFlight(t, { offerId });
      await createBooking(t, {
        offerId: quote.offer.id,
        offerData: quote.offer,
        currency: quote.offer.totalPrice.currency,
        amount: quote.offer.totalPrice.amount
      });
    } catch {
      await clearSessionToken();
      redirect('/auth/login');
    }

    redirect('/bookings');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Flights</h1>
        <p className="text-muted-foreground">Find and book flights for your customers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" action="/flights" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label htmlFor="origin" className="text-sm font-medium flex items-center gap-1">
                <PlaneTakeoff className="h-3 w-3" /> Origin
              </label>
              <Input id="origin" name="origin" placeholder="DAC" defaultValue={origin} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="destination" className="text-sm font-medium flex items-center gap-1">
                <PlaneLanding className="h-3 w-3" /> Destination
              </label>
              <Input id="destination" name="destination" placeholder="DXB" defaultValue={destination} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="departureDate" className="text-sm font-medium">Departure</label>
              <Input id="departureDate" name="departureDate" type="date" defaultValue={departureDate} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="adults" className="text-sm font-medium flex items-center gap-1">
                <Users className="h-3 w-3" /> Passengers
              </label>
              <Input
                id="adults"
                name="adults"
                type="number"
                min={1}
                max={9}
                defaultValue={String(Number.isFinite(adults) ? adults : 1)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searched && offers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No flights found for this route. Try different airports or dates.
          </CardContent>
        </Card>
      )}

      {offers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {offers.length} flight{offers.length !== 1 ? 's' : ''} found
          </h2>
          <div className="grid gap-4">
            {offers.map((offer) => {
              const first = offer.segments[0];
              const last = offer.segments[offer.segments.length - 1];
              const stops = Math.max(0, offer.segments.length - 1);
              const duration = fmtDuration(first?.duration);

              return (
                <Card key={offer.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">
                            {first?.from ?? '--'}  {last?.to ?? '--'}
                          </p>
                          <OfferSourceBadge source={offer.source} />
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {first?.departureTime ? fmtTime(first.departureTime) : '--'} - {last?.arrivalTime ? fmtTime(last.arrivalTime) : '--'}
                          </span>
                          {duration ? (
                            <span className="flex items-center gap-1">
                              <Plane className="h-3 w-3" />
                              {duration}
                            </span>
                          ) : null}
                          <span>{stops === 0 ? 'Non-stop' : `${stops} stop${stops !== 1 ? 's' : ''}`}</span>
                          <span className="font-medium text-foreground">
                            {offer.totalPrice.currency} {offer.totalPrice.amount}
                          </span>
                        </div>
                      </div>

                      <form action={bookOffer} className="shrink-0">
                        <input type="hidden" name="offerId" value={offer.id} />
                        <Button type="submit">Book Now</Button>
                      </form>
                    </div>

                    {offer.segments.length > 0 && (
                      <div className="mt-4 space-y-2 rounded-md border bg-muted/30 p-3">
                        {offer.segments.map((seg, idx) => (
                          <div key={`${offer.id}-${idx}`} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm">
                              <span className="font-medium">{seg.marketingCarrier}{seg.flightNumber.replace(seg.marketingCarrier, '')}</span>
                              <span className="text-muted-foreground">  {seg.from}  {seg.to}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {fmtTime(seg.departureTime)} - {fmtTime(seg.arrivalTime)}
                              {seg.duration ? `  ${fmtDuration(seg.duration)}` : ''}
                              {seg.aircraft ? `  ${seg.aircraft}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
