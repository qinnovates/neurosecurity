/**
 * Walks the source import graph of a tool page and says whether it can reach
 * anatomy data, the anatomy tables, or anything generated from them.
 *
 * This is the early warning. It reads source with the TypeScript parser
 * (source-imports.mjs) and follows every import, re-export, `import()`,
 * `require()` and literal glob from the page's own file to wherever it leads.
 * What it cannot follow it reports as a problem instead of passing over it: an
 * import with a computed argument, a specifier it cannot resolve to a file, a
 * module loader, a build-time read of a data file.
 *
 * What it cannot see at all: a path assembled at run time and fetched, and an
 * `import()` inside an `.astro` template expression. The post-build check
 * (check-post-build.mjs) reads the built page and every script chunk it can
 * load, and is what catches anatomy data however it got there.
 */

import path from 'node:path';
import { readSourceImports } from './source-imports.mjs';

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
/** A build-time file read may not name anything under these. */
const DATA_PATH_PATTERN = /(^|\/)(datalake|src\/site\/data|docs\/data|atlas-assets)(\/|$)/;

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
/** The data files themselves, and everything generated from the tables: the query-table JSON and the parquet files. */
export const ANATOMY_DATA_FILE_PATTERNS = Object.freeze([
  /^datalake\/qif-anatomy-[a-z-]+\.json$/, /^src\/site\/atlas-assets\/.+\.json$/, /^src\/site\/data\//, /^docs\/data\//, /^datalake\/parquet\//,
]);

export function isAnatomyDataModule(filePath) {
  return ANATOMY_DATA_MODULES.includes(filePath) || ANATOMY_DATA_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

/** The repository path a specifier points at before any extension is tried, or null for a package. */
function toRepositoryPath(specifier, fromFile) {
  const bare = specifier.replace(IMPORT_QUERY_PATTERN, '');
  const alias = SOURCE_ALIASES.find(([prefix]) => bare.startsWith(prefix));
  if (alias !== undefined) return path.posix.normalize(`${alias[1]}${bare.slice(alias[0].length)}`);
  if (bare.startsWith(ROOT_PREFIX)) return path.posix.normalize(bare.slice(ROOT_PREFIX.length));
  if (bare.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), bare));
  return null;
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
  if (base === null) return { kind: 'package' };
  const filePath = listCandidates(base).find((candidate) => exists(candidate));
  return filePath === undefined ? { kind: 'unresolved', tried: base } : { kind: 'file', filePath };
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
  return {
    readsFiles: imports.readsFiles,
    dataPath: imports.literals.find((literal) => DATA_PATH_PATTERN.test(literal)),
    reached: [...resolved.filter((target) => target.kind === 'file').map((target) => target.filePath), ...globbed],
    problems: [
      ...imports.unfollowable,
      ...resolved.filter((target) => target.kind === 'unresolved').map((target) => `an import of "${target.specifier}", which resolves to no file (tried ${target.tried})`),
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
 * @param {(filePath: string) => boolean} isForbidden
 * @returns {string[]} one message per forbidden module reached and per import that cannot be followed; empty when the page is clean
 */
export function findImportProblems(entryFile, tree, isForbidden = isAnatomyDataModule) {
  const cameFrom = new Map([[entryFile, null]]);
  const queue = [entryFile];
  const problems = [];
  const fileReaders = [];
  const dataPaths = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (isForbidden(current)) {
      problems.push(`reaches ${current} through ${traceChain(current, cameFrom).join(' -> ')}`);
      continue;
    }
    if (!CODE_FILE_PATTERN.test(current)) continue;
    const { reached, problems: fileProblems, readsFiles, dataPath } = inspectFile(current, tree);
    problems.push(...fileProblems.map((problem) => `${current} has ${problem}`));
    if (readsFiles) fileReaders.push(current);
    if (dataPath !== undefined) dataPaths.push({ filePath: current, dataPath });
    for (const next of reached.filter((filePath) => !cameFrom.has(filePath))) {
      cameFrom.set(next, current);
      queue.push(next);
    }
  }
  return [...problems, ...findFileReadProblems(fileReaders, dataPaths)];
}

/**
 * A data path and a file-system module anywhere in one page's imports are reported together: the
 * path may be written in the page and read by a helper it calls, so the two need not share a file.
 */
function findFileReadProblems(fileReaders, dataPaths) {
  if (fileReaders.length === 0) return [];
  return dataPaths.map(({ filePath, dataPath }) => `${filePath} names the data path "${dataPath}" and ${fileReaders[0]} reads files; a tool page may not read data files at build time`);
}

/** The source file of a built page: `/atlas/model/` is `src/pages/atlas/model.astro` or `src/pages/atlas/model/index.astro`. */
export function findPageSource(urlPath, exists) {
  const stem = `src/pages${urlPath.replace(/\/$/, '')}`;
  return [`${stem}.astro`, `${stem}/index.astro`].find((candidate) => exists(candidate)) ?? null;
}
