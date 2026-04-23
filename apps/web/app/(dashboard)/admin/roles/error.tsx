'use client';

import { Button } from '@/components/ui/button';

export default function RolesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <p className="text-sm text-destructive">{error.message || 'Failed to load roles'}</p>
      <Button variant="outline" onClick={reset}>Try Again</Button>
    </div>
  );
}
