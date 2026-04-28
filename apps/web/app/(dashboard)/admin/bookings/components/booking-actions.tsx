'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { confirmBookingAction, cancelBookingAction } from '../actions';
import { fetchCsrfToken } from '@/components/shared/csrf-token-input';

export function BookingActions({ id, status }: { id: string; status: 'draft' | 'confirmed' | 'cancelled' }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const csrfToken = await fetchCsrfToken();
      await confirmBookingAction(id, csrfToken);
      setConfirmOpen(false);
      toast.success('Booking confirmed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm booking');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const csrfToken = await fetchCsrfToken();
      await cancelBookingAction(id, csrfToken);
      setCancelOpen(false);
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {status === 'draft' && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" aria-label="Confirm booking">
              <CheckCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to confirm this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {status !== 'cancelled' && (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Cancel booking">
              <XCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={loading}>
                Keep
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={loading}>
                {loading ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
