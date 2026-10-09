import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { POST_BUILD_CHECKS, runPostBuildChecks } from '../check-post-build.mjs';
import { measureFirstLoad } from '../measure-lab-first-load.mjs';

const FIXTURE_DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'lab-first-load');
const GENEROUS_BUDGET_BYTES = 1_000_000;
const roomyBudgets = { codeGzipBudgetBytes: GENEROUS_BUDGET_BYTES, documentGzipBudgetBytes: GENEROUS_BUDGET_BYTES };
const passingPage = { urlPath: '/tool/', ...roomyBudgets };

describe('runPostBuildChecks', () => {
  it('passes every check on an isolated page within its budget', () => {
    const results = runPostBuildChecks(FIXTURE_DIST, [passingPage]);
    expect(results.map(({ name }) => name)).toEqual(POST_BUILD_CHECKS.map(({ name }) => name));
    expect(results.every(({ failures }) => failures.length === 0)).toBe(true);
  });

  it('reports the isolation failure and the budget failure of the same run together', () => {
    const results = runPostBuildChecks(FIXTURE_DIST, [{ urlPath: '/eager/', ...roomyBudgets }]);
    expect(results.map(({ failures }) => failures)).toEqual([
      ['/eager/: no Content-Security-Policy meta tag'],
      ['/eager/: three.js can load without the visitor asking for it, through /_astro/eager-3d.js -> /_astro/heavy-3d.js; it may sit only behind a chunk named in interactionGatedEntryNames'],
    ]);
  });

  it('fails the budget check alone when a page\'s code is one byte over', () => {
    const measuredBytes = measureFirstLoad(FIXTURE_DIST, passingPage).totals.codeGzipBytes;
    const results = runPostBuildChecks(FIXTURE_DIST, [{ ...passingPage, codeGzipBudgetBytes: measuredBytes - 1 }]);
    expect(results[0].failures).toEqual([]);
    expect(results[1].failures).toHaveLength(1);
  });

  it('turns a page that was not built into a failure of each check, without throwing', () => {
    const results = runPostBuildChecks(FIXTURE_DIST, [{ urlPath: '/absent/', ...roomyBudgets }]);
    expect(results).toHaveLength(POST_BUILD_CHECKS.length);
    for (const { failures } of results) {
      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatch(/^could not run: .*\/absent\//);
    }
  });

  it('fails every check when no page is listed', () => {
    for (const { failures } of runPostBuildChecks(FIXTURE_DIST, [])) {
      expect(failures).toEqual(['no tool pages are listed, so nothing was checked']);
    }
  });

  it('keeps running after a check that throws', () => {
    const checks = [
      { name: 'throws', findFailures: () => { throw new Error('boom'); } },
      { name: 'passes', findFailures: () => [] },
    ];
    expect(runPostBuildChecks(FIXTURE_DIST, [passingPage], checks)).toEqual([
      { name: 'throws', failures: ['could not run: boom'] },
      { name: 'passes', failures: [] },
    ]);
  });
});
