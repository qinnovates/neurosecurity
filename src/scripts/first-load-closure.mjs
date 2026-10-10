/**
 * Finds what a built page makes the browser download: the entries its markup names, and
 * the import graph of its JavaScript.
 *
 * A client-only island has no script tag. Its entry is named by the `component-url` and
 * `renderer-url` attributes on `astro-island`, so the walk starts there and follows
 * `import` statements through the built chunks. Static imports are always followed.
 * Dynamic `import()` targets are followed only when asked, and never past a named gate.
 *
 * Imports are found by pattern, not by a parser: text inside a string that looks like an
 * import is followed too, which can only overstate what a page reaches.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TAG_ATTRIBUTES_SOURCE, parseAttributes } from './built-html.mjs';
import { resolveBuiltFile } from './tool-pages.mjs';

const SCRIPT_EXTENSION_PATTERN = /\.m?js$/i;
/** `Name.<8-character build hash>.js`, the shape of a built chunk's file name. */
const HASHED_CHUNK_PATTERN = /^(.+)\.[A-Za-z0-9_-]{8}\.m?js$/;

/** One import clause: names, `*`, commas, and a braced list whose names may be quoted strings. */
const IMPORT_CLAUSE = String.raw`(?:[\w$*\s,]|\{(?:[^{}"'\`]|"[^"]*"|'[^']*')*\})+?`;
/** `import x from "./a.js"`, `import "./a.js"`, `export { x } from "./a.js"`, `export * from "./a.js"`. */
const STATIC_IMPORT_PATTERN = new RegExp(String.raw`(?<![\w$.])(?:import|export)\s*(?:${IMPORT_CLAUSE}\s*from\s*)?["']([^"']+)["']`, 'g');
/** `import("./a.js")` with a literal target. */
const DYNAMIC_IMPORT_PATTERN = /(?<![\w$.])import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

const TAG_PATTERN = new RegExp(String.raw`<(link|script|astro-island)\b${TAG_ATTRIBUTES_SOURCE}>`, 'gi');
const INLINE_MODULE_SCRIPT_PATTERN = new RegExp(String.raw`<script\b${TAG_ATTRIBUTES_SOURCE}>([\s\S]*?)<\/script\b[^>]*>`, 'gi');
const ISLAND_COMPONENT_ATTRIBUTE = 'component-url';
const ISLAND_ENTRY_ATTRIBUTES = [ISLAND_COMPONENT_ATTRIBUTE, 'renderer-url', 'before-hydration-url'];
const OFF_ORIGIN_URL_PATTERN = /^\s*([a-z][a-z0-9+.-]*:|\/\/)/i;

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

/** The name a chunk was built under, without its directory, build hash or extension. */
export function chunkStem(urlPath) {
  const fileName = path.posix.basename(urlPath);
  return fileName.match(HASHED_CHUNK_PATTERN)?.[1] ?? fileName.replace(SCRIPT_EXTENSION_PATTERN, '');
}

/**
 * Resolves a specifier found in `fromUrlPath` to a site-root URL path.
 * Returns null for anything that is not a file on this site (bare names, other origins).
 */
export function resolveSiteUrlPath(fromUrlPath, specifier) {
  if (OFF_ORIGIN_URL_PATTERN.test(specifier)) return null;
  if (!specifier.startsWith('/') && !specifier.startsWith('.')) return null;
  const withoutQuery = specifier.split(/[?#]/)[0];
  const baseDirectory = fromUrlPath.endsWith('/') ? fromUrlPath : path.posix.dirname(fromUrlPath);
  return path.posix.resolve(baseDirectory, withoutQuery);
}

/** Reads one built file by its site path; null when the build has no such file. */
export function readBuiltFile(distDirectory, urlPath) {
  try {
    return readFileSync(resolveBuiltFile(distDirectory, urlPath));
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'EISDIR') return null;
    throw error;
  }
}

function resolveTargets(urlPath, specifiers, unresolved) {
  const targets = [];
  for (const specifier of specifiers) {
    const target = resolveSiteUrlPath(urlPath, specifier);
    if (target === null) unresolved?.add(specifier);
    else targets.push(target);
  }
  return targets;
}

/**
 * Walks the import graph from the entry chunks (site-root URL paths).
 *
 * @param {string} distDirectory build output directory
 * @param {readonly string[]} entryUrlPaths chunks the walk starts from
 * @param {{ followDynamicImports?: boolean, gatedEntryStems?: readonly string[] }} [options]
 *   followDynamicImports: also walk into `import()` targets;
 *   gatedEntryStems: chunk names a dynamic import may name without the walk entering them.
 * @returns {{ closure: string[], lazyTargets: string[], gatedEntries: string[], dynamicTargets: string[],
 *   missing: string[], unresolved: string[], importedBy: Map<string, string> }}
 *   closure: every chunk reached, in discovery order; lazyTargets: dynamic targets not reached;
 *   gatedEntries: dynamic targets the walk stopped at; dynamicTargets: every `import()` target seen,
 *   reached or not; importedBy: the chunk that first led to each chunk.
 */
export function walkImportGraph(distDirectory, entryUrlPaths, { followDynamicImports = false, gatedEntryStems = [] } = {}) {
  const closure = new Set();
  const found = { lazyTargets: new Set(), gatedEntries: new Set(), dynamicTargets: new Set(), missing: new Set(), unresolved: new Set() };
  const importedBy = new Map();
  const pending = entryUrlPaths.map((urlPath) => [urlPath, null]);

  while (pending.length > 0) {
    const [urlPath, importer] = pending.shift();
    if (closure.has(urlPath) || found.missing.has(urlPath)) continue;
    const contents = readBuiltFile(distDirectory, urlPath);
    if (contents === null) {
      found.missing.add(urlPath);
      continue;
    }
    closure.add(urlPath);
    if (importer !== null) importedBy.set(urlPath, importer);
    if (!SCRIPT_EXTENSION_PATTERN.test(urlPath)) continue;
    const source = contents.toString('utf-8');
    for (const target of resolveTargets(urlPath, extractStaticImportSpecifiers(source), found.unresolved)) pending.push([target, urlPath]);
    for (const target of resolveTargets(urlPath, extractDynamicImportSpecifiers(source), null)) {
      found.dynamicTargets.add(target);
      if (gatedEntryStems.includes(chunkStem(target))) found.gatedEntries.add(target);
      else if (followDynamicImports) pending.push([target, urlPath]);
      else found.lazyTargets.add(target);
    }
  }
  return summariseWalk(closure, found, importedBy);
}

function summariseWalk(closure, found, importedBy) {
  const notReached = (targets) => [...targets].filter((target) => !closure.has(target)).sort();
  return {
    closure: [...closure],
    lazyTargets: notReached(found.lazyTargets),
    gatedEntries: notReached(found.gatedEntries),
    dynamicTargets: [...found.dynamicTargets].sort(),
    missing: [...found.missing].sort(),
    unresolved: [...found.unresolved].sort(),
    importedBy,
  };
}

/** The static import closure of the entry chunks: what loads before any `import()` runs. */
export function walkStaticImportClosure(distDirectory, entryUrlPaths) {
  return walkImportGraph(distDirectory, entryUrlPaths);
}

/** The chain of chunks from an entry to `urlPath`, as the walk first found it. */
export function traceImportChain(importedBy, urlPath) {
  const chain = [urlPath];
  while (importedBy.has(chain[0]) && chain.length <= importedBy.size) chain.unshift(importedBy.get(chain[0]));
  return chain;
}

function addEntry(entries, kind, pageUrlPath, reference) {
  if (reference === undefined || reference === '') return;
  const target = resolveSiteUrlPath(pageUrlPath, reference.startsWith('.') || reference.startsWith('/') ? reference : `./${reference}`);
  if (OFF_ORIGIN_URL_PATTERN.test(reference) || target === null) entries.offOrigin.push(reference);
  else entries[kind].push(target);
}

function collectTagEntries(html, pageUrlPath, entries) {
  for (const [, tagName, attributeText] of html.matchAll(TAG_PATTERN)) {
    const tag = tagName.toLowerCase();
    const attributes = parseAttributes(attributeText);
    const relations = (attributes.get('rel') ?? '').toLowerCase().split(/\s+/);
    if (tag === 'link' && relations.includes('stylesheet')) addEntry(entries, 'stylesheets', pageUrlPath, attributes.get('href'));
    if (tag === 'link' && relations.includes('modulepreload')) addEntry(entries, 'scriptEntries', pageUrlPath, attributes.get('href'));
    if (tag === 'script') addEntry(entries, 'scriptEntries', pageUrlPath, attributes.get('src'));
    if (tag !== 'astro-island') continue;
    for (const name of ISLAND_ENTRY_ATTRIBUTES) addEntry(entries, 'scriptEntries', pageUrlPath, attributes.get(name));
    addEntry(entries, 'islandComponents', pageUrlPath, attributes.get(ISLAND_COMPONENT_ATTRIBUTE));
  }
}

function collectInlineModuleEntries(html, pageUrlPath, entries) {
  for (const [, attributeText, body] of html.matchAll(INLINE_MODULE_SCRIPT_PATTERN)) {
    const attributes = parseAttributes(attributeText);
    if ((attributes.get('type') ?? '').toLowerCase() !== 'module' || attributes.has('src')) continue;
    for (const specifier of extractStaticImportSpecifiers(body)) {
      const target = resolveSiteUrlPath(pageUrlPath, specifier);
      if (target === null) entries.offOrigin.push(specifier);
      else entries.scriptEntries.push(target);
    }
  }
}

/**
 * Lists what the page's own markup makes the browser fetch up front.
 *
 * @returns {{ stylesheets: string[], scriptEntries: string[], islandComponents: string[], offOrigin: string[] }}
 */
export function extractPageEntries(html, pageUrlPath) {
  const entries = { stylesheets: [], scriptEntries: [], islandComponents: [], offOrigin: [] };
  collectTagEntries(html, pageUrlPath, entries);
  collectInlineModuleEntries(html, pageUrlPath, entries);
  return Object.fromEntries(Object.entries(entries).map(([kind, values]) => [kind, [...new Set(values)]]));
}
