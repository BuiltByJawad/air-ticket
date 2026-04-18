'use server';

import { redirect } from 'next/navigation';
import { ApiError, registerWithPassword } from '../../../lib/api/api-client';
import { setSessionToken } from '../../../lib/auth/session';
import { isValidEmail } from '../../../lib/validators/email';

export async function registerAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const agencyName = String(formData.get('agencyName') ?? '').trim();
  const terms = formData.get('terms');

  if (!isValidEmail(email)) {
    redirect('/register?error=invalid_email');
  }

  if (password.length < 8) {
    redirect('/register?error=short_password');
  }

  if (password !== confirmPassword) {
    redirect('/register?error=password_mismatch');
  }

  if (!agencyName) {
    redirect('/register?error=missing_agency');
  }

  if (!terms) {
    redirect('/register?error=terms_required');
  }

  try {
    const result = await registerWithPassword({
      email,
      password,
      name: name || undefined,
      phone: phone || undefined,
      agencyName
    });
    await setSessionToken(result.accessToken);
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 409 || err.status === 400) {
        redirect('/register?error=email_taken');
      }
      if (err.status === 0) {
        redirect('/register?error=api_unreachable');
      }
      redirect('/register?error=api_error');
    }

    if (err instanceof Error && err.message.includes('API_BASE_URL')) {
      redirect('/register?error=api_config');
    }

    redirect('/register?error=unknown');
  }

  redirect('/dashboard');
}
