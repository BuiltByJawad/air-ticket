'use server';

import { getSessionToken } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { createAgency, updateAgency, deleteAgency } from '@/lib/api/api-client';
import { createAgencySchema, updateAgencySchema } from '@/lib/validators/schemas';
import { revalidatePath } from 'next/cache';

export async function createAgencyAction(data: { name: string }, csrfToken: string) {
  const csrfOk = await validateCsrfToken(csrfToken);
  if (!csrfOk) throw new Error('Invalid CSRF token');
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  const parsed = createAgencySchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  await createAgency(token, parsed.data);
  revalidatePath('/admin/agencies');
  revalidatePath('/admin');
}

export async function updateAgencyAction(id: string, data: { name?: string }, csrfToken: string) {
  const csrfOk = await validateCsrfToken(csrfToken);
  if (!csrfOk) throw new Error('Invalid CSRF token');
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  const parsed = updateAgencySchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  await updateAgency(token, id, parsed.data);
  revalidatePath('/admin/agencies');
}

export async function deleteAgencyAction(id: string, csrfToken: string) {
  const csrfOk = await validateCsrfToken(csrfToken);
  if (!csrfOk) throw new Error('Invalid CSRF token');
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  await deleteAgency(token, id);
  revalidatePath('/admin/agencies');
  revalidatePath('/admin');
}
