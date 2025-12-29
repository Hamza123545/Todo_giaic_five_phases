import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '__tests__/**',
        'dist/**',
        'frontend/types/**',
        'frontend/lib/api.ts', // Mocked in tests
        '**/*.d.ts',
        '**/types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': '/D:/Todo_giaic_five_phases/phase-2/frontend',
      '@/frontend': '/D:/Todo_giaic_five_phases/phase-2/frontend',
    },
  },
});