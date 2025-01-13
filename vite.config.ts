/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['__test__/*'],
    coverage: {
      provider: 'v8',
      include: ['lib'],
      exclude: ['lib/utils'],
    },
  },
});
