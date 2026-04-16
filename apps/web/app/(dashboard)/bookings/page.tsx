import { BookOpen, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listBookings } from '@/lib/api/api-client';
import { clearSessionToken, getSessionToken } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function BookingsPage() {
  const token = await getSessionToken();
  if (!token) {
    redirect('/auth/login');
  }

  let bookings: Awaited<ReturnType<typeof listBookings>> = [];
  try {
    bookings = await listBookings(token);
  } catch {
    await clearSessionToken();
    redirect('/auth/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">Manage your customer bookings.</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Search flights to create your first booking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{b.offerId}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(b.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {b.totalPrice.currency} {b.totalPrice.amount}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'draft' ? 'warning' : status === 'confirmed' ? 'success' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}
