import { loadWebEnv } from '../config/env';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

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
  offerData: Record<string, unknown>;
  totalPrice: {
    currency: string;
    amount: string;
  };
  agencyId: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

async function toApiError(res: Response, message: string): Promise<ApiError> {
  let details: string | null = null;
  try {
    const body: unknown = await res.json();
    if (typeof body === 'object' && body !== null) {
      if ('message' in body && typeof (body as { message?: unknown }).message === 'string') {
        details = (body as { message: string }).message;
      } else {
        details = JSON.stringify(body);
      }
    }
  } catch {
    // ignore
  }

  const fullMessage = details ? `${message}: ${details}` : message;
  return new ApiError(fullMessage, res.status);
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  const json: unknown = await res.json();
  if (
    typeof json === 'object' &&
    json !== null &&
    'success' in json &&
    (json as { success?: unknown }).success === true &&
    'data' in json
  ) {
    return (json as ApiEnvelope<T>).data;
  }
  return json as T;
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
    throw await toApiError(res, 'Invalid credentials');
  }

  return parseApiResponse<AuthTokenResponse>(res);
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const res = await apiFetch('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw await toApiError(res, 'Unauthorized');
  }

  return parseApiResponse<MeResponse>(res);
}

export async function updateProfile(accessToken: string, input: { name?: string; phone?: string; currentPassword?: string; password?: string }): Promise<MeResponse> {
  const res = await apiFetch('/auth/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    throw await toApiError(res, 'Failed to update profile');
  }

  return parseApiResponse<MeResponse>(res);
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
    throw await toApiError(res, 'Failed to search flights');
  }

  return parseApiResponse<FlightSearchResponse>(res);
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
    throw await toApiError(res, 'Failed to quote flight');
  }

  return parseApiResponse<FlightQuoteResponse>(res);
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
    throw await toApiError(res, 'Failed to create booking');
  }

  return parseApiResponse<Booking>(res);
}

export async function getBooking(accessToken: string, id: string): Promise<Booking> {
  const res = await apiFetch(`/bookings/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw await toApiError(res, 'Failed to get booking');
  }

  return parseApiResponse<Booking>(res);
}

export async function confirmBooking(accessToken: string, id: string): Promise<Booking> {
  const res = await apiFetch(`/bookings/${encodeURIComponent(id)}/confirm`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw await toApiError(res, 'Failed to confirm booking');
  }

  return parseApiResponse<Booking>(res);
}

export async function cancelBooking(accessToken: string, id: string): Promise<Booking> {
  const res = await apiFetch(`/bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw await toApiError(res, 'Failed to cancel booking');
  }

  return parseApiResponse<Booking>(res);
}

export async function listBookings(
  accessToken: string,
  input?: {
    agencyId?: string;
    status?: 'draft' | 'confirmed' | 'cancelled';
    limit?: number;
    offset?: number;
  }
): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (input?.agencyId) params.set('agencyId', input.agencyId);
  if (input?.status) params.set('status', input.status);
  if (input?.limit !== undefined) params.set('limit', String(input.limit));
  if (input?.offset !== undefined) params.set('offset', String(input.offset));

  const url = params.size > 0 ? `/bookings?${params.toString()}` : '/bookings';

  const res = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw await toApiError(res, 'Failed to list bookings');
  }

  return parseApiResponse<Booking[]>(res);
}

export async function listBookingsPaged(
  accessToken: string,
  input?: {
    agencyId?: string;
    status?: 'draft' | 'confirmed' | 'cancelled';
    limit?: number;
    offset?: number;
  }
): Promise<PaginatedResult<Booking>> {
  const params = new URLSearchParams();
  if (input?.agencyId) params.set('agencyId', input.agencyId);
  if (input?.status) params.set('status', input.status);
  if (input?.limit !== undefined) params.set('limit', String(input.limit));
  if (input?.offset !== undefined) params.set('offset', String(input.offset));

  const url = params.size > 0 ? `/bookings/paged?${params.toString()}` : '/bookings/paged';

  const res = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    throw await toApiError(res, 'Failed to list bookings');
  }

  return parseApiResponse<PaginatedResult<Booking>>(res);
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
    throw await toApiError(res, 'Registration failed');
  }

  return parseApiResponse<RegisterResponse>(res);
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
  if (!res.ok) throw await toApiError(res, 'Failed to list agencies');
  return parseApiResponse<AdminAgency[]>(res);
}

export async function listAgenciesPaged(
  accessToken: string,
  input?: { limit?: number; offset?: number; search?: string }
): Promise<PaginatedResult<AdminAgency>> {
  const params = new URLSearchParams();
  if (input?.limit !== undefined) params.set('limit', String(input.limit));
  if (input?.offset !== undefined) params.set('offset', String(input.offset));
  if (input?.search) params.set('search', input.search);

  const url = params.size > 0 ? `/admin/agencies/paged?${params.toString()}` : '/admin/agencies/paged';

  const res = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw await toApiError(res, 'Failed to list agencies');
  return parseApiResponse<PaginatedResult<AdminAgency>>(res);
}

export async function listUsers(accessToken: string): Promise<AdminUser[]> {
  const res = await apiFetch('/admin/users', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw await toApiError(res, 'Failed to list users');
  return parseApiResponse<AdminUser[]>(res);
}

export async function listUsersPaged(
  accessToken: string,
  input?: { limit?: number; offset?: number; role?: string; search?: string }
): Promise<PaginatedResult<AdminUser>> {
  const params = new URLSearchParams();
  if (input?.limit !== undefined) params.set('limit', String(input.limit));
  if (input?.offset !== undefined) params.set('offset', String(input.offset));
  if (input?.role) params.set('role', input.role);
  if (input?.search) params.set('search', input.search);

  const url = params.size > 0 ? `/admin/users/paged?${params.toString()}` : '/admin/users/paged';

  const res = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw await toApiError(res, 'Failed to list users');
  return parseApiResponse<PaginatedResult<AdminUser>>(res);
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  agencyId?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export async function createAgency(accessToken: string, input: { name: string }): Promise<AdminAgency> {
  const res = await apiFetch('/admin/agencies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw await toApiError(res, 'Failed to create agency');
  return parseApiResponse<AdminAgency>(res);
}

export async function createAgent(accessToken: string, input: { agencyId: string; email: string; password: string }): Promise<AdminUser> {
  const res = await apiFetch('/admin/users/agents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw await toApiError(res, 'Failed to create agent');
  return parseApiResponse<AdminUser>(res);
}

export async function updateAgency(
  accessToken: string,
  id: string,
  input: { name?: string }
): Promise<AdminAgency> {
  const res = await apiFetch(`/admin/agencies/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw await toApiError(res, 'Failed to update agency');
  return parseApiResponse<AdminAgency>(res);
}

export async function deleteAgency(accessToken: string, id: string): Promise<AdminAgency> {
  const res = await apiFetch(`/admin/agencies/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw await toApiError(res, 'Failed to delete agency');
  return parseApiResponse<AdminAgency>(res);
}

export async function updateUser(
  accessToken: string,
  id: string,
  input: { name?: string; phone?: string; agencyId?: string }
): Promise<AdminUser> {
  const res = await apiFetch(`/admin/users/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw await toApiError(res, 'Failed to update user');
  return parseApiResponse<AdminUser>(res);
}

export async function deleteUser(accessToken: string, id: string): Promise<AdminUser> {
  const res = await apiFetch(`/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw await toApiError(res, 'Failed to delete user');
  return parseApiResponse<AdminUser>(res);
}

export async function listAuditLogsPaged(
  accessToken: string,
  input?: {
    action?: string;
    resource?: string;
    agencyId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<PaginatedResult<AuditLog>> {
  const params = new URLSearchParams();
  if (input?.action) params.set('action', input.action);
  if (input?.resource) params.set('resource', input.resource);
  if (input?.agencyId) params.set('agencyId', input.agencyId);
  if (input?.userId) params.set('userId', input.userId);
  if (input?.limit !== undefined) params.set('limit', String(input.limit));
  if (input?.offset !== undefined) params.set('offset', String(input.offset));

  const url = params.size > 0 ? `/admin/audit-log?${params.toString()}` : '/admin/audit-log';

  const res = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw await toApiError(res, 'Failed to list audit logs');
  return parseApiResponse<PaginatedResult<AuditLog>>(res);
}

export async function suggestAirports(query: string, accessToken?: string): Promise<AirportSuggestion[]> {
  const res = await apiFetch(`/flights/airports?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  });

  if (!res.ok) {
    return [];
  }

  return parseApiResponse<AirportSuggestion[]>(res);
}

export interface AdminStats {
  totalAgencies: number;
  totalUsers: number;
  totalAgents: number;
  totalBookings: number;
  bookingsByStatus: { draft: number; confirmed: number; cancelled: number };
  totalRevenue: string;
  revenueCurrency: string;
  topAgencies: { agencyId: string; agencyName: string; revenue: string; bookingCount: number }[];
  recentBookingsCount: number;
}

export async function getAdminStats(accessToken: string): Promise<AdminStats> {
  const res = await apiFetch('/admin/stats', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw await toApiError(res, 'Failed to get admin stats');
  return parseApiResponse<AdminStats>(res);
}

export async function forgotPassword(email: string): Promise<{ message: string; token?: string }> {
  const res = await apiFetch('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw await toApiError(res, 'Failed to request password reset');
  return parseApiResponse<{ message: string; token?: string }>(res);
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const res = await apiFetch('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  if (!res.ok) throw await toApiError(res, 'Failed to reset password');
  return parseApiResponse<{ message: string }>(res);
}
