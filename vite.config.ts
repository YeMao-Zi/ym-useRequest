/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  test: {
    include: ['__test__/*'],
  },
  root:'./playground',
  resolve: {
    alias: {
      'ym-userequest': path.resolve(__dirname, './lib/index.ts'),
    },
  },
  plugins: [vue()],
});
