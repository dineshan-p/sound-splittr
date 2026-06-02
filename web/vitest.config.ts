/**
 * Vitest configuration for Angular unit tests.
 *
 * Angular 21 uses @angular/build's unit-test builder which wraps Vitest.
 * This config sets up the test environment, mocks, and coverage thresholds.
 */
import { defineConfig } from 'vitest/config';
import angularPlugin from '@angular/build/vite';

export default defineConfig({
  plugins: [angularPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/main.ts',
        'src/app/app.routes.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
