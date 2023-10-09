/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: './playground',
  resolve: {
    alias: {
      'ym-userequest': path.resolve(__dirname, './lib/index.ts'),
    },
  },
  plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ['__test__/*'],
  },
});
