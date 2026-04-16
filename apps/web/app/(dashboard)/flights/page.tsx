import { Search, PlaneTakeoff, PlaneLanding, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBooking, quoteFlight, searchFlights } from '@/lib/api/api-client';
import { clearSessionToken, getSessionToken } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function FlightsPage({
  searchParams
}: {
  searchParams?: { origin?: string; destination?: string; departureDate?: string; adults?: string };
}) {
  const token = getSessionToken();
  if (!token) {
    redirect('/auth/login');
  }

  const origin = (searchParams?.origin ?? '').trim();
  const destination = (searchParams?.destination ?? '').trim();
  const departureDate = (searchParams?.departureDate ?? '').trim();
  const adultsRaw = (searchParams?.adults ?? '').trim();
  const adults = Number(adultsRaw || '1');

  let offers: { id: string; summary: string; currency: string; amount: string }[] = [];
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

      offers = res.offers.map((o) => ({
        id: o.id,
        summary: `${o.segments[0]?.from ?? ''} → ${o.segments[0]?.to ?? ''} (${o.segments[0]?.flightNumber ?? ''})`,
        currency: o.totalPrice.currency,
        amount: o.totalPrice.amount
      }));
    } catch {
      clearSessionToken();
      redirect('/auth/login');
    }
  }

  async function bookOffer(formData: FormData) {
    'use server';

    const offerId = String(formData.get('offerId') ?? '').trim();
    if (!offerId) {
      redirect('/flights');
    }

    const t = getSessionToken();
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
      clearSessionToken();
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
              <Input id="adults" name="adults" type="number" min={1} max={9} defaultValue={String(Number.isFinite(adults) ? adults : 1)} required />
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
          <h2 className="text-xl font-semibold">{offers.length} flight{offers.length !== 1 ? 's' : ''} found</h2>
          <div className="grid gap-4">
            {offers.map((o) => (
              <Card key={o.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{o.summary}</p>
                    <p className="text-sm text-muted-foreground">
                      {o.currency} {o.amount} per passenger
                    </p>
                  </div>
                  <form action={bookOffer}>
                    <input type="hidden" name="offerId" value={o.id} />
                    <Button type="submit">Book Now</Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
