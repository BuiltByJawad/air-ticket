'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface BookingDateFilterProps {
  basePath: string;
  fromDate?: string;
  toDate?: string;
}

export function BookingDateFilter({ basePath, fromDate, toDate }: BookingDateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const from = formData.get('fromDate') as string;
      const to = formData.get('toDate') as string;

      const params = new URLSearchParams();
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (from) params.set('fromDate', from);
      if (to) params.set('toDate', to);

      router.push(`${basePath}?${params.toString()}`);
    },
    [basePath, searchParams, router]
  );

  function handleClear() {
    const params = new URLSearchParams();
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="from-date" className="text-xs">From</Label>
        <Input
          id="from-date"
          name="fromDate"
          type="date"
          defaultValue={fromDate ?? ''}
          className="h-9 w-32 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to-date" className="text-xs">To</Label>
        <Input
          id="to-date"
          name="toDate"
          type="date"
          defaultValue={toDate ?? ''}
          className="h-9 w-32 text-sm"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" className="h-9 gap-1">
        <Calendar className="h-3 w-3" />
        Filter
      </Button>
      {(fromDate || toDate) && (
        <Button type="button" size="sm" variant="ghost" className="h-9" onClick={handleClear}>
          Clear
        </Button>
      )}
    </form>
  );
}
