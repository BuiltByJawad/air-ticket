'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const statuses = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' }
];

interface BookingStatusFilterProps {
  basePath: string;
  currentStatus?: string;
}

export function BookingStatusFilter({ basePath, currentStatus }: BookingStatusFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleStatusClick(status: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const search = searchParams.get('search');
    if (search) params.set('search', search);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex items-center gap-1">
      {statuses.map((s) => (
        <Button
          key={s.value}
          variant={currentStatus === s.value || (!currentStatus && s.value === '') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusClick(s.value)}
          className="text-xs"
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
