'use server';

import { redirect } from 'next/navigation';
import { clearSessionToken } from '../../../../lib/auth/session';

export async function logoutAction(): Promise<void> {
  await clearSessionToken();
  redirect('/auth/login');
}
