'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/lib/store/store';
import { setRefreshMode, type RefreshMode } from '@/lib/store/jobs-ui-slice';

const KEY = 'jobs_refresh_mode';

function isRefreshMode(value: string): value is RefreshMode {
  return value === 'off' || value === '5s' || value === '10s';
}

export function StorePersistor() {
  const dispatch = useDispatch<AppDispatch>();
  const refreshMode = useSelector((state: RootState) => state.jobsUi.refreshMode);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored && isRefreshMode(stored)) {
        dispatch(setRefreshMode(stored));
      }
    } catch {
      // Ignore storage access issues
    }
  }, [dispatch]);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, refreshMode);
    } catch {
      // Ignore storage access issues
    }
  }, [refreshMode]);

  return null;
}
