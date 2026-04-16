import { redirect } from 'next/navigation';
import { fetchMe } from '../../../lib/api/api-client';
import { clearSessionToken, getSessionToken } from '../../../lib/auth/session';

export default async function DashboardHomePage() {
  const token = getSessionToken();
  if (!token) {
    redirect('/auth/login');
  }

  let me: Awaited<ReturnType<typeof fetchMe>>;
  try {
    me = await fetchMe(token);
  } catch {
    clearSessionToken();
    redirect('/auth/login');
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {me.user.email}</p>
      <p>Role: {me.user.role}</p>
      <p>Agency: {me.user.agencyId ?? 'none'}</p>
      <p>
        <a href="/flights">Flights</a> | <a href="/bookings">Bookings</a> | <a href="/auth/logout">Sign out</a>
      </p>
    </main>
  );
}
