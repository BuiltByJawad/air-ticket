'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store/store';
import { StorePersistor } from './store-persistor';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <StorePersistor />
      {children}
    </Provider>
  );
}
