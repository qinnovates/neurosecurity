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
import { findToolPageFailures } from './check-model-page.mjs';
import { findAnatomyPayload } from './find-anatomy-payload.mjs';
import { extractPageEntries, readBuiltFile, traceImportChain, walkImportGraph } from './first-load-closure.mjs';
import { checkFirstLoadBudgets } from './measure-lab-first-load.mjs';
import { ANATOMY_DATA_PAGES, DEFAULT_DIST_DIRECTORY, TOOL_PAGES, resolveBuiltFile } from './tool-pages.mjs';

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
    const markers = findAnatomyPayload(readBuiltFile(distDirectory, chunk)?.toString('utf-8') ?? '');
    if (markers.length === 0) return [];
    return [`${urlPath}: the script ${traceImportChain(importedBy, chunk).join(' -> ')} carries anatomy data (found: ${markers.join(', ')})`];
  });
}

/**
 * A tool page receives the anatomy index's path, length and digest, never its content. This reads
 * what was built: the page's HTML and every script chunk it can load, first-load and lazy alike.
 * However the source spelled an import (a relay, a generated file, an inline script), anatomy data
 * that reached the page or its code is found here. Pages named in ANATOMY_DATA_PAGES are skipped.
 *
 * @param {string} distDirectory
 * @param {readonly { urlPath: string }[]} pages
 * @param {readonly string[]} anatomyDataPages site paths of pages that are meant to carry anatomy data
 * @returns {string[]} failure messages
 */
export function findAnatomyPayloadFailures(distDirectory, pages, anatomyDataPages = ANATOMY_DATA_PAGES) {
  if (pages.length === 0) return [NO_PAGES_FAILURE];
  return pages.filter(({ urlPath }) => !anatomyDataPages.includes(urlPath)).flatMap(({ urlPath }) => {
    const html = fs.readFileSync(resolveBuiltFile(distDirectory, urlPath), 'utf-8');
    const markers = findAnatomyPayload(html);
    const pageFailures = markers.length === 0 ? [] : [`${urlPath}: the page carries anatomy data (found: ${markers.join(', ')})`];
    return [...pageFailures, ...findChunkPayloadFailures(distDirectory, urlPath, listReachableScripts(distDirectory, html, urlPath))];
  });
}

/** Checks of the tool pages themselves. They need nothing but the built pages. */
export const TOOL_PAGE_CHECKS = [
  { name: 'tool pages are isolated', findFailures: (distDirectory, pages) => findToolPageFailures(distDirectory, pages) },
  { name: 'tool pages are within their first-load budgets', findFailures: (distDirectory, pages) => checkFirstLoadBudgets(distDirectory, pages).failures },
  { name: 'tool pages and their scripts carry no anatomy data', findFailures: (distDirectory, pages) => findAnatomyPayloadFailures(distDirectory, pages) },
];

/** Checks of the brain atlas assets. They compare the built site with the committed manifest and source registry. */
export const ATLAS_ASSET_CHECKS = [
  { name: 'atlas assets are served unchanged', findFailures: (distDirectory) => findAssetCoherenceFailures(distDirectory) },
  { name: 'attribution page shows every required wording', findFailures: (distDirectory) => findAttributionFailures(distDirectory) },
];

/** @type {readonly PostBuildCheck[]} */
export const POST_BUILD_CHECKS = [...TOOL_PAGE_CHECKS, ...ATLAS_ASSET_CHECKS];

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
  if (results.some(({ failures }) => failures.length > 0)) process.exit(1);
}
