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
  name: z.string().trim().min(1, 'Agency name is required').max(200),
  markupPercentage: z.number().min(0).max(100).optional()
});

export const updateAgencySchema = z.object({
  name: z.string().trim().min(1, 'Agency name is required').max(200).optional(),
  markupPercentage: z.number().min(0).max(100).optional()
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

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const exportBookingsSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
  search: z.string().trim().max(200).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional()
});

export const passengerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  gender: z.enum(['M', 'F', 'O']),
  passportNumber: z.string().min(5, 'Passport number is required'),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  passportIssuingCountry: z.string().length(2, 'Must be a 2-letter ISO country code'),
});

export type Passenger = z.infer<typeof passengerSchema>;

export const createBookingSchema = z.object({
  offerId: z.string().min(1, 'Offer ID is required'),
  offerData: z.record(z.unknown()),
  currency: z.string().length(3),
  amount: z.string(),
  passengers: z.array(passengerSchema).min(1, 'At least one passenger is required'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
