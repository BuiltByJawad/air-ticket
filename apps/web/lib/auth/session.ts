import { cookies } from 'next/headers';
import { loadWebEnv } from '../config/env';

export function setSessionToken(token: string): void {
  const env = loadWebEnv();
  const isProd = env.NODE_ENV === 'production';

  cookies().set(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionToken(): void {
  const env = loadWebEnv();
  cookies().delete(env.SESSION_COOKIE_NAME);
}

export function getSessionToken(): string | null {
  const env = loadWebEnv();
  const token = cookies().get(env.SESSION_COOKIE_NAME)?.value;
  return token ?? null;
}
