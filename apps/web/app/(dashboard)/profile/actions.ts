'use server';

import { revalidatePath } from 'next/cache';
import { ApiError, updateProfile } from '../../../lib/api/api-client';
import { getSessionToken } from '../../../lib/auth/session';

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfileAction(formData: FormData): Promise<ProfileActionResult> {
  const token = await getSessionToken();
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  const input: { name?: string; phone?: string; currentPassword?: string; password?: string } = {};
  if (name) input.name = name;
  if (phone) input.phone = phone;
  if (password) {
    if (!currentPassword) {
      return { success: false, error: 'Current password is required to set a new password' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }
    input.currentPassword = currentPassword;
    input.password = password;
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
