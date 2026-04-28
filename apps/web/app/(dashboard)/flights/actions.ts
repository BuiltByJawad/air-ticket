'use server';

import { searchFlights, type FlightOffer } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';

interface LoadMoreInput {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
  after: string;
}

export async function loadMoreFlightsAction(input: LoadMoreInput): Promise<{
  offers: FlightOffer[];
  nextCursor?: string;
}> {
  const token = await getSessionToken();
  if (!token) return { offers: [], nextCursor: undefined };

  const res = await searchFlights(token, {
    origin: input.origin,
    destination: input.destination,
    departureDate: input.departureDate,
    adults: input.adults,
    limit: 10,
    after: input.after,
  });

  return { offers: res.offers, nextCursor: res.nextCursor };
}
