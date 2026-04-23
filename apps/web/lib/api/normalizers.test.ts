import { describe, it, expect } from 'vitest';
import {
  normalizeBooking,
  normalizeAuthTokenResponse,
  normalizeMeResponse,
  normalizeAdminStats,
  normalizeAgentStats,
  normalizeAdminUser,
  normalizeAdminAgency,
  normalizePaginatedResult
} from './normalizers';

describe('normalizeBooking', () => {
  it('normalizes a complete booking', () => {
    const data = {
      id: 'b1',
      status: 'confirmed',
      offerId: 'off1',
      offerData: { key: 'val' },
      totalPrice: { currency: 'USD', amount: '100.00' },
      agencyId: 'a1',
      agencyName: 'Test Agency',
      createdByUserId: 'u1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02'
    };
    const result = normalizeBooking(data);
    expect(result.id).toBe('b1');
    expect(result.status).toBe('confirmed');
    expect(result.totalPrice.currency).toBe('USD');
  });

  it('provides safe defaults for missing fields', () => {
    const result = normalizeBooking({});
    expect(result.id).toBe('');
    expect(result.status).toBe('draft');
    expect(result.totalPrice.currency).toBe('USD');
    expect(result.totalPrice.amount).toBe('0.00');
    expect(result.offerData).toEqual({});
  });

  it('handles null input', () => {
    const result = normalizeBooking(null);
    expect(result.id).toBe('');
    expect(result.status).toBe('draft');
  });
});

describe('normalizeAuthTokenResponse', () => {
  it('normalizes a complete token response', () => {
    const data = {
      accessToken: 'token123',
      user: { id: 'u1', email: 'test@test.com', role: 'admin', agencyId: null }
    };
    const result = normalizeAuthTokenResponse(data);
    expect(result.accessToken).toBe('token123');
    expect(result.user.role).toBe('admin');
  });

  it('handles missing user object', () => {
    const result = normalizeAuthTokenResponse({ accessToken: 'tok' });
    expect(result.user.id).toBe('');
    expect(result.user.agencyId).toBeNull();
  });
});

describe('normalizeMeResponse', () => {
  it('normalizes admin user', () => {
    const data = {
      user: { sub: 's1', email: 'admin@test.com', role: 'admin', agencyId: null, name: null, phone: null, agency: null }
    };
    const result = normalizeMeResponse(data);
    expect(result.user.role).toBe('admin');
    expect(result.user.agency).toBeNull();
  });

  it('normalizes agent user with agency', () => {
    const data = {
      user: { sub: 's2', email: 'agent@test.com', role: 'agent', agencyId: 'a1', name: 'John', phone: '+123', agency: { id: 'a1', name: 'Acme' } }
    };
    const result = normalizeMeResponse(data);
    expect(result.user.role).toBe('agent');
    expect(result.user.agency?.name).toBe('Acme');
  });

  it('falls back to agent for invalid role', () => {
    const data = { user: { sub: 's3', email: 'x@x.com', role: 'invalid' } };
    const result = normalizeMeResponse(data);
    expect(result.user.role).toBe('agent');
  });
});

describe('normalizeAdminStats', () => {
  it('normalizes complete stats', () => {
    const data = {
      totalAgencies: 5,
      totalUsers: 10,
      totalAgents: 8,
      totalBookings: 100,
      bookingsByStatus: { draft: 20, confirmed: 70, cancelled: 10 },
      totalRevenue: '5000.00',
      revenueCurrency: 'USD',
      topAgencies: [{ agencyId: 'a1', agencyName: 'Acme', revenue: '1000', bookingCount: 50 }],
      recentBookingsCount: 30,
      monthlyRevenue: [{ month: '2024-01', revenue: '500', bookingCount: 10 }]
    };
    const result = normalizeAdminStats(data);
    expect(result.totalAgencies).toBe(5);
    expect(result.bookingsByStatus.confirmed).toBe(70);
    expect(result.topAgencies[0]!.agencyName).toBe('Acme');
    expect(result.monthlyRevenue[0]!.month).toBe('2024-01');
  });

  it('provides safe defaults for empty input', () => {
    const result = normalizeAdminStats(null);
    expect(result.totalAgencies).toBe(0);
    expect(result.revenueCurrency).toBe('USD');
    expect(result.topAgencies).toEqual([]);
  });
});

describe('normalizeAgentStats', () => {
  it('provides safe defaults for empty input', () => {
    const result = normalizeAgentStats({});
    expect(result.totalBookings).toBe(0);
    expect(result.totalRevenue).toBe('0.00');
    expect(result.monthlyRevenue).toEqual([]);
  });
});

describe('normalizeAdminUser', () => {
  it('normalizes a complete user', () => {
    const data = { id: 'u1', email: 'test@test.com', name: 'John', phone: '+123', role: 'agent', agencyId: 'a1', createdAt: '2024-01-01' };
    const result = normalizeAdminUser(data);
    expect(result.role).toBe('agent');
    expect(result.name).toBe('John');
  });

  it('falls back to agent for invalid role', () => {
    const result = normalizeAdminUser({ id: 'u1', email: 'x@x.com', role: 'superuser', createdAt: '2024-01-01' });
    expect(result.role).toBe('agent');
  });
});

describe('normalizeAdminAgency', () => {
  it('normalizes a complete agency', () => {
    const data = { id: 'a1', name: 'Acme Travel', createdAt: '2024-01-01' };
    const result = normalizeAdminAgency(data);
    expect(result.name).toBe('Acme Travel');
  });

  it('provides safe defaults', () => {
    const result = normalizeAdminAgency(null);
    expect(result.id).toBe('');
    expect(result.name).toBe('');
  });
});

describe('normalizePaginatedResult', () => {
  it('normalizes with item normalizer', () => {
    const data = {
      items: [{ id: 'b1', status: 'draft', offerId: 'o1', totalPrice: { currency: 'USD', amount: '50' }, createdByUserId: 'u1', createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
      meta: { total: 1, limit: 20, offset: 0 }
    };
    const result = normalizePaginatedResult(data, normalizeBooking);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe('b1');
    expect(result.meta.total).toBe(1);
  });

  it('handles null input', () => {
    const result = normalizePaginatedResult(null, normalizeBooking);
    expect(result.items).toEqual([]);
    expect(result.meta.limit).toBe(20);
  });
});
