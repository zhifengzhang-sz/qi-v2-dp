import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      './lib/tests/**/*.test.ts',
      './app/tests/**/*.test.ts',
      './tests/**/*.test.ts'
    ],
    exclude: [
      './node_modules/**',
      './dist/**'
    ],
    isolate: true,
    pool: 'forks'
  }
});