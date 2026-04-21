'use server';

import { getSessionToken } from '@/lib/auth/session';
import { confirmBooking, cancelBooking } from '@/lib/api/api-client';
import { revalidatePath } from 'next/cache';

export async function confirmBookingAction(id: string) {
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  await confirmBooking(token, id);
  revalidatePath('/admin/bookings');
  revalidatePath(`/bookings/${id}`);
}

export async function cancelBookingAction(id: string) {
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  await cancelBooking(token, id);
  revalidatePath('/admin/bookings');
  revalidatePath(`/bookings/${id}`);
}
