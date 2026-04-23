import type {
  Booking,
  MoneyAmount,
  AdminAgency,
  AdminUser,
  AgencyDetail,
  UserDetail,
  AuditLog,
  AirportSuggestion,
  AdminStats,
  AgentStats,
  AuthTokenResponse,
  MeResponse,
  FlightOffer,
  FlightSegment,
  FlightSearchResponse,
  FlightQuoteResponse,
  RegisterResponse,
  PaginatedResult,
  PaginationMeta
} from './api-client';

// --- Primitive helpers ---

function str(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function num(val: unknown, fallback = 0): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

function obj(val: unknown): Record<string, unknown> | null {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
    ? val as Record<string, unknown>
    : null;
}

function arr(val: unknown): unknown[] {
  return Array.isArray(val) ? val : [];
}

// --- Composite normalizers ---

function normalizeMoneyAmount(data: unknown): MoneyAmount {
  const o = obj(data) ?? {};
  return {
    currency: str(o.currency, 'USD'),
    amount: str(o.amount, '0.00')
  };
}

function normalizeFlightSegment(data: unknown): FlightSegment {
  const o = obj(data) ?? {};
  return {
    from: str(o.from),
    to: str(o.to),
    departureTime: str(o.departureTime),
    arrivalTime: str(o.arrivalTime),
    marketingCarrier: str(o.marketingCarrier),
    flightNumber: str(o.flightNumber),
    duration: typeof o.duration === 'string' ? o.duration : undefined,
    aircraft: typeof o.aircraft === 'string' ? o.aircraft : undefined
  };
}

function normalizeFlightOffer(data: unknown): FlightOffer {
  const o = obj(data) ?? {};
  return {
    id: str(o.id),
    segments: arr(o.segments).map(normalizeFlightSegment),
    totalPrice: normalizeMoneyAmount(o.totalPrice),
    source: typeof o.source === 'string' ? (o.source as FlightOffer['source']) : undefined,
    validUntil: typeof o.validUntil === 'string' ? o.validUntil : undefined
  };
}

// --- Public normalizers ---

export function normalizeBooking(data: unknown): Booking {
  const o = obj(data) ?? {};
  return {
    id: str(o.id),
    status: (['draft', 'confirmed', 'cancelled'].includes(str(o.status)) ? o.status : 'draft') as Booking['status'],
    offerId: str(o.offerId),
    offerData: (typeof o.offerData === 'object' && o.offerData !== null ? o.offerData : {}) as Record<string, unknown>,
    totalPrice: normalizeMoneyAmount(o.totalPrice),
    agencyId: str(o.agencyId),
    agencyName: typeof o.agencyName === 'string' ? o.agencyName : undefined,
    createdByUserId: str(o.createdByUserId),
    createdAt: str(o.createdAt),
    updatedAt: str(o.updatedAt)
  };
}

export function normalizeAuthTokenResponse(data: unknown): AuthTokenResponse {
  const o = obj(data) ?? {};
  const userObj = obj(o.user) ?? {};
  return {
    accessToken: str(o.accessToken),
    user: {
      id: str(userObj.id),
      email: str(userObj.email),
      role: str(userObj.role),
      agencyId: typeof userObj.agencyId === 'string' ? userObj.agencyId : null
    }
  };
}

export function normalizeMeResponse(data: unknown): MeResponse {
  const o = obj(data) ?? {};
  const userObj = obj(o.user) ?? {};
  const agencyObj = obj(userObj.agency);
  return {
    user: {
      sub: str(userObj.sub),
      email: str(userObj.email),
      role: (['agent', 'admin'].includes(str(userObj.role)) ? userObj.role : 'agent') as MeResponse['user']['role'],
      agencyId: typeof userObj.agencyId === 'string' ? userObj.agencyId : (userObj.agencyId === null ? null : undefined),
      name: typeof userObj.name === 'string' ? userObj.name : (userObj.name === null ? null : undefined),
      phone: typeof userObj.phone === 'string' ? userObj.phone : (userObj.phone === null ? null : undefined),
      agency: agencyObj ? { id: str(agencyObj.id), name: str(agencyObj.name) } : (userObj.agency === null ? null : undefined)
    }
  };
}

export function normalizeFlightSearchResponse(data: unknown): FlightSearchResponse {
  const o = obj(data) ?? {};
  return {
    offers: arr(o.offers).map(normalizeFlightOffer),
    nextCursor: typeof o.nextCursor === 'string' ? o.nextCursor : undefined
  };
}

export function normalizeFlightQuoteResponse(data: unknown): FlightQuoteResponse {
  const o = obj(data) ?? {};
  return {
    offer: normalizeFlightOffer(o.offer)
  };
}

export function normalizeAdminAgency(data: unknown): AdminAgency {
  const o = obj(data) ?? {};
  return {
    id: str(o.id),
    name: str(o.name),
    createdAt: str(o.createdAt)
  };
}

export function normalizeAdminUser(data: unknown): AdminUser {
  const o = obj(data) ?? {};
  return {
    id: str(o.id),
    email: str(o.email),
    name: typeof o.name === 'string' ? o.name : (o.name === null ? null : null),
    phone: typeof o.phone === 'string' ? o.phone : (o.phone === null ? null : null),
    role: (['agent', 'admin'].includes(str(o.role)) ? o.role : 'agent') as AdminUser['role'],
    agencyId: typeof o.agencyId === 'string' ? o.agencyId : (o.agencyId === null ? null : null),
    createdAt: str(o.createdAt)
  };
}

export function normalizeAgencyDetail(data: unknown): AgencyDetail {
  const o = obj(data) ?? {};
  return {
    id: str(o.id),
    name: str(o.name),
    createdAt: str(o.createdAt),
    agents: arr(o.agents).map((a) => {
      const ao = obj(a) ?? {};
      return {
        id: str(ao.id),
        email: str(ao.email),
        name: typeof ao.name === 'string' ? ao.name : null,
        createdAt: str(ao.createdAt)
      };
    }),
    agentsTotal: num(o.agentsTotal),
    bookingsCount: num(o.bookingsCount),
    confirmedRevenue: str(o.confirmedRevenue, '0.00'),
    revenueCurrency: str(o.revenueCurrency, 'USD')
  };
}

export function normalizeUserDetail(data: unknown): UserDetail {
  const o = obj(data) ?? {};
  return {
    id: str(o.id),
    email: str(o.email),
    name: typeof o.name === 'string' ? o.name : null,
    phone: typeof o.phone === 'string' ? o.phone : null,
    role: str(o.role),
    agencyId: typeof o.agencyId === 'string' ? o.agencyId : (o.agencyId === null ? null : null),
    agencyName: typeof o.agencyName === 'string' ? o.agencyName : (o.agencyName === null ? null : null),
    createdAt: str(o.createdAt),
    bookingsCount: num(o.bookingsCount),
    confirmedRevenue: str(o.confirmedRevenue, '0.00'),
    revenueCurrency: str(o.revenueCurrency, 'USD')
  };
}

export function normalizeAuditLog(data: unknown): AuditLog {
  const o = obj(data) ?? {};
  return {
    id: str(o.id),
    action: str(o.action),
    resource: str(o.resource),
    resourceId: typeof o.resourceId === 'string' ? o.resourceId : undefined,
    agencyId: typeof o.agencyId === 'string' ? o.agencyId : undefined,
    userId: typeof o.userId === 'string' ? o.userId : undefined,
    requestId: typeof o.requestId === 'string' ? o.requestId : undefined,
    metadata: typeof o.metadata === 'object' && o.metadata !== null ? (o.metadata as Record<string, unknown>) : undefined,
    createdAt: str(o.createdAt)
  };
}

export function normalizeAirportSuggestion(data: unknown): AirportSuggestion {
  const o = obj(data) ?? {};
  return {
    iata: str(o.iata),
    name: str(o.name),
    city: str(o.city),
    country: str(o.country)
  };
}

export function normalizeAdminStats(data: unknown): AdminStats {
  const o = obj(data) ?? {};
  const statusObj = obj(o.bookingsByStatus) ?? {};
  return {
    totalAgencies: num(o.totalAgencies),
    totalUsers: num(o.totalUsers),
    totalAgents: num(o.totalAgents),
    totalBookings: num(o.totalBookings),
    bookingsByStatus: {
      draft: num(statusObj.draft),
      confirmed: num(statusObj.confirmed),
      cancelled: num(statusObj.cancelled)
    },
    totalRevenue: str(o.totalRevenue, '0.00'),
    revenueCurrency: str(o.revenueCurrency, 'USD'),
    topAgencies: arr(o.topAgencies).map((a) => {
      const ao = obj(a) ?? {};
      return {
        agencyId: str(ao.agencyId),
        agencyName: str(ao.agencyName),
        revenue: str(ao.revenue, '0.00'),
        bookingCount: num(ao.bookingCount)
      };
    }),
    recentBookingsCount: num(o.recentBookingsCount),
    monthlyRevenue: arr(o.monthlyRevenue).map((m) => {
      const mo = obj(m) ?? {};
      return {
        month: str(mo.month),
        revenue: str(mo.revenue, '0.00'),
        bookingCount: num(mo.bookingCount)
      };
    })
  };
}

export function normalizeAgentStats(data: unknown): AgentStats {
  const o = obj(data) ?? {};
  const statusObj = obj(o.bookingsByStatus) ?? {};
  return {
    totalBookings: num(o.totalBookings),
    bookingsByStatus: {
      draft: num(statusObj.draft),
      confirmed: num(statusObj.confirmed),
      cancelled: num(statusObj.cancelled)
    },
    totalRevenue: str(o.totalRevenue, '0.00'),
    revenueCurrency: str(o.revenueCurrency, 'USD'),
    recentBookingsCount: num(o.recentBookingsCount),
    monthlyRevenue: arr(o.monthlyRevenue).map((m) => {
      const mo = obj(m) ?? {};
      return {
        month: str(mo.month),
        revenue: str(mo.revenue, '0.00'),
        bookingCount: num(mo.bookingCount)
      };
    })
  };
}

export function normalizeRegisterResponse(data: unknown): RegisterResponse {
  const o = obj(data) ?? {};
  const userObj = obj(o.user) ?? {};
  return {
    accessToken: str(o.accessToken),
    user: {
      id: str(userObj.id),
      email: str(userObj.email),
      role: str(userObj.role),
      agencyId: typeof userObj.agencyId === 'string' ? userObj.agencyId : null
    }
  };
}

export function normalizePaginationMeta(data: unknown): PaginationMeta {
  const o = obj(data) ?? {};
  return {
    total: num(o.total),
    limit: num(o.limit, 20),
    offset: num(o.offset)
  };
}

export function normalizePaginatedResult<T>(data: unknown, normalizeItem: (item: unknown) => T): PaginatedResult<T> {
  const o = obj(data) ?? {};
  return {
    items: arr(o.items).map(normalizeItem),
    meta: normalizePaginationMeta(o.meta)
  };
}
