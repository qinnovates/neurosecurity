#!/usr/bin/env node
/**
 * Measures what a first visit to a built tool page downloads before any interaction, in
 * two parts that are budgeted separately:
 *   code      the stylesheets and the static import closure of the page's JavaScript
 *   document  the HTML, which carries the catalog data the page needs
 * Fails when either part is over its budget or the code carries a library that must load
 * on demand. How the files are found is described in first-load-closure.mjs.
 *
 * Not counted: fonts and images, and chunks requested by dynamic `import()`.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/measure-lab-first-load.mjs      every page in tool-pages.mjs, against its budgets
 *   node src/scripts/measure-lab-first-load.mjs --page /some/page/ \
 *        [--budget-code-gzip <bytes>] [--budget-document-gzip <bytes>]
 *   Both forms accept --dist <directory> and --json.
 *
 * Exits 1 when a referenced file is missing, when the first load references another origin,
 * when a library that must stay lazy is in the first load, or when a part is over its budget.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { extractPageEntries, readBuiltFile, walkStaticImportClosure } from './first-load-closure.mjs';
import { DEFAULT_DIST_DIRECTORY, TOOL_PAGES } from './tool-pages.mjs';

/** Text that only appears in a chunk carrying the named library. */
const LAZY_ONLY_MARKERS = [{ marker: 'WebGLRenderer', library: 'three.js' }];
const DOCUMENT_KIND = 'html';
const BUDGET_FLAGS = { '--budget-code-gzip': 'codeGzipBudgetBytes', '--budget-document-gzip': 'documentGzipBudgetBytes' };
const NO_BUDGETS = { codeGzipBudgetBytes: null, documentGzipBudgetBytes: null };

function measureFile(distDirectory, urlPath, kind) {
  const contents = readBuiltFile(distDirectory, urlPath);
  if (contents === null) return null;
  const text = kind === 'script' ? contents.toString('utf-8') : '';
  return {
    urlPath,
    kind,
    rawBytes: contents.length,
    gzipBytes: gzipSync(contents).length,
    lazyOnlyLibraries: LAZY_ONLY_MARKERS.filter(({ marker }) => text.includes(marker)).map(({ library }) => library),
  };
}

function sumBytes(files, field) {
  return files.reduce((sum, file) => sum + file[field], 0);
}

/** Raw and gzip bytes of the whole first load and of its two budgeted parts. */
function totalBytes(files) {
  const documentFiles = files.filter((file) => file.kind === DOCUMENT_KIND);
  const codeFiles = files.filter((file) => file.kind !== DOCUMENT_KIND);
  return {
    rawBytes: sumBytes(files, 'rawBytes'),
    gzipBytes: sumBytes(files, 'gzipBytes'),
    codeRawBytes: sumBytes(codeFiles, 'rawBytes'),
    codeGzipBytes: sumBytes(codeFiles, 'gzipBytes'),
    documentRawBytes: sumBytes(documentFiles, 'rawBytes'),
    documentGzipBytes: sumBytes(documentFiles, 'gzipBytes'),
  };
}

/** Measures the first load of one built page: per-file bytes, totals by part, and what the walk found. */
export function measureFirstLoad(distDirectory, pageUrlPath) {
  const html = readBuiltFile(distDirectory, pageUrlPath);
  if (html === null) {
    throw new Error(`No built page for "${pageUrlPath}" under ${distDirectory}. Run "npm run build" first.`);
  }
  const entries = extractPageEntries(html.toString('utf-8'), pageUrlPath);
  const walk = walkStaticImportClosure(distDirectory, entries.scriptEntries);
  const planned = [
    [pageUrlPath, DOCUMENT_KIND],
    ...entries.stylesheets.map((urlPath) => [urlPath, 'stylesheet']),
    ...walk.closure.map((urlPath) => [urlPath, 'script']),
  ];
  const measured = planned.map(([urlPath, kind]) => ({ urlPath, file: measureFile(distDirectory, urlPath, kind) }));
  const files = measured.filter(({ file }) => file !== null).map(({ file }) => file);
  return {
    pageUrlPath,
    files,
    totals: totalBytes(files),
    lazyTargets: walk.lazyTargets,
    missing: [...walk.missing, ...measured.filter(({ file }) => file === null).map(({ urlPath }) => urlPath)],
    unresolved: walk.unresolved,
    offOrigin: entries.offOrigin,
    lazyOnlyLibrariesInFirstLoad: [...new Set(files.flatMap((file) => file.lazyOnlyLibraries))],
  };
}

/** One part against its budget. A budget of null is not enforced; anything else must be a whole number of bytes. */
function findPartFailures(label, gzipBytes, budgetBytes) {
  if (budgetBytes === null) return [];
  if (!Number.isInteger(budgetBytes) || budgetBytes <= 0) {
    return [`${label} has no usable budget (${String(budgetBytes)}); give it a whole number of bytes in tool-pages.mjs`];
  }
  return gzipBytes > budgetBytes ? [`${label} is ${gzipBytes} bytes gzip, over its budget of ${budgetBytes}`] : [];
}

function findBudgetFailures(totals, { codeGzipBudgetBytes, documentGzipBudgetBytes }) {
  return [
    ...findPartFailures('code (stylesheets and scripts)', totals.codeGzipBytes, codeGzipBudgetBytes),
    ...findPartFailures('document (HTML with its catalog data)', totals.documentGzipBytes, documentGzipBudgetBytes),
  ];
}

/**
 * Returns human-readable reasons the measurement fails; empty means it passes.
 * A budget of null is not enforced.
 */
export function findFirstLoadFailures(measurement, budgets = NO_BUDGETS) {
  return [
    ...measurement.missing.map((urlPath) => `referenced file is missing from the build: ${urlPath}`),
    ...measurement.offOrigin.map((reference) => `first load references another origin: ${reference}`),
    ...measurement.lazyOnlyLibrariesInFirstLoad.map((library) => `${library} is in the first load; it must load on demand`),
    ...findBudgetFailures(measurement.totals, budgets),
  ];
}

/**
 * Measures every listed page against its own budgets.
 * Returns the measurements and one failure per problem, each naming its page; no failures means all pass.
 * Throws when a listed page was not built.
 */
export function checkFirstLoadBudgets(distDirectory = DEFAULT_DIST_DIRECTORY, pages = TOOL_PAGES) {
  const measurements = pages.map(({ urlPath, codeGzipBudgetBytes, documentGzipBudgetBytes }) => (
    { ...measureFirstLoad(distDirectory, urlPath), budgets: { codeGzipBudgetBytes, documentGzipBudgetBytes } }
  ));
  const failures = measurements.flatMap((measurement) => findFirstLoadFailures(measurement, measurement.budgets)
    .map((failure) => `${measurement.pageUrlPath}: ${failure}`));
  return { measurements, failures };
}

function readByteCount(flag, value) {
  const byteCount = Number(value);
  if (!(Number.isInteger(byteCount) && byteCount > 0)) throw new Error(`${flag} needs a whole number of bytes greater than zero.`);
  return byteCount;
}

function parseArguments(argumentList) {
  const options = { distDirectory: DEFAULT_DIST_DIRECTORY, pageUrlPath: null, budgets: { ...NO_BUDGETS }, isJson: false };
  for (let index = 0; index < argumentList.length; index += 1) {
    const argument = argumentList[index];
    if (argument === '--json') options.isJson = true;
    else if (argument === '--dist') options.distDirectory = argumentList[++index] ?? '';
    else if (argument === '--page') options.pageUrlPath = argumentList[++index] ?? '';
    else if (Object.hasOwn(BUDGET_FLAGS, argument)) options.budgets[BUDGET_FLAGS[argument]] = readByteCount(argument, argumentList[++index]);
    else throw new Error(`Unknown argument "${argument}". See the usage note at the top of this script.`);
  }
  if (options.distDirectory === '') throw new Error('--dist needs a directory.');
  if (options.pageUrlPath !== null && !options.pageUrlPath.startsWith('/')) throw new Error('--page needs a site path that starts with "/".');
  const hasBudgetFlag = Object.values(options.budgets).some((budget) => budget !== null);
  if (hasBudgetFlag && options.pageUrlPath === null) throw new Error('A budget flag needs --page; listed pages take their budgets from tool-pages.mjs.');
  return options;
}

function formatBytes(rawBytes, gzipBytes) {
  return `${String(rawBytes).padStart(10)}${String(gzipBytes).padStart(10)}`;
}

function formatPart(label, rawBytes, gzipBytes, budgetBytes) {
  const budget = budgetBytes === null ? 'no budget' : `budget ${budgetBytes}, ${budgetBytes - gzipBytes} left`;
  return `${formatBytes(rawBytes, gzipBytes)}  ${label} (${budget})`;
}

function formatReport({ pageUrlPath, files, totals, budgets, lazyOnlyLibrariesInFirstLoad, lazyTargets, unresolved }) {
  const lines = [`[measure-lab-first-load] ${pageUrlPath}`, '       raw      gzip  kind        file'];
  for (const file of files) lines.push(`${formatBytes(file.rawBytes, file.gzipBytes)}  ${file.kind.padEnd(10)}  ${file.urlPath}`);
  lines.push(formatPart('code: stylesheets and scripts', totals.codeRawBytes, totals.codeGzipBytes, budgets.codeGzipBudgetBytes));
  lines.push(formatPart('document: HTML with its catalog data', totals.documentRawBytes, totals.documentGzipBytes, budgets.documentGzipBudgetBytes));
  lines.push(`${formatBytes(totals.rawBytes, totals.gzipBytes)}  total (${files.length} files)`);
  lines.push(`three.js in first load: ${lazyOnlyLibrariesInFirstLoad.includes('three.js') ? 'YES' : 'no'}`);
  lines.push(`loaded on demand, not counted (${lazyTargets.length}): ${lazyTargets.join(', ') || 'none'}`);
  if (unresolved.length > 0) lines.push(`specifiers that name no file on this site: ${unresolved.join(', ')}`);
  return lines.join('\n');
}

function measureRequestedPages({ distDirectory, pageUrlPath, budgets }) {
  const pages = pageUrlPath === null ? TOOL_PAGES : [{ urlPath: pageUrlPath, ...budgets }];
  return checkFirstLoadBudgets(distDirectory, pages);
}

function runMeasurement(argumentList) {
  const options = parseArguments(argumentList);
  const { measurements, failures } = measureRequestedPages(options);
  const output = options.isJson ? JSON.stringify({ measurements, failures }, null, 2) : measurements.map(formatReport).join('\n\n');
  process.stdout.write(`${output}\n`);
  if (failures.length > 0) {
    for (const failure of failures) process.stderr.write(`[measure-lab-first-load] FAIL: ${failure}\n`);
    process.exit(1);
  }
}

const isRunDirectly = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isRunDirectly) {
  try {
    runMeasurement(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`[measure-lab-first-load] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
