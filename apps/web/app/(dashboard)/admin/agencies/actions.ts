'use server';

import { getSessionToken } from '@/lib/auth/session';
import { updateAgency, deleteAgency } from '@/lib/api/api-client';
import { revalidatePath } from 'next/cache';

export async function updateAgencyAction(id: string, data: { name?: string }) {
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  await updateAgency(token, id, data);
  revalidatePath('/admin/agencies');
}

export async function deleteAgencyAction(id: string) {
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  await deleteAgency(token, id);
  revalidatePath('/admin/agencies');
  revalidatePath('/admin');
}
