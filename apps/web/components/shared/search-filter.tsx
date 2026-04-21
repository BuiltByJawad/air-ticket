'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFilterProps {
  basePath: string;
  param: string;
  placeholder?: string;
}

export function SearchFilter({ basePath, param, placeholder = 'Search...' }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const value = formData.get(param) as string;
      const params = new URLSearchParams();
      if (value) params.set(param, value);
      router.push(`${basePath}?${params.toString()}`);
    },
    [basePath, param, router]
  );

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          name={param}
          defaultValue={searchParams.get(param) ?? ''}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </form>
  );
}
