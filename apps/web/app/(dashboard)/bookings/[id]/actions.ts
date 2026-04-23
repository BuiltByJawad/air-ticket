'use server';

import { redirect } from 'next/navigation';
import { ApiError, cancelBooking, confirmBooking } from '../../../../lib/api/api-client';
import { getSessionToken } from '../../../../lib/auth/session';

export async function confirmBookingAction(formData: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) { redirect('/login'); return; }

  const id = String(formData.get('bookingId') ?? '');
  if (!id) { redirect('/bookings'); return; }

  try {
    await confirmBooking(token, id);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
      redirect('/login');
    }
    redirect(`/bookings/${id}?toast=error&message=${encodeURIComponent(err instanceof Error ? err.message : 'Failed to confirm booking')}`);
  }

  redirect(`/bookings/${id}?toast=confirmed`);
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) { redirect('/login'); return; }

  const id = String(formData.get('bookingId') ?? '');
  if (!id) { redirect('/bookings'); return; }

  try {
    await cancelBooking(token, id);
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
      redirect('/login');
    }
    redirect(`/bookings/${id}?toast=error&message=${encodeURIComponent(err instanceof Error ? err.message : 'Failed to cancel booking')}`);
  }

  redirect(`/bookings/${id}?toast=cancelled`);
}
