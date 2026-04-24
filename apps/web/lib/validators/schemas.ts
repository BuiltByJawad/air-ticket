import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  agencyName: z.string().trim().min(1, 'Agency name is required'),
  terms: z.literal('on', { message: 'You must accept the terms' })
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const createAgencySchema = z.object({
  name: z.string().trim().min(1, 'Agency name is required').max(200)
});

export const updateAgencySchema = z.object({
  name: z.string().trim().min(1, 'Agency name is required').max(200).optional()
});

export const createAgentSchema = z.object({
  agencyId: z.string().min(1, 'Agency is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const updateUserSchema = z.object({
  name: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  agencyId: z.string().optional(),
  role: z.enum(['agent', 'admin']).optional()
});

export const bookingIdSchema = z.string().min(1, 'Booking ID is required');

export const profileUpdateSchema = z.object({
  name: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  currentPassword: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  password: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(8, 'Password must be at least 8 characters').optional()),
  confirmPassword: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())
}).refine((d) => {
  if (d.password && !d.currentPassword) return false;
  return true;
}, {
  message: 'Current password is required to set a new password',
  path: ['currentPassword']
}).refine((d) => {
  if (d.password && d.password !== d.confirmPassword) return false;
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const exportBookingsSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
  search: z.string().trim().max(200).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional()
});
