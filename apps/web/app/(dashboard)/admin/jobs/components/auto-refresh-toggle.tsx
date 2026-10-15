'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/lib/store/store';
import { setRefreshMode, type RefreshMode } from '@/lib/store/jobs-ui-slice';

export function AutoRefreshToggle() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((state: RootState) => state.jobsUi.refreshMode);

  useEffect(() => {
    if (mode === 'off') return;
    const intervalMs = mode === '5s' ? 5000 : 10000;
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [mode, router]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Auto-refresh</span>
      <Button size="sm" variant={mode === 'off' ? 'default' : 'outline'} onClick={() => dispatch(setRefreshMode('off'))}>
        Off
      </Button>
      <Button size="sm" variant={mode === '5s' ? 'default' : 'outline'} onClick={() => dispatch(setRefreshMode('5s'))}>
        5s
      </Button>
      <Button size="sm" variant={mode === '10s' ? 'default' : 'outline'} onClick={() => dispatch(setRefreshMode('10s'))}>
        10s
      </Button>
    </div>
  );
}
