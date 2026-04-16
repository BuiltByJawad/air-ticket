import { redirect } from 'next/navigation';
import { listBookings } from '../../../lib/api/api-client';
import { clearSessionToken, getSessionToken } from '../../../lib/auth/session';

export default async function BookingsPage() {
  const token = getSessionToken();
  if (!token) {
    redirect('/auth/login');
  }

  try {
    const bookings = await listBookings(token);

    return (
      <main>
        <h1>Bookings</h1>
        <p>
          <a href="/dashboard">Dashboard</a> | <a href="/flights">Flights</a>
        </p>

        {bookings.length === 0 ? <p>No bookings yet.</p> : null}

        {bookings.map((b) => (
          <div key={b.id}>
            <p>
              {b.status} - {b.totalPrice.currency} {b.totalPrice.amount}
            </p>
            <p>Offer: {b.offerId}</p>
            <p>Created: {new Date(b.createdAt).toISOString()}</p>
          </div>
        ))}
      </main>
    );
  } catch {
    clearSessionToken();
    redirect('/auth/login');
  }
}
