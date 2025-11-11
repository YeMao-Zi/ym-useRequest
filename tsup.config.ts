import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['lib/index.ts'],
  clean: true,
  dts: true,
  shims: true,
  external: ['vue'],
  format: ['cjs', 'esm'],
  target: 'es5',
});
