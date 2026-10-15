'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApiError, cancelBooking, confirmBooking, refundBooking } from '../../../../lib/api/api-client';
import { getSessionToken } from '../../../../lib/auth/session';
import { validateCsrfToken } from '../../../../lib/auth/csrf';
import { bookingIdSchema } from '../../../../lib/validators/schemas';
import { loadWebEnv } from '../../../../lib/config/env';

export async function generateTicketAction(id: string): Promise<{ base64: string; filename: string } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const env = loadWebEnv();
  const url = `${env.API_BASE_URL}/bookings/${encodeURIComponent(id)}/ticket`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return null;

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const filename = `ticket-${id}.pdf`;
  return { base64, filename };
}

export async function confirmBookingAction(formData: FormData): Promise<void> {
  const csrfOk = await validateCsrfToken(String(formData.get('_csrf') ?? ''));
  if (!csrfOk) { redirect('/bookings'); return; }
  const token = await getSessionToken();
  if (!token) { redirect('/login'); return; }

  const id = String(formData.get('bookingId') ?? '');
  const parsed = bookingIdSchema.safeParse(id);
  if (!parsed.success) { redirect('/bookings'); return; }

  try {
    await confirmBooking(token, parsed.data);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
      redirect('/login');
    }
    redirect(`/bookings/${parsed.data}?toast=error&message=${encodeURIComponent(err instanceof Error ? err.message : 'Failed to confirm booking')}`);
  }

  redirect(`/bookings/${parsed.data}?toast=confirmed`);
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const csrfOk = await validateCsrfToken(String(formData.get('_csrf') ?? ''));
  if (!csrfOk) { redirect('/bookings'); return; }
  const token = await getSessionToken();
  if (!token) { redirect('/login'); return; }

  const id = String(formData.get('bookingId') ?? '');
  const parsed = bookingIdSchema.safeParse(id);
  if (!parsed.success) { redirect('/bookings'); return; }

  try {
    await cancelBooking(token, parsed.data);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
      redirect('/login');
    }
    redirect(`/bookings/${parsed.data}?toast=error&message=${encodeURIComponent(err instanceof Error ? err.message : 'Failed to cancel booking')}`);
  }

  redirect(`/bookings/${parsed.data}?toast=cancelled`);
}
