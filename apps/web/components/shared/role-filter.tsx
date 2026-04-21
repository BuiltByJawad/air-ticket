'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const roles = [
  { value: '', label: 'All' },
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' }
];

interface RoleFilterProps {
  basePath: string;
  currentRole?: string;
}

export function RoleFilter({ basePath, currentRole }: RoleFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleRoleClick(role: string) {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    const search = searchParams.get('search');
    if (search) params.set('search', search);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex items-center gap-1">
      {roles.map((r) => (
        <Button
          key={r.value}
          variant={currentRole === r.value || (!currentRole && r.value === '') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRoleClick(r.value)}
          className="text-xs"
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
