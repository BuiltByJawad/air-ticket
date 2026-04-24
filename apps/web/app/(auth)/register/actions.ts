'use server';

import { redirect } from 'next/navigation';
import { ApiError, registerWithPassword } from '../../../lib/api/api-client';
import { setSessionToken } from '../../../lib/auth/session';
import { registerSchema } from '../../../lib/validators/schemas';

export async function registerAction(formData: FormData): Promise<void> {
  const parsed = registerSchema.safeParse({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
    name: String(formData.get('name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    agencyName: String(formData.get('agencyName') ?? '').trim(),
    terms: formData.get('terms') ?? ''
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    const code = firstError?.path[0] === 'email' ? 'invalid_email'
      : firstError?.path[0] === 'password' ? 'short_password'
      : firstError?.path[0] === 'confirmPassword' ? 'password_mismatch'
      : firstError?.path[0] === 'agencyName' ? 'missing_agency'
      : firstError?.path[0] === 'terms' ? 'terms_required'
      : 'invalid_input';
    redirect(`/register?error=${code}`);
  }

  const { email, password, name, phone, agencyName } = parsed.data;

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
