#!/usr/bin/env node
/**
 * Runs every check that needs the built site, and reports all of them before failing,
 * so one run shows everything that is wrong.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/check-post-build.mjs
 *
 * To add a check: export a function that takes the build directory and the tool-page
 * list and returns a list of failure messages, then add one entry to POST_BUILD_CHECKS.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findAssetCoherenceFailures, findAttributionFailures } from './check-atlas-assets.mjs';
import { findHeaderPolicyFailures } from './check-headers.mjs';
import { findDeadInternalLinkFailures } from './check-internal-links.mjs';
import { findToolPageFailures } from './check-model-page.mjs';
import { findAnatomyPayload, findAnatomyPayloadInScript } from './find-anatomy-payload.mjs';
import { extractPageEntries, readBuiltFile, traceImportChain, walkImportGraph } from './first-load-closure.mjs';
import { checkFirstLoadBudgets } from './measure-lab-first-load.mjs';
import { DEFAULT_DIST_DIRECTORY, REGION_VIEW_PAGES, TOOL_PAGES, resolveBuiltFile } from './tool-pages.mjs';

/**
 * @typedef {object} PostBuildCheck
 * @property {string} name what the check protects, shown in the report
 * @property {(distDirectory: string, pages: readonly object[]) => string[]} findFailures
 */

const NO_PAGES_FAILURE = 'no tool pages are listed, so nothing was checked';

const SCRIPT_CHUNK_PATTERN = /\.m?js$/i;

/** Every script the page can load: its entries and whatever they import, statically or by `import()`, gated or not. */
function listReachableScripts(distDirectory, html, urlPath) {
  const { scriptEntries } = extractPageEntries(html, urlPath);
  const walk = walkImportGraph(distDirectory, scriptEntries, { followDynamicImports: true });
  return { chunks: walk.closure.filter((chunk) => SCRIPT_CHUNK_PATTERN.test(chunk)), importedBy: walk.importedBy };
}

function findChunkPayloadFailures(distDirectory, urlPath, { chunks, importedBy }) {
  return chunks.flatMap((chunk) => {
    const markers = findAnatomyPayloadInScript(readBuiltFile(distDirectory, chunk)?.toString('utf-8') ?? '');
    if (markers.length === 0) return [];
    return [`${urlPath}: the script ${traceImportChain(importedBy, chunk).join(' -> ')} carries the anatomy tables or a data file (found: ${markers.join(', ')})`];
  });
}

/**
 * No page is built with anatomy rows in it: a page receives the anatomy index's path, length and digest,
 * and fetches the rest. This reads what was built.
 *   Every page's HTML is scanned, whatever the page is for.
 *   Every script chunk a page can load, first-load and lazy alike, is scanned for the anatomy tables and
 *   data files, unless the page declares `scriptsMayCarryAnatomy` (tool-pages.mjs).
 * However the source spelled an import (a relay, a generated file, an inline script), tables or data files
 * that were bundled into the page's code are found here.
 *
 * @param {string} distDirectory
 * @param {readonly { urlPath: string, scriptsMayCarryAnatomy?: boolean }[]} pages
 * @returns {string[]} failure messages
 */
export function findAnatomyPayloadFailures(distDirectory, pages) {
  if (pages.length === 0) return [NO_PAGES_FAILURE];
  return pages.flatMap(({ urlPath, scriptsMayCarryAnatomy }) => {
    const html = fs.readFileSync(resolveBuiltFile(distDirectory, urlPath), 'utf-8');
    const markers = findAnatomyPayload(html);
    const pageFailures = markers.length === 0 ? [] : [`${urlPath}: the page carries anatomy data (found: ${markers.join(', ')})`];
    if (scriptsMayCarryAnatomy === true) return pageFailures;
    return [...pageFailures, ...findChunkPayloadFailures(distDirectory, urlPath, listReachableScripts(distDirectory, html, urlPath))];
  });
}

/** Checks of the tool pages themselves. They need nothing but the built pages. */
export const TOOL_PAGE_CHECKS = [
  { name: 'tool pages are isolated', findFailures: (distDirectory, pages) => findToolPageFailures(distDirectory, pages) },
  { name: 'tool pages are within their first-load budgets', findFailures: (distDirectory, pages) => checkFirstLoadBudgets(distDirectory, pages).failures },
  { name: 'no tool page is built with anatomy data in it', findFailures: (distDirectory, pages) => findAnatomyPayloadFailures(distDirectory, pages) },
];

/** Checks of the brain atlas assets. They compare the built site with the committed manifest and source registry. */
export const ATLAS_ASSET_CHECKS = [
  { name: 'atlas assets are served unchanged', findFailures: (distDirectory) => findAssetCoherenceFailures(distDirectory) },
  { name: 'attribution page shows every required wording', findFailures: (distDirectory) => findAttributionFailures(distDirectory) },
];

/**
 * The ordinary pages that mount the 3D view under a list (REGION_VIEW_PAGES). They have no byte budget; what is
 * checked is that every `import()` they can reach is declared and that three.js sits only behind the declared gate.
 */
export function findRegionViewFailures(distDirectory, pages = REGION_VIEW_PAGES) {
  return checkFirstLoadBudgets(distDirectory, pages, { isAdHoc: true }).failures;
}

/** Checks of the pages listed in REGION_VIEW_PAGES. They take their own page list, not the tool pages'. */
export const REGION_VIEW_CHECKS = [
  { name: 'pages that mount the 3D view keep three.js behind its button', findFailures: (distDirectory) => findRegionViewFailures(distDirectory) },
];

/** The preview host's `_headers`, emitted by prebuild from the policy module; it takes no page list. */
export const HEADER_CHECKS = [
  { name: 'emitted _headers policies equal csp-policy.ts', findFailures: (distDirectory) => findHeaderPolicyFailures(distDirectory) },
];

/** Every built page except the frozen whitepaper archives; it takes no page list. */
export const LINK_CHECKS = [
  { name: 'same-site links in built pages point at something in the build', findFailures: (distDirectory) => findDeadInternalLinkFailures(distDirectory) },
];

/** @type {readonly PostBuildCheck[]} */
export const POST_BUILD_CHECKS = [...TOOL_PAGE_CHECKS, ...ATLAS_ASSET_CHECKS, ...REGION_VIEW_CHECKS, ...HEADER_CHECKS, ...LINK_CHECKS];

/**
 * Runs each check and collects its failures. A check that cannot run (for example because
 * a page was not built) counts as failed with the reason, and the remaining checks still run.
 *
 * @returns {{ name: string, failures: string[] }[]}
 */
export function runPostBuildChecks(distDirectory = DEFAULT_DIST_DIRECTORY, pages = TOOL_PAGES, checks = POST_BUILD_CHECKS) {
  return checks.map(({ name, findFailures }) => {
    try {
      return { name, failures: findFailures(distDirectory, pages) };
    } catch (error) {
      return { name, failures: [`could not run: ${error instanceof Error ? error.message : String(error)}`] };
    }
  });
}

function reportResults(results) {
  for (const { name, failures } of results) {
    if (failures.length === 0) {
      process.stdout.write(`[check-post-build] ok    ${name}\n`);
      continue;
    }
    process.stderr.write(`[check-post-build] FAIL  ${name}\n`);
    for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
  }
}

const isRunDirectly = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isRunDirectly) {
  const results = runPostBuildChecks();
  reportResults(results);
  // Not process.exit: after reading a large script chunk, exiting while V8 is still compiling in the background has been seen to hang.
  if (results.some(({ failures }) => failures.length > 0)) process.exitCode = 1;
}
