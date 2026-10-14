/**
 * Walks the source import graph of a tool page and says whether it can reach
 * anatomy data, the anatomy tables, or anything generated from them.
 *
 * The aim is to catch an accident: an import, somewhere in a page's closure,
 * that would build the anatomy tables or data files into the page. It is not
 * meant to stop an author who sets out to get round it.
 *
 * It reads source with the TypeScript parser (source-imports.mjs) and follows
 * every import, re-export, `import()`, `require()`, `new URL(..., import.meta.url)`
 * and literal glob from the page's own file to wherever it leads. What it
 * cannot follow it reports instead of passing over: an import with a computed
 * argument, a relative or aliased specifier that resolves to no file, a module
 * loader, and a file that reads files or runs commands at build time.
 *
 * Two rules, by what the page is for (`scriptsMayCarryAnatomy` in tool-pages.mjs):
 *   every page          may not import a file generated from the tables;
 *   a page that is not  may not reach the anatomy loaders, builders or data
 *   an anatomy page     files either.
 *
 * What it cannot see: a path fetched at run time, an `import()` inside an
 * `.astro` template expression, `eval`, and `process.getBuiltinModule`. The
 * post-build check reads what was built and covers the first two.
 */

import path from 'node:path';
import { readModuleStatements, readSourceImports } from './source-imports.mjs';

const SOURCE_ALIASES = [['@shared/', 'datalake/'], ['@/', 'src/']];
const ROOT_PREFIX = '/';
/** Vite import queries such as `?raw` and `?url`: the file is imported whatever follows the `?`. */
const IMPORT_QUERY_PATTERN = /[?#].*$/;
const ADDED_EXTENSIONS = ['', '.ts', '.tsx', '.mts', '.cts', '.astro', '.mjs', '.cjs', '.js', '.jsx', '.json'];
const INDEX_STEMS = ['/index.ts', '/index.tsx', '/index.mts', '/index.mjs', '/index.js', '/index.astro'];
/** A specifier may name the file a TypeScript source compiles to: `./relay.js` for `relay.ts`. */
const COMPILED_EXTENSIONS = [['.js', ['.ts', '.tsx']], ['.jsx', ['.tsx']], ['.mjs', ['.mts']], ['.cjs', ['.cts']]];
/** Files whose imports are followed. Anything else (a data file, a stylesheet, an image) is a leaf. */
const CODE_FILE_PATTERN = /\.([cm]?[jt]sx?|astro)$/;
const GLOB_SPECIAL_PATTERN = /[.+^${}()|[\]\\]/g;
/**
 * Files in a tool page's imports that may read files or run commands at build time, each with the reason.
 * None today: no file the Lab page reaches imports a file-system or child-process module.
 */
export const BUILD_TIME_FILE_ACCESS_ALLOWED = Object.freeze([]);

/**
 * What no tool page's import graph may reach: every module that loads the
 * anatomy data, builds the index or the tables from it, or describes them.
 */
export const ANATOMY_DATA_MODULES = Object.freeze([
  'src/lib/kql-tables.ts',
  'src/lib/anatomy/load-anatomy-tables.ts',
  'src/lib/anatomy/anatomy-tables.ts',
  'src/lib/anatomy/anatomy-inputs.ts',
  'src/lib/anatomy/build-anatomy-index.ts',
  'src/lib/anatomy/build-anatomy-evidence.ts',
  'src/lib/anatomy/describe-tables.ts',
  'src/lib/anatomy/source-table.ts',
  'src/lib/anatomy/structure-table.ts',
  'src/lib/anatomy/crosswalk-table.ts',
  'src/lib/anatomy/technique-tables.ts',
  'src/lib/anatomy/term-roles.ts',
  'src/components/atlas-scene/load-anatomy-data.ts',
  'datalake/scripts/technique-region-curation.json',
]);
/** The data files themselves: every `qif-anatomy-*.json` and the pipeline's manifest and label tables. */
export const ANATOMY_DATA_FILE_PATTERNS = Object.freeze([/^datalake\/qif-anatomy-[a-z0-9-]+\.json$/, /^src\/site\/atlas-assets\/.+\.json$/]);
/** Everything generated from the tables: the query-table JSON and the parquet files. No page may import these. */
export const GENERATED_TABLE_FILE_PATTERNS = Object.freeze([/^src\/site\/data\//, /^docs\/data\//, /^datalake\/parquet\//]);

/**
 * The one build-time module a page that is not an anatomy page may reach although it leads to the anatomy loader.
 * It exports the anatomy index's path, length and digest and nothing else, so that the 3D view a page mounts can refuse
 * an index from another build (a page without the pin draws nothing).
 *
 * The walk does not follow it, on two conditions, both checked here:
 * - the file importing it is one of INDEX_PIN_IMPORTERS, the server-side element that writes the pin into the page. Any
 *   other importer (a client component above all) is walked into the module like any import, and so reaches the loader;
 * - the module is, statement for statement, what INDEX_PIN_STATEMENTS says. One more import or export, a different
 *   value, or any other statement, however it is laid out, is a problem.
 * What a page was actually built with is checked on the built files all the same (find-anatomy-payload.mjs): its HTML
 * for anatomy rows, and every script it can load for the tables and data files.
 */
export const INDEX_PIN_MODULES = Object.freeze(['src/components/atlas-scene/build-index-pin.ts']);
/** The only files whose import of a pin module is not followed. Each renders on the server and ships no script. */
export const INDEX_PIN_IMPORTERS = Object.freeze(['src/components/atlas-scene/AtlasIndexPin.astro']);
/** The pin module's one way to the loader. Named apart so that this file does not itself read as an importer of the loader. */
const LOADER_SPECIFIER = './load-anatomy-data';
/** Every top-level statement a pin module holds, as readModuleStatements spells them. */
export const INDEX_PIN_STATEMENTS = Object.freeze([
  "import type { PinnedFile } from '@/lib/anatomy/anatomy-index-types'",
  `import { loadAnatomyBundle } from '${LOADER_SPECIFIER}'`,
  'export const INDEX_PIN = loadAnatomyBundle().indexPin',
]);

/**
 * @param {string} filePath a pin module
 * @param {string} sourceText
 * @returns {string[]} empty when the module is exactly the pin; otherwise one message naming what it holds instead
 */
export function findIndexPinProblems(filePath, sourceText) {
  const found = readModuleStatements(filePath, sourceText);
  if (found.length === INDEX_PIN_STATEMENTS.length && found.every((statement, position) => statement === INDEX_PIN_STATEMENTS[position])) return [];
  const added = found.filter((statement) => !INDEX_PIN_STATEMENTS.includes(statement));
  const missing = INDEX_PIN_STATEMENTS.filter((statement) => !found.includes(statement));
  const difference = [...added.map((statement) => `it also holds "${statement}"`), ...missing.map((statement) => `it lacks "${statement}"`)].join('; ') || 'its statements are repeated or out of order';
  return [`${filePath} must stay a bare pin (two imports and the one export of the index's path, length and digest), because the import walk does not follow it: ${difference}. Put anything else in another module.`];
}

export function isGeneratedTableFile(filePath) {
  return GENERATED_TABLE_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

/** What a page that is not an anatomy page may not reach. */
export function isAnatomyDataModule(filePath) {
  return ANATOMY_DATA_MODULES.includes(filePath) || ANATOMY_DATA_FILE_PATTERNS.some((pattern) => pattern.test(filePath)) || isGeneratedTableFile(filePath);
}

/** The repository path a relative, aliased or root-absolute specifier points at before any extension is tried, or null for a bare one. */
function toRepositoryPath(specifier, fromFile) {
  const bare = specifier.replace(IMPORT_QUERY_PATTERN, '');
  const alias = SOURCE_ALIASES.find(([prefix]) => bare.startsWith(prefix));
  if (alias !== undefined) return path.posix.normalize(`${alias[1]}${bare.slice(alias[0].length)}`);
  if (bare.startsWith(ROOT_PREFIX)) return path.posix.normalize(bare.slice(ROOT_PREFIX.length));
  if (bare.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), bare));
  return null;
}

/** A bare specifier read from the repository root, which is how `src/lib/x` resolves under the project's `baseUrl`. */
function toRootPath(specifier) {
  return path.posix.normalize(specifier.replace(IMPORT_QUERY_PATTERN, ''));
}

function listCandidates(base) {
  const compiled = COMPILED_EXTENSIONS.flatMap(([extension, sources]) => (base.endsWith(extension) ? sources.map((source) => `${base.slice(0, -extension.length)}${source}`) : []));
  return [...ADDED_EXTENSIONS.map((extension) => `${base}${extension}`), ...compiled, ...INDEX_STEMS.map((stem) => `${base}${stem}`)];
}

/**
 * @param {string} specifier as written in the importing file
 * @param {string} fromFile repository path of the importing file
 * @param {(filePath: string) => boolean} exists
 * @returns {{ kind: 'package' } | { kind: 'file', filePath: string } | { kind: 'unresolved', tried: string }}
 */
export function resolveImport(specifier, fromFile, exists) {
  const base = toRepositoryPath(specifier, fromFile);
  const filePath = listCandidates(base ?? toRootPath(specifier)).find((candidate) => exists(candidate));
  if (filePath !== undefined) return { kind: 'file', filePath };
  return base === null ? { kind: 'package' } : { kind: 'unresolved', tried: base };
}

/**
 * A glob as a pattern over repository paths: `**` crosses folders, `*` does not.
 * `/src/x/*.json` and an aliased pattern are anchored at the repository root; `./x/*.json` at the importing file's folder.
 */
function globToPattern(glob, fromFile) {
  const anchored = toRepositoryPath(glob, fromFile) ?? glob;
  const body = anchored.replace(GLOB_SPECIAL_PATTERN, '\\$&').replaceAll('**', '\u0000').replaceAll('*', '[^/]*').replaceAll('\u0000', '.*');
  return new RegExp(`^${body}$`);
}

/**
 * @typedef {object} SourceTree
 * @property {(filePath: string) => boolean} exists
 * @property {(filePath: string) => string} read
 * @property {() => string[]} listFiles every repository path a glob could match
 */

/** Everything one file leads to, and everything about it that cannot be followed or may not be done. */
function inspectFile(filePath, tree) {
  const imports = readSourceImports(filePath, tree.read(filePath));
  const resolved = imports.specifiers.map((specifier) => ({ specifier, ...resolveImport(specifier, filePath, tree.exists) }));
  const globbed = imports.globs.flatMap((glob) => tree.listFiles().filter((candidate) => globToPattern(glob, filePath).test(candidate)));
  const fileAccess = BUILD_TIME_FILE_ACCESS_ALLOWED.includes(filePath) ? [] : imports.fileAccessModules;
  return {
    reached: [...resolved.filter((target) => target.kind === 'file').map((target) => target.filePath), ...globbed],
    problems: [
      ...imports.unfollowable.map((what) => `has ${what}`),
      ...resolved.filter((target) => target.kind === 'unresolved').map((target) => `has an import of "${target.specifier}", which resolves to no file (tried ${target.tried})`),
      ...fileAccess.map((moduleName) => `imports ${moduleName}; a file in a tool page's imports may not read files or run commands at build time unless it is listed in BUILD_TIME_FILE_ACCESS_ALLOWED with the reason`),
    ],
  };
}

function traceChain(filePath, cameFrom) {
  const chain = [];
  for (let current = filePath; current !== null; current = cameFrom.get(current) ?? null) chain.unshift(current);
  return chain;
}

/**
 * @param {string} entryFile repository path of a page's source file
 * @param {SourceTree} tree
 * @param {{ scriptsMayCarryAnatomy?: boolean }} page the page's entry in tool-pages.mjs
 * @returns {string[]} one message per forbidden file reached and per import that cannot be followed; empty when the page is clean
 */
export function findImportProblems(entryFile, tree, { scriptsMayCarryAnatomy = false } = {}) {
  const isForbidden = scriptsMayCarryAnatomy ? isGeneratedTableFile : isAnatomyDataModule;
  /** The one edge the walk does not follow: the pin element's import of the pin module, on a page that may hold no anatomy. */
  const isPinEdge = (importer, imported) => !scriptsMayCarryAnatomy && INDEX_PIN_MODULES.includes(imported) && INDEX_PIN_IMPORTERS.includes(importer);
  const cameFrom = new Map([[entryFile, null]]);
  const queue = [entryFile];
  const problems = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (isForbidden(current)) {
      problems.push(`reaches ${current} through ${traceChain(current, cameFrom).join(' -> ')}`);
      continue;
    }
    if (!CODE_FILE_PATTERN.test(current)) continue;
    const { reached, problems: fileProblems } = inspectFile(current, tree);
    problems.push(...fileProblems.map((problem) => `${current} ${problem}`));
    // Not followed, so held to its exact statements instead. Any other importer of the same module falls through to the walk below.
    for (const pinModule of new Set(reached.filter((filePath) => isPinEdge(current, filePath)))) problems.push(...findIndexPinProblems(pinModule, tree.read(pinModule)));
    for (const next of reached.filter((filePath) => !cameFrom.has(filePath) && !isPinEdge(current, filePath))) {
      cameFrom.set(next, current);
      queue.push(next);
    }
  }
  return problems;
}

/** The source file of a built page: `/atlas/model/` is `src/pages/atlas/model.astro` or `src/pages/atlas/model/index.astro`. */
export function findPageSource(urlPath, exists) {
  const stem = `src/pages${urlPath.replace(/\/$/, '')}`;
  return [`${stem}.astro`, `${stem}/index.astro`].find((candidate) => exists(candidate)) ?? null;
}
