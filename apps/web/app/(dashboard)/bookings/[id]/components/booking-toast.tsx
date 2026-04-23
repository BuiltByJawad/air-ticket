'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function BookingToast() {
  const searchParams = useSearchParams();
  const toastParam = searchParams.get('toast');

  useEffect(() => {
    if (!toastParam) return;

    if (toastParam === 'confirmed') {
      toast.success('Booking confirmed');
    } else if (toastParam === 'cancelled') {
      toast.success('Booking cancelled');
    } else if (toastParam === 'error') {
      const message = searchParams.get('message') ?? 'Action failed';
      toast.error(decodeURIComponent(message));
    }

    // Clean the URL without triggering a re-render
    const url = new URL(window.location.href);
    url.searchParams.delete('toast');
    url.searchParams.delete('message');
    window.history.replaceState({}, '', url.toString());
  }, [toastParam, searchParams]);

  return null;
}
