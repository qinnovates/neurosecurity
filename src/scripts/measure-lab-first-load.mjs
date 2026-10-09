#!/usr/bin/env node
/**
 * Measures what a first visit to a built tool page downloads without the visitor doing
 * anything, in two parts that are budgeted separately:
 *   code      stylesheets, the static import closure of the page's scripts, and the chunks
 *             the page imports as it starts (declared per page in tool-pages.mjs)
 *   document  the HTML, which carries the catalog data the page needs
 * It also follows every `import()`. Each one the page can reach must be declared in
 * tool-pages.mjs as on-mount (counted), interaction-gated or on-demand; an undeclared one
 * fails. A library that must stay lazy (three.js) may be reached only through a chunk
 * declared interaction-gated. How files are found is described in first-load-closure.mjs.
 *
 * Not counted: fonts and images, and chunks declared on-demand or interaction-gated. That
 * a declaration is true (an on-demand chunk really does wait for the visitor) cannot be
 * read from the build; the browser evidence run shows it. Not followed at all: an
 * `import()` whose target is computed at run time, and a worker started from a URL.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/measure-lab-first-load.mjs      every page in tool-pages.mjs, against its budgets
 *   node src/scripts/measure-lab-first-load.mjs --page /some/page/ [--island <name>] [--on-mount <name>]...
 *        [--gate <name>]... [--on-demand <name>]... [--budget-code-gzip <bytes>] [--budget-document-gzip <bytes>]
 *   Both forms accept --dist <directory> and --json.
 *
 * Exits 1 on any failure it reports, and when it cannot run.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { chunkStem, extractPageEntries, readBuiltFile, traceImportChain, walkImportGraph } from './first-load-closure.mjs';
import { DEFAULT_DIST_DIRECTORY, LAZY_ENTRY_LISTS, TOOL_PAGES, ToolPageCheckError } from './tool-pages.mjs';

/**
 * Libraries that must never load before the visitor asks, each recognised by text only the
 * chunk that defines it contains. three.js registers itself under this global name; code
 * that merely uses or mentions three.js does not contain it.
 */
export const LAZY_ONLY_LIBRARIES = [{ library: 'three.js', definedBy: /\b__THREE__\b/ }];
const PARTS = { document: 'document', staticCode: 'static', onMountCode: 'on-mount' };
const BUDGET_FLAGS = { '--budget-code-gzip': 'codeGzipBudgetBytes', '--budget-document-gzip': 'documentGzipBudgetBytes' };
const LIST_FLAGS = { '--on-mount': 'onMountLazyEntryNames', '--gate': 'interactionGatedEntryNames', '--on-demand': 'onDemandLazyEntryNames' };

function measureFile(distDirectory, urlPath, kind, part) {
  const contents = readBuiltFile(distDirectory, urlPath);
  if (contents === null) return null;
  return { urlPath, kind, part, rawBytes: contents.length, gzipBytes: gzipSync(contents).length };
}

function measureFiles(distDirectory, planned) {
  const measured = planned.map(([urlPath, kind, part]) => ({ urlPath, file: measureFile(distDirectory, urlPath, kind, part) }));
  return {
    files: measured.filter(({ file }) => file !== null).map(({ file }) => file),
    absentFiles: measured.filter(({ file }) => file === null).map(({ urlPath }) => urlPath),
  };
}

function sumBytes(files, field, part) {
  return files.filter((file) => part === undefined || file.part === part).reduce((sum, file) => sum + file[field], 0);
}

/** Raw and gzip bytes of the whole first load and of each part of it. */
function totalBytes(files) {
  const totals = { rawBytes: sumBytes(files, 'rawBytes'), gzipBytes: sumBytes(files, 'gzipBytes') };
  for (const [name, part] of Object.entries(PARTS)) {
    totals[`${name}RawBytes`] = sumBytes(files, 'rawBytes', part);
    totals[`${name}GzipBytes`] = sumBytes(files, 'gzipBytes', part);
  }
  return { ...totals, codeRawBytes: totals.staticCodeRawBytes + totals.onMountCodeRawBytes, codeGzipBytes: totals.staticCodeGzipBytes + totals.onMountCodeGzipBytes };
}

/** The chunks the page imports as it starts: each declared name, with what it imports, less what the static closure already holds. */
function walkOnMountEntries(distDirectory, staticWalk, reach, onMountNames) {
  const entries = reach.dynamicTargets.filter((target) => onMountNames.includes(chunkStem(target)));
  const walk = walkImportGraph(distDirectory, entries);
  return { chunks: walk.closure.filter((urlPath) => !staticWalk.closure.includes(urlPath)), missing: walk.missing };
}

/** Every lazy-only library reachable from the page without passing a named gate, with the chain that reaches it. */
function findUngatedLazyLibraries(distDirectory, reach) {
  const reached = [];
  for (const urlPath of reach.closure) {
    const source = readBuiltFile(distDirectory, urlPath)?.toString('utf-8') ?? '';
    for (const { library, definedBy } of LAZY_ONLY_LIBRARIES) {
      if (definedBy.test(source)) reached.push({ library, chunk: urlPath, chain: traceImportChain(reach.importedBy, urlPath) });
    }
  }
  return reached;
}

/** Declared names that match more than one chunk. A name must identify one chunk, or a gate would cover a chunk nobody named. */
function findAmbiguousNames(names, knownChunks) {
  return names
    .map((name) => ({ name, matches: knownChunks.filter((urlPath) => chunkStem(urlPath) === name) }))
    .filter(({ matches }) => matches.length > 1)
    .map(({ name, matches }) => `"${name}" matches ${matches.length} chunks (${matches.join(', ')}); rename a module so the name identifies one chunk`);
}

/**
 * Holds the page to its declaration: every `import()` it can reach is named in exactly one
 * list, and every name in a list is an `import()` the page really makes.
 */
function findLazyDeclarationProblems(page, staticWalk, reach) {
  const declared = LAZY_ENTRY_LISTS.flatMap((list) => (page[list] ?? []).map((name) => ({ name, list })));
  const names = [...new Set(declared.map(({ name }) => name))];
  const importedNames = reach.dynamicTargets.map(chunkStem);
  const undeclared = reach.dynamicTargets.filter((target) => !names.includes(chunkStem(target)) && !staticWalk.closure.includes(target));
  return [
    ...undeclared.map((target) => `dynamic import of ${target} is not declared; add "${chunkStem(target)}" in tool-pages.mjs to exactly one of `
      + 'onMountLazyEntryNames (counted in the code budget), interactionGatedEntryNames (may lead to three.js) or onDemandLazyEntryNames (not counted, must not lead to three.js)'),
    ...names.filter((name) => declared.filter((entry) => entry.name === name).length > 1)
      .map((name) => `"${name}" is declared in more than one list (${declared.filter((entry) => entry.name === name).map(({ list }) => list).join(', ')}); it must be in exactly one`),
    ...declared.filter(({ name }) => !importedNames.includes(name))
      .map(({ name, list }) => `"${name}" in ${list} is not a dynamic import of this page; remove or correct it in tool-pages.mjs`),
    ...findAmbiguousNames(names, [...new Set([...reach.closure, ...reach.dynamicTargets])]),
  ];
}

function findStructureProblems(page, entries) {
  const problems = [];
  if (entries.scriptEntries.length === 0) problems.push('the page names no script entry, so nothing was measured');
  const islandNames = entries.islandComponents.map(chunkStem);
  if (page.islandEntryName != null && !islandNames.includes(page.islandEntryName)) {
    problems.push(`the page has no "${page.islandEntryName}" island (found: ${islandNames.join(', ') || 'none'}); the measurement would be empty`);
  }
  return problems;
}

/**
 * Measures the first load of one built page.
 * @param {string} distDirectory build output directory
 * @param {{ urlPath: string, islandEntryName?: string | null, onMountLazyEntryNames?: readonly string[],
 *   interactionGatedEntryNames?: readonly string[], onDemandLazyEntryNames?: readonly string[] }} page
 */
export function measureFirstLoad(distDirectory, page) {
  const html = readBuiltFile(distDirectory, page.urlPath);
  if (html === null) {
    throw new ToolPageCheckError('page-not-built', `No built page for "${page.urlPath}" under ${distDirectory}. Run "npm run build" first.`);
  }
  const entries = extractPageEntries(html.toString('utf-8'), page.urlPath);
  const staticWalk = walkImportGraph(distDirectory, entries.scriptEntries);
  const reach = walkImportGraph(distDirectory, entries.scriptEntries, { followDynamicImports: true, gatedEntryStems: page.interactionGatedEntryNames ?? [] });
  const onMount = walkOnMountEntries(distDirectory, staticWalk, reach, page.onMountLazyEntryNames ?? []);
  const { files, absentFiles } = measureFiles(distDirectory, [
    [page.urlPath, 'html', PARTS.document],
    ...entries.stylesheets.map((urlPath) => [urlPath, 'stylesheet', PARTS.staticCode]),
    ...staticWalk.closure.map((urlPath) => [urlPath, 'script', PARTS.staticCode]),
    ...onMount.chunks.map((urlPath) => [urlPath, 'script', PARTS.onMountCode]),
  ]);
  return {
    pageUrlPath: page.urlPath,
    files,
    totals: totalBytes(files),
    onDemandEntries: reach.dynamicTargets.filter((target) => (page.onDemandLazyEntryNames ?? []).includes(chunkStem(target))),
    gatedEntries: reach.gatedEntries,
    missing: [...new Set([...staticWalk.missing, ...onMount.missing, ...reach.missing, ...absentFiles])],
    unresolved: staticWalk.unresolved,
    offOrigin: entries.offOrigin,
    structureProblems: [...findStructureProblems(page, entries), ...findLazyDeclarationProblems(page, staticWalk, reach)],
    ungatedLazyLibraries: findUngatedLazyLibraries(distDirectory, reach),
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

/**
 * Returns human-readable reasons the measurement fails; empty means it passes.
 * @param {{ codeGzipBudgetBytes: number | null, documentGzipBudgetBytes: number | null }} budgets null means not enforced
 */
export function findFirstLoadFailures(measurement, budgets = { codeGzipBudgetBytes: null, documentGzipBudgetBytes: null }) {
  return [
    ...measurement.structureProblems,
    ...measurement.missing.map((urlPath) => `referenced file is missing from the build: ${urlPath}`),
    ...measurement.offOrigin.map((reference) => `first load references another origin: ${reference}`),
    ...measurement.ungatedLazyLibraries.map(({ library, chain }) => `${library} can load without the visitor asking for it, through ${chain.join(' -> ')}; `
      + 'it may sit only behind a chunk named in interactionGatedEntryNames'),
    ...findPartFailures('code (stylesheets and scripts)', measurement.totals.codeGzipBytes, budgets.codeGzipBudgetBytes),
    ...findPartFailures('document (HTML with its catalog data)', measurement.totals.documentGzipBytes, budgets.documentGzipBudgetBytes),
  ];
}

/** What a listed page must state outright, so that leaving something out cannot pass as "nothing to check". */
function findMissingDeclarations(page) {
  const problems = [];
  if (typeof page.islandEntryName !== 'string' || page.islandEntryName.trim() === '') problems.push('islandEntryName is not set; name the island the page hydrates in tool-pages.mjs');
  for (const list of LAZY_ENTRY_LISTS) {
    const isListOfNames = Array.isArray(page[list]) && page[list].every((name) => typeof name === 'string' && name !== '');
    if (!isListOfNames) problems.push(`${list} is not a list of chunk names; every listed page declares it in tool-pages.mjs, empty if it has none`);
  }
  return problems;
}

function findMissingBudgets(budgets) {
  return Object.entries(budgets).filter(([, budget]) => budget === null)
    .map(([name]) => `${name} is not set; every listed page needs both budgets in tool-pages.mjs`);
}

/**
 * Measures every listed page against its own budgets.
 * Returns the measurements and one failure per problem, each naming its page; no failures means all pass.
 * An empty list is a failure. So is a listed page that leaves out a budget, its island name or one of its
 * lazy-entry lists; `isAdHoc` lifts that for a one-off measurement from the command line.
 * Throws ToolPageCheckError when a listed page was not built.
 */
export function checkFirstLoadBudgets(distDirectory = DEFAULT_DIST_DIRECTORY, pages = TOOL_PAGES, { isAdHoc = false } = {}) {
  if (pages.length === 0) return { measurements: [], failures: ['no tool pages are listed, so nothing was checked'] };
  const measurements = pages.map((page) => (
    { ...measureFirstLoad(distDirectory, page), budgets: { codeGzipBudgetBytes: page.codeGzipBudgetBytes ?? null, documentGzipBudgetBytes: page.documentGzipBudgetBytes ?? null } }
  ));
  const failures = measurements.flatMap((measurement, index) => [
    ...(isAdHoc ? [] : [...findMissingDeclarations(pages[index]), ...findMissingBudgets(measurement.budgets)]),
    ...findFirstLoadFailures(measurement, measurement.budgets),
  ].map((failure) => `${measurement.pageUrlPath}: ${failure}`));
  return { measurements, failures };
}

function readByteCount(flag, value) {
  const byteCount = Number(value);
  if (!(Number.isInteger(byteCount) && byteCount > 0)) throw new ToolPageCheckError('bad-argument', `${flag} needs a whole number of bytes greater than zero.`);
  return byteCount;
}

function parseArguments(argumentList) {
  const page = { urlPath: null, islandEntryName: null, onMountLazyEntryNames: [], interactionGatedEntryNames: [], onDemandLazyEntryNames: [], codeGzipBudgetBytes: null, documentGzipBudgetBytes: null };
  const options = { distDirectory: DEFAULT_DIST_DIRECTORY, page, isJson: false };
  for (let index = 0; index < argumentList.length; index += 1) {
    const flag = argumentList[index];
    if (flag === '--json') options.isJson = true;
    else if (flag === '--dist') options.distDirectory = argumentList[++index] ?? '';
    else if (flag === '--page') page.urlPath = argumentList[++index] ?? '';
    else if (flag === '--island') page.islandEntryName = argumentList[++index] ?? '';
    else if (Object.hasOwn(LIST_FLAGS, flag)) page[LIST_FLAGS[flag]].push(argumentList[++index] ?? '');
    else if (Object.hasOwn(BUDGET_FLAGS, flag)) page[BUDGET_FLAGS[flag]] = readByteCount(flag, argumentList[++index]);
    else throw new ToolPageCheckError('bad-argument', `Unknown argument "${flag}". See the usage note at the top of this script.`);
  }
  if (options.distDirectory === '') throw new ToolPageCheckError('bad-argument', '--dist needs a directory.');
  if (page.urlPath === null && argumentList.some((flag) => flag !== '--json' && flag !== '--dist' && flag.startsWith('--'))) {
    throw new ToolPageCheckError('bad-argument', 'Page options need --page; listed pages take theirs from tool-pages.mjs.');
  }
  if (page.urlPath !== null && !page.urlPath.startsWith('/')) throw new ToolPageCheckError('bad-argument', '--page needs a site path that starts with "/".');
  return options;
}

function formatLine(rawBytes, gzipBytes, text) {
  return `${String(rawBytes).padStart(10)}${String(gzipBytes).padStart(10)}  ${text}`;
}

function describeBudget(gzipBytes, budgetBytes) {
  return Number.isInteger(budgetBytes) ? `budget ${budgetBytes}, ${budgetBytes - gzipBytes} left` : 'no budget';
}

function formatReport({ pageUrlPath, files, totals, budgets, ungatedLazyLibraries, gatedEntries, onDemandEntries, unresolved }) {
  const lines = [`[measure-lab-first-load] ${pageUrlPath}`, '       raw      gzip  part      kind        file'];
  for (const file of files) lines.push(formatLine(file.rawBytes, file.gzipBytes, `${file.part.padEnd(8)}  ${file.kind.padEnd(10)}  ${file.urlPath}`));
  lines.push(formatLine(totals.staticCodeRawBytes, totals.staticCodeGzipBytes, 'static code: stylesheets and the static import closure'));
  lines.push(formatLine(totals.onMountCodeRawBytes, totals.onMountCodeGzipBytes, 'on-mount code: chunks the page imports as it starts'));
  lines.push(formatLine(totals.codeRawBytes, totals.codeGzipBytes, `code: static plus on-mount (${describeBudget(totals.codeGzipBytes, budgets.codeGzipBudgetBytes)})`));
  lines.push(formatLine(totals.documentRawBytes, totals.documentGzipBytes, `document: HTML with its catalog data (${describeBudget(totals.documentGzipBytes, budgets.documentGzipBudgetBytes)})`));
  lines.push(formatLine(totals.rawBytes, totals.gzipBytes, `total (${files.length} files)`));
  lines.push(`three.js reachable without the visitor asking: ${ungatedLazyLibraries.some(({ library }) => library === 'three.js') ? 'YES' : 'no'}`);
  lines.push(`behind a named interaction gate (${gatedEntries.length}): ${gatedEntries.join(', ') || 'none'}`);
  lines.push(`declared on-demand, not counted (${onDemandEntries.length}): ${onDemandEntries.join(', ') || 'none'}`);
  if (unresolved.length > 0) lines.push(`specifiers that name no file on this site: ${unresolved.join(', ')}`);
  return lines.join('\n');
}

function runMeasurement(argumentList) {
  const { distDirectory, page, isJson } = parseArguments(argumentList);
  const { measurements, failures } = page.urlPath === null
    ? checkFirstLoadBudgets(distDirectory)
    : checkFirstLoadBudgets(distDirectory, [page], { isAdHoc: true });
  process.stdout.write(`${isJson ? JSON.stringify({ measurements, failures }, null, 2) : measurements.map(formatReport).join('\n\n')}\n`);
  for (const failure of failures) process.stderr.write(`[measure-lab-first-load] FAIL: ${failure}\n`);
  if (failures.length > 0) process.exit(1);
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
