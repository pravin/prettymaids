import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  resolve: {
    alias: { prettymaids: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)) },
  },
  server: { fs: { allow: ['../..'] } },
});
