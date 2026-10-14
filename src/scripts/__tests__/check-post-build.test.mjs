import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_ASSET_CHECKS, POST_BUILD_CHECKS, REGION_VIEW_CHECKS, TOOL_PAGE_CHECKS, findAnatomyPayloadFailures, findRegionViewFailures, findRegionViewMarkFailures, runPostBuildChecks } from '../check-post-build.mjs';
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
    expect(POST_BUILD_CHECKS).toEqual([...TOOL_PAGE_CHECKS, ...ATLAS_ASSET_CHECKS, ...REGION_VIEW_CHECKS]);
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

  it('holds a page that mounts the 3D view to its gate without asking it for a budget', () => {
    expect(findRegionViewFailures(FIXTURE_DIST, [{ urlPath: '/tool/', onDemandLazyEntryNames: ['lazy'] }])).toEqual([]);
    expect(findRegionViewFailures(FIXTURE_DIST, [{ urlPath: '/eager/' }])).toEqual([
      '/eager/: three.js can load without the visitor asking for it, through /_astro/eager-3d.js -> /_astro/heavy-3d.js; it may sit only behind a chunk named in interactionGatedEntryNames',
    ]);
  });

  it('requires the review mark inside the rendered links-review note, not merely in the props', () => {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'region-view-mark-'));
    const writePage = (urlPath, body) => { fs.mkdirSync(path.join(dist, urlPath), { recursive: true }); fs.writeFileSync(path.join(dist, urlPath, 'index.html'), body); };
    const props = '<astro-island props="{&quot;regionViewLinksReview&quot;:{&quot;mark&quot;:&quot;AI-drafted, unreviewed&quot;}}"></astro-island>';
    writePage('with-mark', `<span data-mount-note="links-review">Drafted: <span class="atlas-mark" data-ai-drafted="true">AI-drafted, unreviewed</span></span><span data-mount-note="choose-in-list">x</span>`);
    writePage('no-mark', `${props}<span data-mount-note="links-review">Drafted: </span><span data-mount-note="choose-in-list"><span data-ai-drafted="true">AI-drafted, unreviewed</span></span>`);
    writePage('props-only', `${props}<span data-mount-note="nothing-coloured">drafted links name no region</span>`);
    try {
      expect(findRegionViewMarkFailures(dist, ['/with-mark/'])).toEqual([]);
      // The mark's words in the serialized props, or in another note, do not count: it must sit inside the links-review note.
      expect(findRegionViewMarkFailures(dist, ['/no-mark/'])).toEqual(['/no-mark/: the rendered links-review note has no data-ai-drafted="true" element reading "AI-drafted, unreviewed"']);
      expect(findRegionViewMarkFailures(dist, ['/props-only/'])[0]).toContain('no rendered <span data-mount-note="links-review"> element');
    } finally {
      fs.rmSync(dist, { recursive: true, force: true });
    }
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

/**
 * The two leaks a second verification built by importing the generated query-table file
 * (src/site/data/kql-tables.json), as they come out of a build: rows in the page's HTML
 * when the page's frontmatter imports it, and a script chunk holding the tables when a
 * lazily loaded mode imports it. No source scan saw either.
 */
describe('findAnatomyPayloadFailures on what a build produces', () => {
  const TERM_ROW = { technique_id: 'QIF-T0100', named_term: 'cortex', ai_assigned_term_role: 'named_as_delivery_route', match_kind: 'term_is_broader_than_region', other_match_region_id: 'pfc' };
  const island = (props) => `<astro-island component-url="/_astro/Shell.js" renderer-url="/_astro/client.js" props="${props}" client="load"></astro-island>`;
  const page = (body) => `<!DOCTYPE html><html><head></head><body>${body}</body></html>`;
  const toolPage = { urlPath: '/tool/', scriptsMayCarryAnatomy: false };

  /** A built site in a temporary folder: path under the build -> contents. */
  function buildDist(files) {
    const distDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'post-build-'));
    for (const [filePath, contents] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(distDirectory, filePath)), { recursive: true });
      fs.writeFileSync(path.join(distDirectory, filePath), contents);
    }
    return distDirectory;
  }

  const CLEAN_SCRIPTS = {
    '_astro/client.js': 'export default function hydrate(){}',
    '_astro/Shell.js': 'const modes={query:()=>import("./QueryMode.js")};export{modes as default};',
    '_astro/QueryMode.js': 'import{run}from"./engine.js";export{run as default};',
    '_astro/engine.js': 'const run=()=>fetch("/data/kql-tables.json");export{run};',
  };

  it('passes a page whose HTML and scripts hold no anatomy data', () => {
    const distDirectory = buildDist({ 'tool/index.html': page(island('{}')), ...CLEAN_SCRIPTS });
    expect(findAnatomyPayloadFailures(distDirectory, [toolPage])).toEqual([]);
    fs.rmSync(distDirectory, { recursive: true });
  });

  it('fails the page whose frontmatter imported the generated tables and passed rows to its island', () => {
    const props = JSON.stringify({ terms: [0, [TERM_ROW]] }).replaceAll('"', '&quot;');
    const distDirectory = buildDist({ 'tool/index.html': page(island(props)), ...CLEAN_SCRIPTS });
    const failures = findAnatomyPayloadFailures(distDirectory, [toolPage]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('/tool/: the page carries anatomy data (found: ');
    expect(failures[0]).toContain('term_is_broader_than_region');
    fs.rmSync(distDirectory, { recursive: true });
  });

  it('fails the page whose lazily loaded mode bundled the generated tables, naming the chunk and how it is reached', () => {
    const bundled = `const tables=${JSON.stringify({ anatomy_technique_terms: [TERM_ROW] })};export{tables as default};`;
    const distDirectory = buildDist({ 'tool/index.html': page(island('{}')), ...CLEAN_SCRIPTS, '_astro/QueryMode.js': bundled });
    const failures = findAnatomyPayloadFailures(distDirectory, [toolPage]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('/tool/: the script /_astro/Shell.js -> /_astro/QueryMode.js carries the anatomy tables or a data file (found: ');
    expect(failures[0]).toContain('named_as_delivery_route');
    fs.rmSync(distDirectory, { recursive: true });
  });

  it('fails a chunk two imports behind a lazy one, and one behind an interaction gate', () => {
    const deep = { ...CLEAN_SCRIPTS, '_astro/engine.js': 'const row={single_region_match:!1,other_match_region_id:"pfc"};export{row as run};' };
    const distDirectory = buildDist({ 'tool/index.html': page(island('{}')), ...deep });
    expect(findAnatomyPayloadFailures(distDirectory, [{ ...toolPage, interactionGatedEntryNames: ['QueryMode'] }])).toEqual([
      expect.stringContaining('/tool/: the script /_astro/Shell.js -> /_astro/QueryMode.js -> /_astro/engine.js carries the anatomy tables or a data file'),
    ]);
    fs.rmSync(distDirectory, { recursive: true });
  });

  it('does not scan the scripts of a page whose scripts may carry anatomy code, and still scans its HTML', () => {
    const anatomyPage = { urlPath: '/tool/', scriptsMayCarryAnatomy: true };
    const bundled = `const tables=${JSON.stringify({ anatomy_technique_terms: [TERM_ROW] })};export{tables as default};`;
    const scriptsOnly = buildDist({ 'tool/index.html': page(island('{}')), ...CLEAN_SCRIPTS, '_astro/QueryMode.js': bundled });
    expect(findAnatomyPayloadFailures(scriptsOnly, [toolPage])).toHaveLength(1);
    expect(findAnatomyPayloadFailures(scriptsOnly, [anatomyPage])).toEqual([]);
    const props = JSON.stringify({ terms: [0, [TERM_ROW]] }).replaceAll('"', '&quot;');
    const inlined = buildDist({ 'tool/index.html': page(island(props)), ...CLEAN_SCRIPTS });
    expect(findAnatomyPayloadFailures(inlined, [anatomyPage])).toEqual([expect.stringContaining('/tool/: the page carries anatomy data')]);
    fs.rmSync(scriptsOnly, { recursive: true });
    fs.rmSync(inlined, { recursive: true });
  });

  it('is not tripped by a script that holds only ordinary words the tables also use', () => {
    const ordinary = 'class HemisphereLight{}const cve={urls:[],source_id:"nvd",grant:"granted"};const row={review_state:"x",hemisphere:"left",name:"n"};export{HemisphereLight,cve,row};';
    const distDirectory = buildDist({ 'tool/index.html': page(island('{}')), ...CLEAN_SCRIPTS, '_astro/engine.js': ordinary });
    expect(findAnatomyPayloadFailures(distDirectory, [toolPage])).toEqual([]);
    fs.rmSync(distDirectory, { recursive: true });
  });
});
