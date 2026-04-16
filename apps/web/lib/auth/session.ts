import { cookies } from 'next/headers';
import { loadWebEnv } from '../config/env';

export async function setSessionToken(token: string): Promise<void> {
  const env = loadWebEnv();
  const isProd = env.NODE_ENV === 'production';

  const jar = await cookies();
  jar.set(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionToken(): Promise<void> {
  const env = loadWebEnv();
  const jar = await cookies();
  jar.delete(env.SESSION_COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const env = loadWebEnv();
  const jar = await cookies();
  const token = jar.get(env.SESSION_COOKIE_NAME)?.value;
  return token ?? null;
}
