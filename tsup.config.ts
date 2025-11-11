import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['lib/index.ts'],
  clean: true,
  dts: true,
  shims: true,
  external: ['vue-demi', '@vue/composition-api'],
  format: ['cjs', 'esm'],
  target: 'es5',
});
