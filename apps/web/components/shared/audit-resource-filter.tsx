'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const resources = [
  { value: '', label: 'All Resources' },
  { value: 'booking', label: 'Booking' },
  { value: 'agency', label: 'Agency' },
  { value: 'user', label: 'User' }
];

interface AuditResourceFilterProps {
  basePath: string;
  currentResource?: string;
}

export function AuditResourceFilter({ basePath, currentResource }: AuditResourceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(resource: string) {
    const params = new URLSearchParams();
    if (resource) params.set('resource', resource);
    const action = searchParams.get('action');
    if (action) params.set('action', action);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <select
      value={currentResource ?? ''}
      onChange={(e) => handleSelect(e.target.value)}
      className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {resources.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}
