#!/usr/bin/env node
/**
 * Measures what a first visit to a built tool page downloads before any interaction:
 * the HTML, every stylesheet it links, and the static import closure of its JavaScript.
 * Fails when that is over the page's budget or carries a library that must load on demand.
 *
 * A client-only island has no script tag. Its entry is named by the `component-url` and
 * `renderer-url` attributes on `astro-island`, so the walk starts there and follows static
 * `import` statements through the built chunks.
 *
 * Not counted: fonts and images, and chunks requested by dynamic `import()`, which are
 * listed separately. Imports are found by pattern, not by a parser: text inside a string
 * that looks like an import statement is counted too, which can only overstate the total.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/measure-lab-first-load.mjs                 every page in tool-pages.mjs, against its budget
 *   node src/scripts/measure-lab-first-load.mjs --page /some/page/ [--budget-gzip <bytes>]
 *   Both forms accept --dist <directory> and --json.
 *
 * Exits 1 when a referenced file is missing, when the first load references another origin,
 * when a library that must stay lazy is in the first load, or when the gzip total is over budget.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { DEFAULT_DIST_DIRECTORY, TOOL_PAGES, resolveBuiltFile } from './tool-pages.mjs';

const SCRIPT_EXTENSION_PATTERN = /\.m?js$/i;

/** Text that only appears in a chunk carrying the named library. */
const LAZY_ONLY_MARKERS = [{ marker: 'WebGLRenderer', library: 'three.js' }];

/** One import clause: names, `*`, commas, and a braced list whose names may be quoted strings. */
const IMPORT_CLAUSE = String.raw`(?:[\w$*\s,]|\{(?:[^{}"'\`]|"[^"]*"|'[^']*')*\})+?`;
/** `import x from "./a.js"`, `import "./a.js"`, `export { x } from "./a.js"`, `export * from "./a.js"`. */
const STATIC_IMPORT_PATTERN = new RegExp(String.raw`(?<![\w$.])(?:import|export)\s*(?:${IMPORT_CLAUSE}\s*from\s*)?["']([^"']+)["']`, 'g');
/** `import("./a.js")` with a literal target. */
const DYNAMIC_IMPORT_PATTERN = /(?<![\w$.])import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

const TAG_PATTERN = /<(link|script|astro-island)\b([^>]*)>/gi;
const INLINE_MODULE_SCRIPT_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi;
const ISLAND_ENTRY_ATTRIBUTES = ['component-url', 'renderer-url', 'before-hydration-url'];
const OFF_ORIGIN_URL_PATTERN = /^\s*([a-z][a-z0-9+.-]*:|\/\/)/i;

function readAttribute(attributeText, name) {
  const pattern = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = attributeText.match(pattern);
  return match ? (match[1] ?? match[2]) : null;
}

function uniqueMatches(source, pattern) {
  return [...new Set([...source.matchAll(pattern)].map((match) => match[1]))];
}

/** Specifiers a built chunk imports as soon as it is evaluated. */
export function extractStaticImportSpecifiers(source) {
  return uniqueMatches(source, STATIC_IMPORT_PATTERN);
}

/** Specifiers a built chunk imports only when the surrounding code runs. */
export function extractDynamicImportSpecifiers(source) {
  return uniqueMatches(source, DYNAMIC_IMPORT_PATTERN);
}

/**
 * Resolves a specifier found in `fromUrlPath` to a site-root URL path.
 * Returns null for anything that is not a file on this site (bare names, other origins).
 */
export function resolveSiteUrlPath(fromUrlPath, specifier) {
  if (OFF_ORIGIN_URL_PATTERN.test(specifier)) return null;
  if (!specifier.startsWith('/') && !specifier.startsWith('.')) return null;
  const withoutQuery = specifier.split(/[?#]/)[0];
  return path.posix.resolve(path.posix.dirname(fromUrlPath), withoutQuery);
}

function readBuiltFile(distDirectory, urlPath) {
  try {
    return readFileSync(resolveBuiltFile(distDirectory, urlPath));
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'EISDIR') return null;
    throw error;
  }
}

/**
 * Follows static imports from the entry chunks (site-root URL paths) until no new chunk appears.
 * Returns `closure` (every chunk fetched up front, in discovery order), `lazyTargets` (chunks
 * reachable only through a dynamic import), `missing` (imported but absent from the build)
 * and `unresolved` (specifiers that do not name a file on this site).
 */
export function walkStaticImportClosure(distDirectory, entryUrlPaths) {
  const closure = new Set();
  const lazyTargets = new Set();
  const missing = new Set();
  const unresolved = new Set();
  const pending = [...entryUrlPaths];

  while (pending.length > 0) {
    const urlPath = pending.shift();
    if (closure.has(urlPath) || missing.has(urlPath)) continue;
    const contents = readBuiltFile(distDirectory, urlPath);
    if (contents === null) {
      missing.add(urlPath);
      continue;
    }
    closure.add(urlPath);
    if (!SCRIPT_EXTENSION_PATTERN.test(urlPath)) continue;
    const source = contents.toString('utf-8');
    for (const specifier of extractStaticImportSpecifiers(source)) {
      const target = resolveSiteUrlPath(urlPath, specifier);
      if (target === null) unresolved.add(specifier);
      else pending.push(target);
    }
    for (const specifier of extractDynamicImportSpecifiers(source)) {
      const target = resolveSiteUrlPath(urlPath, specifier);
      if (target !== null) lazyTargets.add(target);
    }
  }

  return {
    closure: [...closure],
    lazyTargets: [...lazyTargets].filter((target) => !closure.has(target)).sort(),
    missing: [...missing].sort(),
    unresolved: [...unresolved].sort(),
  };
}

function collectTagEntries(html, pageUrlPath, entries) {
  for (const [, tagName, attributeText] of html.matchAll(TAG_PATTERN)) {
    const tag = tagName.toLowerCase();
    const relation = (readAttribute(attributeText, 'rel') ?? '').toLowerCase();
    const candidates = [];
    if (tag === 'link' && relation === 'stylesheet') candidates.push(['stylesheets', readAttribute(attributeText, 'href')]);
    if (tag === 'link' && relation === 'modulepreload') candidates.push(['scriptEntries', readAttribute(attributeText, 'href')]);
    if (tag === 'script') candidates.push(['scriptEntries', readAttribute(attributeText, 'src')]);
    if (tag === 'astro-island') {
      for (const name of ISLAND_ENTRY_ATTRIBUTES) candidates.push(['scriptEntries', readAttribute(attributeText, name)]);
    }
    for (const [kind, reference] of candidates) {
      if (reference === null || reference === '') continue;
      const target = resolveSiteUrlPath(pageUrlPath, reference.startsWith('.') || reference.startsWith('/') ? reference : `./${reference}`);
      if (OFF_ORIGIN_URL_PATTERN.test(reference) || target === null) entries.offOrigin.push(reference);
      else entries[kind].push(target);
    }
  }
}

function collectInlineModuleEntries(html, pageUrlPath, entries) {
  for (const [, attributeText, body] of html.matchAll(INLINE_MODULE_SCRIPT_PATTERN)) {
    if ((readAttribute(attributeText, 'type') ?? '').toLowerCase() !== 'module') continue;
    if (readAttribute(attributeText, 'src') !== null) continue;
    for (const specifier of extractStaticImportSpecifiers(body)) {
      const target = resolveSiteUrlPath(pageUrlPath, specifier);
      if (target === null) entries.offOrigin.push(specifier);
      else entries.scriptEntries.push(target);
    }
  }
}

/** Lists what the page's own markup makes the browser fetch up front. */
export function extractPageEntries(html, pageUrlPath) {
  const entries = { stylesheets: [], scriptEntries: [], offOrigin: [] };
  collectTagEntries(html, pageUrlPath, entries);
  collectInlineModuleEntries(html, pageUrlPath, entries);
  return {
    stylesheets: [...new Set(entries.stylesheets)],
    scriptEntries: [...new Set(entries.scriptEntries)],
    offOrigin: [...new Set(entries.offOrigin)],
  };
}

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

/** Measures the first load of one built page: per-file and total bytes, plus what the walk found. */
export function measureFirstLoad(distDirectory, pageUrlPath) {
  const html = readBuiltFile(distDirectory, pageUrlPath);
  if (html === null) {
    throw new Error(`No built page for "${pageUrlPath}" under ${distDirectory}. Run "npm run build" first.`);
  }
  const entries = extractPageEntries(html.toString('utf-8'), pageUrlPath);
  const walk = walkStaticImportClosure(distDirectory, entries.scriptEntries);
  const planned = [
    [pageUrlPath, 'html'],
    ...entries.stylesheets.map((urlPath) => [urlPath, 'stylesheet']),
    ...walk.closure.map((urlPath) => [urlPath, 'script']),
  ];
  const measured = planned.map(([urlPath, kind]) => ({ urlPath, file: measureFile(distDirectory, urlPath, kind) }));
  const files = measured.filter(({ file }) => file !== null).map(({ file }) => file);
  return {
    pageUrlPath,
    files,
    totals: {
      rawBytes: files.reduce((sum, file) => sum + file.rawBytes, 0),
      gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
    },
    lazyTargets: walk.lazyTargets,
    missing: [...walk.missing, ...measured.filter(({ file }) => file === null).map(({ urlPath }) => urlPath)],
    unresolved: walk.unresolved,
    offOrigin: entries.offOrigin,
    lazyOnlyLibrariesInFirstLoad: [...new Set(files.flatMap((file) => file.lazyOnlyLibraries))],
  };
}

/** Returns human-readable reasons the measurement fails; empty means it passes. */
export function findFirstLoadFailures(measurement, gzipBudgetBytes = null) {
  const failures = [
    ...measurement.missing.map((urlPath) => `referenced file is missing from the build: ${urlPath}`),
    ...measurement.offOrigin.map((reference) => `first load references another origin: ${reference}`),
    ...measurement.lazyOnlyLibrariesInFirstLoad.map((library) => `${library} is in the first load; it must load on demand`),
  ];
  if (gzipBudgetBytes !== null && measurement.totals.gzipBytes > gzipBudgetBytes) {
    failures.push(`first load is ${measurement.totals.gzipBytes} bytes gzip, over the budget of ${gzipBudgetBytes}`);
  }
  return failures;
}

/**
 * Measures every listed page against its own budget.
 * Returns the measurements and one failure per problem, each naming its page; no failures means all pass.
 * Throws when a listed page was not built.
 */
export function checkFirstLoadBudgets(distDirectory = DEFAULT_DIST_DIRECTORY, pages = TOOL_PAGES) {
  const measurements = pages.map((page) => ({ ...measureFirstLoad(distDirectory, page.urlPath), gzipBudgetBytes: page.firstLoadGzipBudgetBytes }));
  const failures = measurements.flatMap((measurement) => findFirstLoadFailures(measurement, measurement.gzipBudgetBytes)
    .map((failure) => `${measurement.pageUrlPath}: ${failure}`));
  return { measurements, failures };
}

function parseArguments(argumentList) {
  const options = { distDirectory: DEFAULT_DIST_DIRECTORY, pageUrlPath: null, gzipBudgetBytes: null, isJson: false };
  for (let index = 0; index < argumentList.length; index += 1) {
    const argument = argumentList[index];
    if (argument === '--json') options.isJson = true;
    else if (argument === '--dist') options.distDirectory = argumentList[++index] ?? '';
    else if (argument === '--page') options.pageUrlPath = argumentList[++index] ?? '';
    else if (argument === '--budget-gzip') options.gzipBudgetBytes = Number(argumentList[++index]);
    else throw new Error(`Unknown argument "${argument}". See the usage note at the top of this script.`);
  }
  if (options.distDirectory === '') throw new Error('--dist needs a directory.');
  if (options.pageUrlPath !== null && !options.pageUrlPath.startsWith('/')) throw new Error('--page needs a site path that starts with "/".');
  if (options.gzipBudgetBytes !== null && options.pageUrlPath === null) throw new Error('--budget-gzip needs --page; listed pages take their budget from tool-pages.mjs.');
  if (options.gzipBudgetBytes !== null && !(Number.isInteger(options.gzipBudgetBytes) && options.gzipBudgetBytes > 0)) {
    throw new Error('--budget-gzip needs a whole number of bytes greater than zero.');
  }
  return options;
}

function formatReport(measurement) {
  const lines = [`[measure-lab-first-load] ${measurement.pageUrlPath}`, '       raw      gzip  kind        file'];
  for (const file of measurement.files) {
    lines.push(`${String(file.rawBytes).padStart(10)}${String(file.gzipBytes).padStart(10)}  ${file.kind.padEnd(10)}  ${file.urlPath}`);
  }
  lines.push(`${String(measurement.totals.rawBytes).padStart(10)}${String(measurement.totals.gzipBytes).padStart(10)}  total (${measurement.files.length} files)`);
  if (measurement.gzipBudgetBytes !== null) lines.push(`budget: ${measurement.gzipBudgetBytes} gzip (${measurement.gzipBudgetBytes - measurement.totals.gzipBytes} left)`);
  lines.push(`three.js in first load: ${measurement.lazyOnlyLibrariesInFirstLoad.includes('three.js') ? 'YES' : 'no'}`);
  lines.push(`loaded on demand, not counted (${measurement.lazyTargets.length}): ${measurement.lazyTargets.join(', ') || 'none'}`);
  if (measurement.unresolved.length > 0) lines.push(`specifiers that name no file on this site: ${measurement.unresolved.join(', ')}`);
  return lines.join('\n');
}

function measureRequestedPages({ distDirectory, pageUrlPath, gzipBudgetBytes }) {
  const pages = pageUrlPath === null ? TOOL_PAGES : [{ urlPath: pageUrlPath, firstLoadGzipBudgetBytes: gzipBudgetBytes }];
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
