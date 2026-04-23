'use server';

import { getSessionToken } from '@/lib/auth/session';
import { loadWebEnv } from '@/lib/config/env';

export async function exportBookingsCsvAction(input: {
  status?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ csv: string; filename: string } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const env = loadWebEnv();
  const params = new URLSearchParams();
  if (input.status) params.set('status', input.status);
  if (input.fromDate) params.set('fromDate', input.fromDate);
  if (input.toDate) params.set('toDate', input.toDate);

  const qs = params.toString();
  const url = `${env.API_BASE_URL}/bookings/export/csv${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return null;

  const csv = await res.text();
  const filename = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}

export async function exportBookingsPdfAction(input: {
  status?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ base64: string; filename: string } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const env = loadWebEnv();
  const params = new URLSearchParams();
  if (input.status) params.set('status', input.status);
  if (input.fromDate) params.set('fromDate', input.fromDate);
  if (input.toDate) params.set('toDate', input.toDate);

  const qs = params.toString();
  const url = `${env.API_BASE_URL}/bookings/export/pdf${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return null;

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const filename = `bookings-${new Date().toISOString().slice(0, 10)}.pdf`;
  return { base64, filename };
}
