'use server';

import { revalidatePath } from 'next/cache';
import { getSessionToken } from '@/lib/auth/session';
import { cloneAdminJob, retryAdminJob, triggerAdminJob } from '@/lib/api/api-client';

export async function retryJobAction(jobId: string): Promise<void> {
  const token = await getSessionToken();
  if (!token) {
    throw new Error('Unauthorized');
  }
  await retryAdminJob(token, jobId);
  revalidatePath('/admin/jobs');
}

export async function triggerJobAction(jobId: string): Promise<void> {
  const token = await getSessionToken();
  if (!token) {
    throw new Error('Unauthorized');
  }
  await triggerAdminJob(token, jobId);
  revalidatePath('/admin/jobs');
}

export async function cloneJobAction(jobId: string): Promise<void> {
  const token = await getSessionToken();
  if (!token) {
    throw new Error('Unauthorized');
  }
  await cloneAdminJob(token, jobId);
  revalidatePath('/admin/jobs');
}
