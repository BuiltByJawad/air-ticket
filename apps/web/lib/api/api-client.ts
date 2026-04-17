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
    name?: string | null;
    phone?: string | null;
    agency?: { id: string; name: string } | null;
  };
}

export interface FlightSegment {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  marketingCarrier: string;
  flightNumber: string;
  duration?: string;
  aircraft?: string;
}

export interface MoneyAmount {
  currency: string;
  amount: string;
}

export interface FlightOffer {
  id: string;
  segments: FlightSegment[];
  totalPrice: MoneyAmount;
  source?: 'duffel' | 'stub';
  validUntil?: string;
}

export interface FlightSearchResponse {
  offers: FlightOffer[];
  nextCursor?: string;
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
  input: { origin: string; destination: string; departureDate: string; adults: number; limit?: number; after?: string }
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

export async function getBooking(accessToken: string, id: string): Promise<Booking> {
  const res = await apiFetch(`/bookings/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new ApiError('Failed to get booking', res.status);
  }

  const data: Booking = (await res.json()) as Booking;
  return data;
}

export async function confirmBooking(accessToken: string, id: string): Promise<Booking> {
  const res = await apiFetch(`/bookings/${encodeURIComponent(id)}/confirm`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new ApiError('Failed to confirm booking', res.status);
  }

  const data: Booking = (await res.json()) as Booking;
  return data;
}

export async function cancelBooking(accessToken: string, id: string): Promise<Booking> {
  const res = await apiFetch(`/bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw new ApiError('Failed to cancel booking', res.status);
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

export interface RegisterResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    agencyId: string | null;
  };
}

export async function registerWithPassword(input: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  agencyName: string;
}): Promise<RegisterResponse> {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    throw new ApiError('Registration failed', res.status);
  }

  const data: RegisterResponse = (await res.json()) as RegisterResponse;
  return data;
}

export interface AirportSuggestion {
  iata: string;
  name: string;
  city: string;
  country: string;
}

export interface AdminAgency {
  id: string;
  name: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'agent' | 'admin';
  agencyId: string | null;
  createdAt: string;
}

export async function listAgencies(accessToken: string): Promise<AdminAgency[]> {
  const res = await apiFetch('/admin/agencies', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new ApiError('Failed to list agencies', res.status);
  return (await res.json()) as AdminAgency[];
}

export async function listUsers(accessToken: string): Promise<AdminUser[]> {
  const res = await apiFetch('/admin/users', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new ApiError('Failed to list users', res.status);
  return (await res.json()) as AdminUser[];
}

export async function listAllBookings(accessToken: string): Promise<Booking[]> {
  const res = await apiFetch('/bookings', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new ApiError('Failed to list all bookings', res.status);
  return (await res.json()) as Booking[];
}

export async function suggestAirports(accessToken: string, query: string): Promise<AirportSuggestion[]> {
  const res = await apiFetch(`/flights/airports?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    return [];
  }

  const data: AirportSuggestion[] = (await res.json()) as AirportSuggestion[];
  return data;
}
