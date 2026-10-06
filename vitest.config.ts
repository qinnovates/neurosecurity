import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Mirrors the `vite.resolve.alias` block in astro.config.mjs so tests can
 * import build-time data adapters (which read `@shared/*.json`) directly.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, './datalake'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
