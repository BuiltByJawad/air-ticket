import { loadWebEnv } from '../config/env';

export interface AuthTokenResponse {
  accessToken: string;
}

export interface MeResponse {
  user: {
    sub: string;
    email: string;
    role: 'agent' | 'admin';
    agencyId?: string | null;
  };
}

export interface FlightSegment {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  marketingCarrier: string;
  flightNumber: string;
}

export interface MoneyAmount {
  currency: string;
  amount: string;
}

export interface FlightOffer {
  id: string;
  segments: FlightSegment[];
  totalPrice: MoneyAmount;
}

export interface FlightSearchResponse {
  offers: FlightOffer[];
}

export interface FlightQuoteResponse {
  offer: FlightOffer;
}

export interface Booking {
  id: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  offerId: string;
  offerData: object;
  totalPrice: MoneyAmount;
  agencyId: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  const env = loadWebEnv();
  const url = new URL(path, env.API_BASE_URL);

  try {
    return await fetch(url, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.headers ?? {})
      },
      cache: 'no-store'
    });
  } catch {
    throw new ApiError('API unreachable', 0);
  }
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthTokenResponse> {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    throw new ApiError('Invalid credentials', res.status);
  }

  const data: AuthTokenResponse = (await res.json()) as AuthTokenResponse;
  return data;
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const res = await apiFetch('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new ApiError('Unauthorized', res.status);
  }

  const data: MeResponse = (await res.json()) as MeResponse;
  return data;
}

export async function searchFlights(
  accessToken: string,
  input: { origin: string; destination: string; departureDate: string; adults: number }
): Promise<FlightSearchResponse> {
  const res = await apiFetch('/flights/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    throw new ApiError('Failed to search flights', res.status);
  }

  const data: FlightSearchResponse = (await res.json()) as FlightSearchResponse;
  return data;
}

export async function quoteFlight(accessToken: string, input: { offerId: string }): Promise<FlightQuoteResponse> {
  const res = await apiFetch('/flights/quote', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    throw new ApiError('Failed to quote flight', res.status);
  }

  const data: FlightQuoteResponse = (await res.json()) as FlightQuoteResponse;
  return data;
}

export async function createBooking(
  accessToken: string,
  input: { offerId: string; offerData: object; currency: string; amount: string }
): Promise<Booking> {
  const res = await apiFetch('/bookings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    throw new ApiError('Failed to create booking', res.status);
  }

  const data: Booking = (await res.json()) as Booking;
  return data;
}

export async function listBookings(accessToken: string): Promise<Booking[]> {
  const res = await apiFetch('/bookings', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new ApiError('Failed to list bookings', res.status);
  }

  const data: Booking[] = (await res.json()) as Booking[];
  return data;
}
