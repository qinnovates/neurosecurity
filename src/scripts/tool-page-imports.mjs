/**
 * Walks the source import graph of a tool page and says whether it can reach a
 * module that holds anatomy data or the anatomy tables.
 *
 * A tool page is built with the anatomy index's path, length and digest and
 * nothing else. A scan for import names can be routed around with a relay
 * module, so this follows every import, re-export, `import()` and literal
 * `import.meta.glob` from the page's own source file to wherever it leads.
 *
 * It reads source text only. It cannot follow an `import()` or a glob whose
 * argument is computed, or a file read at build time; the built-page check
 * (find-anatomy-payload.mjs) is the second line for those.
 */

import path from 'node:path';

const SOURCE_ALIASES = [['@shared/', 'datalake/'], ['@/', 'src/']];
const RESOLVED_EXTENSIONS = ['', '.ts', '.tsx', '.astro', '.mjs', '.js', '.json'];
const INDEX_FILES = ['/index.ts', '/index.tsx'];
/** A static import or re-export, with or without a clause. Group 1 is `type` for a type-only statement, group 2 the specifier. */
const STATIC_IMPORT_PATTERN = /(?:^|[\n;{}])\s*(?:import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s*)?['"]([^'"\n]+)['"]/g;
const DYNAMIC_IMPORT_PATTERN = /\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g;
const GLOB_CALL_PATTERN = /import\.meta\.glob(?:<[^>]*>)?\(\s*(\[[^\]]*\]|['"][^'"\n]+['"])/g;
const QUOTED_PATTERN = /['"]([^'"\n]+)['"]/g;
/** Files whose imports are followed. A data file is a leaf. */
const CODE_FILE_PATTERN = /\.(ts|tsx|astro|mjs|js)$/;
const GLOB_SPECIAL_PATTERN = /[.+^${}()|[\]\\]/g;

/**
 * What no tool page's import graph may reach: every module that returns the
 * anatomy tables or loads the anatomy data, and the data files themselves.
 */
export const ANATOMY_DATA_MODULES = Object.freeze([
  'src/lib/kql-tables.ts',
  'src/lib/anatomy/load-anatomy-tables.ts',
  'src/lib/anatomy/anatomy-tables.ts',
  'src/lib/anatomy/source-table.ts',
  'src/lib/anatomy/structure-table.ts',
  'src/lib/anatomy/crosswalk-table.ts',
  'src/lib/anatomy/technique-tables.ts',
  'src/lib/anatomy/term-roles.ts',
  'src/components/atlas-scene/load-anatomy-data.ts',
  'datalake/scripts/technique-region-curation.json',
]);
export const ANATOMY_DATA_FILE_PATTERNS = Object.freeze([/^datalake\/qif-anatomy-[a-z-]+\.json$/, /^src\/site\/atlas-assets\/.+\.json$/]);

export function isAnatomyDataModule(filePath) {
  return ANATOMY_DATA_MODULES.includes(filePath) || ANATOMY_DATA_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * A glob as a pattern over repository paths: `**` crosses folders, `*` does not.
 * `/src/x/*.json` is anchored at the repository root; `./x/*.json` and `../x/*.json` at the importing file's folder.
 */
function globToPattern(glob, fromFile) {
  const anchored = glob.startsWith('/') ? glob.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), glob));
  const body = anchored.replace(GLOB_SPECIAL_PATTERN, '\\$&').replaceAll('**', '\u0000').replaceAll('*', '[^/]*').replaceAll('\u0000', '.*');
  return new RegExp(`^${body}$`);
}

/**
 * @param {string} sourceText
 * @returns {{ specifiers: string[], globs: string[] }} what the file imports at run or build time; type-only statements are left out
 */
export function listImports(sourceText) {
  const specifiers = [...sourceText.matchAll(STATIC_IMPORT_PATTERN)].filter((match) => match[1] === undefined).map((match) => match[2]);
  const dynamic = [...sourceText.matchAll(DYNAMIC_IMPORT_PATTERN)].map((match) => match[1]);
  const globs = [...sourceText.matchAll(GLOB_CALL_PATTERN)].flatMap((match) => [...match[1].matchAll(QUOTED_PATTERN)].map((quoted) => quoted[1]));
  return { specifiers: [...specifiers, ...dynamic], globs };
}

/**
 * @param {string} specifier as written in the importing file
 * @param {string} fromFile repository path of the importing file
 * @param {(filePath: string) => boolean} exists
 * @returns {string | null} the repository path imported, or null for a package or a file that is not there
 */
export function resolveImport(specifier, fromFile, exists) {
  const alias = SOURCE_ALIASES.find(([prefix]) => specifier.startsWith(prefix));
  const isRelative = specifier.startsWith('.');
  if (alias === undefined && !isRelative) return null;
  const base = alias === undefined
    ? path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier))
    : `${alias[1]}${specifier.slice(alias[0].length)}`;
  return [...RESOLVED_EXTENSIONS, ...INDEX_FILES].map((suffix) => `${base}${suffix}`).find((candidate) => exists(candidate)) ?? null;
}

/**
 * @typedef {object} SourceTree
 * @property {(filePath: string) => boolean} exists
 * @property {(filePath: string) => string} read
 * @property {() => string[]} listFiles every repository path a glob could match
 */

function listReached(filePath, tree) {
  const { specifiers, globs } = listImports(tree.read(filePath));
  const imported = specifiers.map((specifier) => resolveImport(specifier, filePath, tree.exists)).filter((resolved) => resolved !== null);
  const globbed = globs.flatMap((glob) => tree.listFiles().filter((candidate) => globToPattern(glob, filePath).test(candidate)));
  return [...imported, ...globbed];
}

/**
 * @param {string} entryFile repository path of a page's source file
 * @param {SourceTree} tree
 * @param {(filePath: string) => boolean} isForbidden
 * @returns {string[] | null} the import chain from the entry to the first forbidden module found, or null when none is reachable
 */
export function findForbiddenImportChain(entryFile, tree, isForbidden = isAnatomyDataModule) {
  const cameFrom = new Map([[entryFile, null]]);
  const queue = [entryFile];
  while (queue.length > 0) {
    const current = queue.shift();
    if (isForbidden(current)) return traceChain(current, cameFrom);
    if (!CODE_FILE_PATTERN.test(current)) continue;
    for (const next of listReached(current, tree)) {
      if (cameFrom.has(next)) continue;
      cameFrom.set(next, current);
      queue.push(next);
    }
  }
  return null;
}

function traceChain(filePath, cameFrom) {
  const chain = [];
  for (let current = filePath; current !== null; current = cameFrom.get(current) ?? null) chain.unshift(current);
  return chain;
}

/** The source file of a built page: `/atlas/model/` is `src/pages/atlas/model.astro` or `src/pages/atlas/model/index.astro`. */
export function findPageSource(urlPath, exists) {
  const stem = `src/pages${urlPath.replace(/\/$/, '')}`;
  return [`${stem}.astro`, `${stem}/index.astro`].find((candidate) => exists(candidate)) ?? null;
}
