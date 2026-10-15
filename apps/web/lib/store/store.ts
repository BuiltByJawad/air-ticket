'use client';

import { configureStore } from '@reduxjs/toolkit';
import { jobsUiReducer } from './jobs-ui-slice';

export const store = configureStore({
  reducer: {
    jobsUi: jobsUiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
