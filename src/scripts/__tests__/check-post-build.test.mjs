import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_ASSET_CHECKS, POST_BUILD_CHECKS, TOOL_PAGE_CHECKS, findAnatomyPayloadFailures, runPostBuildChecks } from '../check-post-build.mjs';
import { measureFirstLoad } from '../measure-lab-first-load.mjs';

const FIXTURE_DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'lab-first-load');
const GENEROUS_BUDGET_BYTES = 1_000_000;
const roomyBudgets = { codeGzipBudgetBytes: GENEROUS_BUDGET_BYTES, documentGzipBudgetBytes: GENEROUS_BUDGET_BYTES };
const noLazyEntries = { onMountLazyEntryNames: [], interactionGatedEntryNames: [], onDemandLazyEntryNames: [] };
const passingPage = { urlPath: '/tool/', islandEntryName: 'entry', ...noLazyEntries, onDemandLazyEntryNames: ['lazy'], ...roomyBudgets };

describe('runPostBuildChecks', () => {
  it('passes every check on an isolated page within its budget', () => {
    const results = runPostBuildChecks(FIXTURE_DIST, [passingPage], TOOL_PAGE_CHECKS);
    expect(results.map(({ name }) => name)).toEqual(TOOL_PAGE_CHECKS.map(({ name }) => name));
    expect(POST_BUILD_CHECKS).toEqual([...TOOL_PAGE_CHECKS, ...ATLAS_ASSET_CHECKS]);
    expect(results.every(({ failures }) => failures.length === 0)).toBe(true);
  });

  it('reports the isolation failure and the budget failure of the same run together', () => {
    const results = runPostBuildChecks(FIXTURE_DIST, [{ urlPath: '/eager/', islandEntryName: 'eager-3d', ...noLazyEntries, ...roomyBudgets }], TOOL_PAGE_CHECKS);
    expect(results.map(({ failures }) => failures)).toEqual([
      ['/eager/: no Content-Security-Policy meta tag'],
      ['/eager/: three.js can load without the visitor asking for it, through /_astro/eager-3d.js -> /_astro/heavy-3d.js; it may sit only behind a chunk named in interactionGatedEntryNames'],
      [],
    ]);
  });

  it('fails the budget check alone when a page\'s code is one byte over', () => {
    const measuredBytes = measureFirstLoad(FIXTURE_DIST, passingPage).totals.codeGzipBytes;
    const results = runPostBuildChecks(FIXTURE_DIST, [{ ...passingPage, codeGzipBudgetBytes: measuredBytes - 1 }], TOOL_PAGE_CHECKS);
    expect(results[0].failures).toEqual([]);
    expect(results[1].failures).toHaveLength(1);
  });

  it('turns a page that was not built into a failure of each check, without throwing', () => {
    const results = runPostBuildChecks(FIXTURE_DIST, [{ ...passingPage, urlPath: '/absent/' }], TOOL_PAGE_CHECKS);
    expect(results).toHaveLength(TOOL_PAGE_CHECKS.length);
    for (const { failures } of results) {
      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatch(/^could not run: .*\/absent\//);
    }
  });

  it('fails every check when no page is listed', () => {
    for (const { failures } of runPostBuildChecks(FIXTURE_DIST, [], TOOL_PAGE_CHECKS)) {
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

  it('fails a tool page that carries anatomy data, and passes one that does not', () => {
    expect(findAnatomyPayloadFailures(FIXTURE_DIST, [passingPage])).toEqual([]);
    const withPayload = fs.mkdtempSync(path.join(os.tmpdir(), 'post-build-'));
    fs.mkdirSync(path.join(withPayload, 'tool'));
    fs.writeFileSync(path.join(withPayload, 'tool', 'index.html'), '<html><body><script type="application/json">{"clearance_reason":"x"}</script></body></html>');
    expect(findAnatomyPayloadFailures(withPayload, [passingPage])).toEqual(['/tool/: the page carries anatomy data (found: clearance_reason)']);
    fs.rmSync(withPayload, { recursive: true });
  });
});
