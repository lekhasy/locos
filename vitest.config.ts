import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname,
      '@core': new URL('./core/', import.meta.url).pathname,
      '@ports': new URL('./ports/', import.meta.url).pathname,
      '@adapters': new URL('./adapters/', import.meta.url).pathname,
    },
  },
});
