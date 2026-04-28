'use server';

import { getSessionToken } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { confirmBooking, cancelBooking } from '@/lib/api/api-client';
import { bookingIdSchema, exportBookingsSchema } from '@/lib/validators/schemas';
import { revalidatePath } from 'next/cache';
import { loadWebEnv } from '@/lib/config/env';

export async function confirmBookingAction(id: string, csrfToken: string) {
  const csrfOk = await validateCsrfToken(csrfToken);
  if (!csrfOk) throw new Error('Invalid CSRF token');
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  const parsed = bookingIdSchema.safeParse(id);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid booking ID');

  await confirmBooking(token, parsed.data);
  revalidatePath('/admin/bookings');
  revalidatePath(`/bookings/${parsed.data}`);
}

export async function cancelBookingAction(id: string, csrfToken: string) {
  const csrfOk = await validateCsrfToken(csrfToken);
  if (!csrfOk) throw new Error('Invalid CSRF token');
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  const parsed = bookingIdSchema.safeParse(id);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid booking ID');

  await cancelBooking(token, parsed.data);
  revalidatePath('/admin/bookings');
  revalidatePath(`/bookings/${parsed.data}`);
}

export async function exportBookingsCsvAction(input: {
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ csv: string; filename: string } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const parsed = exportBookingsSchema.safeParse(input);
  if (!parsed.success) return null;

  const env = loadWebEnv();
  const params = new URLSearchParams();
  if (parsed.data.status) params.set('status', parsed.data.status);
  if (parsed.data.search) params.set('search', parsed.data.search);
  if (parsed.data.fromDate) params.set('fromDate', parsed.data.fromDate);
  if (parsed.data.toDate) params.set('toDate', parsed.data.toDate);

  const qs = params.toString();
  const url = `${env.API_BASE_URL}/bookings/export/csv${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!res.ok) return null;

  const csv = await res.text();
  const filename = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}

export async function exportBookingsPdfAction(input: {
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ base64: string; filename: string } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const parsed = exportBookingsSchema.safeParse(input);
  if (!parsed.success) return null;

  const env = loadWebEnv();
  const params = new URLSearchParams();
  if (parsed.data.status) params.set('status', parsed.data.status);
  if (parsed.data.search) params.set('search', parsed.data.search);
  if (parsed.data.fromDate) params.set('fromDate', parsed.data.fromDate);
  if (parsed.data.toDate) params.set('toDate', parsed.data.toDate);

  const qs = params.toString();
  const url = `${env.API_BASE_URL}/bookings/export/pdf${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!res.ok) return null;

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const filename = `bookings-${new Date().toISOString().slice(0, 10)}.pdf`;
  return { base64, filename };
}
