'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function CleanErrorParam() {
  const params = useSearchParams();

  useEffect(() => {
    const current = new URLSearchParams(params.toString());
    if (!current.has('error')) return;

    current.delete('error');

    const query = current.toString();
    const nextUrl = query ? `/login?${query}` : '/login';
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [params]);

  return null;
}
