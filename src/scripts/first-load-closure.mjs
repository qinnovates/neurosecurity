/**
 * Finds what a built page makes the browser download before anything is pressed:
 * the entries its markup names, and the static import closure of its JavaScript.
 *
 * A client-only island has no script tag. Its entry is named by the `component-url` and
 * `renderer-url` attributes on `astro-island`, so the walk starts there and follows static
 * `import` statements through the built chunks. Targets of dynamic `import()` are listed
 * separately. Imports are found by pattern, not by a parser: text inside a string that
 * looks like an import statement is counted too, which can only overstate the result.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { resolveBuiltFile } from './tool-pages.mjs';

const SCRIPT_EXTENSION_PATTERN = /\.m?js$/i;

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

/** Reads one built file by its site path; null when the build has no such file. */
export function readBuiltFile(distDirectory, urlPath) {
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
