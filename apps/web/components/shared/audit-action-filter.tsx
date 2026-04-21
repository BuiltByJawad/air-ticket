'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const actions = [
  { value: '', label: 'All Actions' },
  { value: 'booking.create', label: 'Booking Create' },
  { value: 'booking.confirm', label: 'Booking Confirm' },
  { value: 'booking.cancel', label: 'Booking Cancel' },
  { value: 'admin.create_agency', label: 'Agency Create' },
  { value: 'admin.update_agency', label: 'Agency Update' },
  { value: 'admin.delete_agency', label: 'Agency Delete' },
  { value: 'admin.create_agent', label: 'Agent Create' },
  { value: 'admin.update_user', label: 'User Update' },
  { value: 'admin.delete_user', label: 'User Delete' }
];

interface AuditActionFilterProps {
  basePath: string;
  currentAction?: string;
}

export function AuditActionFilter({ basePath, currentAction }: AuditActionFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(action: string) {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    const resource = searchParams.get('resource');
    if (resource) params.set('resource', resource);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <select
      value={currentAction ?? ''}
      onChange={(e) => handleSelect(e.target.value)}
      className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {actions.map((a) => (
        <option key={a.value} value={a.value}>{a.label}</option>
      ))}
    </select>
  );
}
