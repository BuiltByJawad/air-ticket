import { redirect } from 'next/navigation';
import { ApiError, fetchMe } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { SidebarNav } from '@/components/shared/sidebar-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getSessionToken();
  if (!token) {
    redirect('/login');
  }

  let me: Awaited<ReturnType<typeof fetchMe>>;
  try {
    me = await fetchMe(token);
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/login');
    }
    throw err;
  }

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <SidebarNav user={me.user} />
      <main className="min-w-0 flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
