import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  createAgencySchema,
  updateAgencySchema,
  createAgentSchema,
  updateUserSchema,
  bookingIdSchema,
  profileUpdateSchema,
  exportBookingsSchema
} from './schemas';

describe('loginSchema', () => {
  it('validates valid input', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'pass' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: 'pass' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    email: 'a@b.com',
    password: '12345678',
    confirmPassword: '12345678',
    agencyName: 'My Agency',
    terms: 'on' as const
  };

  it('validates valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short password', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' }).success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    expect(registerSchema.safeParse({ ...valid, confirmPassword: 'different' }).success).toBe(false);
  });

  it('rejects empty agency name', () => {
    expect(registerSchema.safeParse({ ...valid, agencyName: '' }).success).toBe(false);
  });

  it('rejects missing terms', () => {
    expect(registerSchema.safeParse({ ...valid, terms: '' }).success).toBe(false);
  });
});

describe('createAgencySchema', () => {
  it('validates valid name', () => {
    expect(createAgencySchema.safeParse({ name: 'Agency' }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(createAgencySchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('updateAgencySchema', () => {
  it('allows optional name', () => {
    expect(updateAgencySchema.safeParse({}).success).toBe(true);
    expect(updateAgencySchema.safeParse({ name: 'New' }).success).toBe(true);
  });
});

describe('createAgentSchema', () => {
  it('validates valid input', () => {
    expect(createAgentSchema.safeParse({ agencyId: '1', email: 'a@b.com', password: '12345678' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(createAgentSchema.safeParse({ agencyId: '1', email: 'bad', password: '12345678' }).success).toBe(false);
  });

  it('rejects short password', () => {
    expect(createAgentSchema.safeParse({ agencyId: '1', email: 'a@b.com', password: 'short' }).success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('allows partial update', () => {
    expect(updateUserSchema.safeParse({ role: 'admin' }).success).toBe(true);
  });

  it('rejects invalid role', () => {
    expect(updateUserSchema.safeParse({ role: 'super' }).success).toBe(false);
  });
});

describe('bookingIdSchema', () => {
  it('accepts non-empty string', () => {
    expect(bookingIdSchema.safeParse('abc123').success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(bookingIdSchema.safeParse('').success).toBe(false);
  });
});

describe('profileUpdateSchema', () => {
  it('requires currentPassword when setting new password', () => {
    const result = profileUpdateSchema.safeParse({ password: '12345678', confirmPassword: '12345678' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = profileUpdateSchema.safeParse({
      currentPassword: 'old',
      password: '12345678',
      confirmPassword: 'different'
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid password change', () => {
    const result = profileUpdateSchema.safeParse({
      currentPassword: 'oldpass',
      password: '12345678',
      confirmPassword: '12345678'
    });
    expect(result.success).toBe(true);
  });
});

describe('exportBookingsSchema', () => {
  it('accepts valid status', () => {
    expect(exportBookingsSchema.safeParse({ status: 'confirmed' }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(exportBookingsSchema.safeParse({ status: 'pending' }).success).toBe(false);
  });

  it('accepts empty input', () => {
    expect(exportBookingsSchema.safeParse({}).success).toBe(true);
  });
});
