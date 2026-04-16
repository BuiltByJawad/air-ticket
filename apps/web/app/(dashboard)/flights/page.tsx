import { redirect } from 'next/navigation';
import { createBooking, quoteFlight, searchFlights } from '../../../lib/api/api-client';
import { clearSessionToken, getSessionToken } from '../../../lib/auth/session';

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

  const shouldSearch = origin.length > 0 && destination.length > 0 && departureDate.length > 0;

  if (shouldSearch) {
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
    <main>
      <h1>Flights</h1>
      <p>
        <a href="/dashboard">Dashboard</a> | <a href="/bookings">Bookings</a>
      </p>

      <form method="get" action="/flights">
        <div>
          <label htmlFor="origin">Origin (IATA)</label>
          <input id="origin" name="origin" defaultValue={origin} required />
        </div>
        <div>
          <label htmlFor="destination">Destination (IATA)</label>
          <input id="destination" name="destination" defaultValue={destination} required />
        </div>
        <div>
          <label htmlFor="departureDate">Departure date</label>
          <input id="departureDate" name="departureDate" type="date" defaultValue={departureDate} required />
        </div>
        <div>
          <label htmlFor="adults">Adults</label>
          <input id="adults" name="adults" type="number" min={1} max={9} defaultValue={String(Number.isFinite(adults) ? adults : 1)} required />
        </div>
        <button type="submit">Search</button>
      </form>

      {offers.length > 0 ? (
        <section>
          <h2>Results</h2>
          {offers.map((o) => (
            <div key={o.id}>
              <p>{o.summary}</p>
              <p>
                Total: {o.currency} {o.amount}
              </p>
              <form action={bookOffer}>
                <input type="hidden" name="offerId" value={o.id} />
                <button type="submit">Book</button>
              </form>
            </div>
          ))}
        </section>
      ) : null}
    </main>
  );
}
