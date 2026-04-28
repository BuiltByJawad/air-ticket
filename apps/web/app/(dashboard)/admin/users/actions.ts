'use server';

import { getSessionToken } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/auth/csrf';
import { createAgent, updateUser, deleteUser } from '@/lib/api/api-client';
import { createAgentSchema, updateUserSchema } from '@/lib/validators/schemas';
import { revalidatePath } from 'next/cache';

export async function createAgentAction(data: { agencyId: string; email: string; password: string }, csrfToken: string) {
  const csrfOk = await validateCsrfToken(csrfToken);
  if (!csrfOk) throw new Error('Invalid CSRF token');
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  const parsed = createAgentSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  await createAgent(token, parsed.data);
  revalidatePath('/admin/users');
  revalidatePath('/admin');
}

export async function updateUserAction(id: string, data: { name?: string; phone?: string; agencyId?: string; role?: 'agent' | 'admin' }, csrfToken: string) {
  const csrfOk = await validateCsrfToken(csrfToken);
  if (!csrfOk) throw new Error('Invalid CSRF token');
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');

  await updateUser(token, id, parsed.data);
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  revalidatePath('/admin');
}

export async function deleteUserAction(id: string, csrfToken: string) {
  const csrfOk = await validateCsrfToken(csrfToken);
  if (!csrfOk) throw new Error('Invalid CSRF token');
  const token = await getSessionToken();
  if (!token) throw new Error('Not authenticated');

  await deleteUser(token, id);
  revalidatePath('/admin/users');
  revalidatePath('/admin');
}
