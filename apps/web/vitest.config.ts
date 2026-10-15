import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
