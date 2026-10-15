'use client';

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type RefreshMode = 'off' | '5s' | '10s';

interface JobsUiState {
  refreshMode: RefreshMode;
}

const initialState: JobsUiState = {
  refreshMode: 'off'
};

const jobsUiSlice = createSlice({
  name: 'jobsUi',
  initialState,
  reducers: {
    setRefreshMode(state, action: PayloadAction<RefreshMode>) {
      state.refreshMode = action.payload;
    }
  }
});

export const { setRefreshMode } = jobsUiSlice.actions;
export const jobsUiReducer = jobsUiSlice.reducer;
