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

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findToolPageFailures } from './check-model-page.mjs';
import { checkFirstLoadBudgets } from './measure-lab-first-load.mjs';
import { DEFAULT_DIST_DIRECTORY, TOOL_PAGES } from './tool-pages.mjs';

/**
 * @typedef {object} PostBuildCheck
 * @property {string} name what the check protects, shown in the report
 * @property {(distDirectory: string, pages: readonly object[]) => string[]} findFailures
 */

/** @type {readonly PostBuildCheck[]} */
export const POST_BUILD_CHECKS = [
  { name: 'tool pages are isolated', findFailures: (distDirectory, pages) => findToolPageFailures(distDirectory, pages) },
  { name: 'tool pages are within their first-load budget', findFailures: (distDirectory, pages) => checkFirstLoadBudgets(distDirectory, pages).failures },
];

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
