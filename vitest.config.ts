import { defaultExclude, defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Mirrors the `vite.resolve.alias` block in astro.config.mjs so tests can
 * import build-time data adapters (which read `@shared/*.json`) directly.
 */
export default defineConfig({
  test: {
    // The Lab's jsdom screens render large trees; a shared CI runner takes several times longer than a laptop.
    testTimeout: 30_000,
    // A worktree (.claude/worktrees/<agent>/) is a full second checkout with its own node_modules; vitest's
    // default exclude list has no reason to know about it, so without this a stale or mid-task worktree's own
    // test files (and often a stale, duplicate-React node_modules) run alongside the real repo's and can fail
    // for reasons that have nothing to do with the actual change under test here.
    exclude: [...defaultExclude, '**/.claude/worktrees/**'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, './datalake'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
