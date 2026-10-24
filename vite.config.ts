import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', '.worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      all: false,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/**/mocks/**',
        'src/components/ui/checkbox/**',
        'src/components/ui/slider/**',
        'src/components/ui/index.ts',
        'src/components/app-shell/**',
      ],
      thresholds: {
        lines: 97,
        functions: 97,
        branches: 93,
        statements: 97,
      },
    },
  },
});
