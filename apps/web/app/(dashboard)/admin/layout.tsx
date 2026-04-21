import { redirect } from 'next/navigation';
import { ApiError, fetchMe } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { AdminSubNav } from '@/components/shared/admin-sub-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = await getSessionToken();
  if (!token) redirect('/login');

  let me: Awaited<ReturnType<typeof fetchMe>>;
  try {
    me = await fetchMe(token);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/login');
    }
    throw err;
  }

  if (me.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <AdminSubNav />
      {children}
    </div>
  );
}
