'use server';

import { redirect } from 'next/navigation';
import { ApiError, loginWithPassword } from '../../../lib/api/api-client';
import { setSessionToken } from '../../../lib/auth/session';
import { loginSchema } from '../../../lib/validators/schemas';

export async function loginAction(formData: FormData): Promise<void> {
  const result = loginSchema.safeParse({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? '')
  });

  if (!result.success) {
    redirect('/login?error=invalid_input');
  }

  const { email, password } = result.data;

  try {
    const token = await loginWithPassword({ email, password });
    await setSessionToken(token.accessToken);
    redirect(token.user.role === 'admin' ? '/admin' : '/dashboard');
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
