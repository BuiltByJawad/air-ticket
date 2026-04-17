'use server';

import { redirect } from 'next/navigation';
import { ApiError, loginWithPassword } from '../../../lib/api/api-client';
import { setSessionToken } from '../../../lib/auth/session';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!isValidEmail(email) || password.length < 1) {
    redirect('/login?error=invalid_input');
  }

  try {
    const token = await loginWithPassword({ email, password });
    await setSessionToken(token.accessToken);
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        redirect('/login?error=invalid_credentials');
      }
      if (err.status === 0) {
        redirect('/login?error=api_unreachable');
      }
      redirect('/login?error=api_error');
    }

    if (err instanceof Error && err.message.includes('API_BASE_URL')) {
      redirect('/login?error=api_config');
    }

    redirect('/login?error=unknown');
  }

  redirect('/dashboard');
}
