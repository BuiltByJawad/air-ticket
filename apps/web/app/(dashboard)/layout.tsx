import { redirect } from 'next/navigation';
import { fetchMe } from '@/lib/api/api-client';
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
  } catch {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <SidebarNav userEmail={me.user.email} userRole={me.user.role} />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto max-w-6xl p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
