import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_LENGTH = 32;

export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const jar = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  jar.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by client for double-submit
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  const jar = await cookies();
  const cookieValue = jar.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieValue || !token) return false;
  return cookieValue === token;
}
