import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Mirrors the `vite.resolve.alias` block in astro.config.mjs so tests can
 * import build-time data adapters (which read `@shared/*.json`) directly.
 */
export default defineConfig({
  test: {
    // The Lab's jsdom screens render large trees; a shared CI runner takes several times longer than a laptop.
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, './datalake'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
