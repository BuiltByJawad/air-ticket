'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, updateProfile } from '../../../lib/api/api-client';
import { getSessionToken } from '../../../lib/auth/session';
import { validateCsrfToken } from '../../../lib/auth/csrf';
import { profileUpdateSchema } from '../../../lib/validators/schemas';

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfileAction(formData: FormData): Promise<ProfileActionResult> {
  const csrfOk = await validateCsrfToken(String(formData.get('_csrf') ?? ''));
  if (!csrfOk) {
    return { success: false, error: 'Invalid CSRF token' };
  }
  const token = await getSessionToken();
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  const raw = {
    name: String(formData.get('name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    currentPassword: String(formData.get('currentPassword') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? '')
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const input: { name?: string; phone?: string; currentPassword?: string; password?: string } = {};
  if (parsed.data.name) input.name = parsed.data.name;
  if (parsed.data.phone) input.phone = parsed.data.phone;
  if (parsed.data.password) {
    input.currentPassword = parsed.data.currentPassword;
    input.password = parsed.data.password;
  }

  if (Object.keys(input).length === 0) {
    return { success: false, error: 'No changes to save' };
  }

  try {
    await updateProfile(token, input);
    revalidatePath('/profile');
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update profile' };
  }
}
