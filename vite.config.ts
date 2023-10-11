/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['__test__/*'],
    coverage: {
      provider: 'v8',
      include: ['lib'],
    },
  },
});
