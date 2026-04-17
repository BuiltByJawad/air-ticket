import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createBooking, quoteFlight, searchFlights } from '@/lib/api/api-client';
import { clearSessionToken, getSessionToken } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { LoadMoreOffers } from './components/load-more-offers';
import { FlightSearchForm } from './components/flight-search-form';

export default async function FlightsPage({
  searchParams
}: {
  searchParams?: Promise<{ origin?: string; destination?: string; departureDate?: string; adults?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) {
    redirect('/login');
  }

  const params = (await searchParams) ?? {};
  const origin = (params.origin ?? '').trim();
  const destination = (params.destination ?? '').trim();
  const departureDate = (params.departureDate ?? '').trim();
  const adultsRaw = (params.adults ?? '').trim();
  const adults = Number(adultsRaw || '1');

  let offers: import('@/lib/api/api-client').FlightOffer[] = [];
  let nextCursor: string | undefined;
  let searched = false;

  const shouldSearch = origin.length > 0 && destination.length > 0 && departureDate.length > 0;

  if (shouldSearch) {
    searched = true;
    try {
      const res = await searchFlights(token, {
        origin,
        destination,
        departureDate,
        adults: Number.isFinite(adults) && adults > 0 ? adults : 1,
        limit: 10
      });
      offers = res.offers;
      nextCursor = res.nextCursor;
    } catch {
      redirect('/login');
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
      redirect('/login');
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
      redirect('/login');
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
            Search Flights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FlightSearchForm token={token} />
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
        <LoadMoreOffers
          initialOffers={offers}
          initialCursor={nextCursor}
          searchInput={{ origin, destination, departureDate, adults: Number.isFinite(adults) && adults > 0 ? adults : 1 }}
          bookAction={bookOffer}
        />
      )}
    </div>
  );
}
