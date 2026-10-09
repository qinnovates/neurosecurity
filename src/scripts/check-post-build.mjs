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
import { checkFirstLoadBudgets } from './measure-lab-first-load.mjs';
import { DEFAULT_DIST_DIRECTORY, TOOL_PAGES, resolveBuiltFile } from './tool-pages.mjs';

/**
 * @typedef {object} PostBuildCheck
 * @property {string} name what the check protects, shown in the report
 * @property {(distDirectory: string, pages: readonly object[]) => string[]} findFailures
 */

const NO_PAGES_FAILURE = 'no tool pages are listed, so nothing was checked';

/**
 * A tool page receives the anatomy index's path, length and digest, never its content.
 *
 * @param {string} distDirectory
 * @param {readonly { urlPath: string }[]} pages
 * @returns {string[]} failure messages
 */
export function findAnatomyPayloadFailures(distDirectory, pages) {
  if (pages.length === 0) return [NO_PAGES_FAILURE];
  return pages.flatMap(({ urlPath }) => {
    const markers = findAnatomyPayload(fs.readFileSync(resolveBuiltFile(distDirectory, urlPath), 'utf-8'));
    return markers.length === 0 ? [] : [`${urlPath}: the page carries anatomy data (found: ${markers.join(', ')})`];
  });
}

/** Checks of the tool pages themselves. They need nothing but the built pages. */
export const TOOL_PAGE_CHECKS = [
  { name: 'tool pages are isolated', findFailures: (distDirectory, pages) => findToolPageFailures(distDirectory, pages) },
  { name: 'tool pages are within their first-load budgets', findFailures: (distDirectory, pages) => checkFirstLoadBudgets(distDirectory, pages).failures },
  { name: 'tool pages carry no anatomy data', findFailures: (distDirectory, pages) => findAnatomyPayloadFailures(distDirectory, pages) },
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
