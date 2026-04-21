'use server';

import { getSessionToken } from '@/lib/auth/session';
import { updateUser, deleteUser } from '@/lib/api/api-client';
import { revalidatePath } from 'next/cache';

export async function updateUserAction(id: string, data: { name?: string; phone?: string; agencyId?: string }) {
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  await updateUser(token, id, data);
  revalidatePath('/admin/users');
}

export async function deleteUserAction(id: string) {
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  await deleteUser(token, id);
  revalidatePath('/admin/users');
  revalidatePath('/admin');
}
