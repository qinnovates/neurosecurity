/**
 * Post-build check: every same-site `href` in the built pages points at something in the build.
 *
 * A link is same-site when it starts with one `/`. Its query and fragment are not part of the
 * target. The target is in the build when it is a file, a directory with an index page, or a
 * page file without the trailing slash, which are the three shapes Astro's directory output and
 * the GitHub Pages server agree on.
 *
 * Archived whitepaper versions are frozen snapshots and are not scanned; their text is kept as
 * published, links included.
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveBuiltFile } from './tool-pages.mjs';

const PAGE_FILE_PATTERN = /\.html$/i;
const DIRECTORY_INDEX_FILE = 'index.html';
/** One `/` then anything but a second `/` (that would be protocol-relative) or a closing quote. */
const SAME_SITE_HREF_PATTERN = /\bhref="(\/(?:[^/"][^"]*)?)"/g;

/** URL path prefixes of pages whose links are not checked, with the reason beside each. */
export const FROZEN_PAGE_PREFIXES = [
  '/research/whitepaper/v', // archived whitepaper versions, kept as published
];

/** @returns {string[]} URL paths of every built page, `/` for the root index */
export function listBuiltPages(distDirectory) {
  const root = path.resolve(distDirectory);
  const pages = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(entryPath);
      else if (PAGE_FILE_PATTERN.test(entry.name)) pages.push(toUrlPath(root, entryPath));
    }
  };
  visit(root);
  return pages.sort();
}

function toUrlPath(root, filePath) {
  const relative = path.relative(root, filePath).split(path.sep).join('/');
  return relative.endsWith(`/${DIRECTORY_INDEX_FILE}`) || relative === DIRECTORY_INDEX_FILE
    ? `/${relative.slice(0, -DIRECTORY_INDEX_FILE.length)}`
    : `/${relative}`;
}

/** @returns {string[]} the distinct same-site link targets in one page, query and fragment removed */
export function extractSameSiteLinkTargets(html) {
  const targets = new Set();
  for (const match of html.matchAll(SAME_SITE_HREF_PATTERN)) {
    const target = match[1].split(/[?#]/)[0];
    if (target.length > 0) targets.add(decodeURIComponent(target));
  }
  return [...targets];
}

/** Whether a same-site path is a file, a directory with an index page, or a page without its slash. */
export function isInBuild(distDirectory, target) {
  const candidates = target.endsWith('/')
    ? [target]
    : [target, `${target}/`, `${target}.html`];
  return candidates.some((candidate) => {
    try {
      return fs.existsSync(resolveBuiltFile(distDirectory, candidate));
    } catch {
      return false; // a path that resolves outside the build is not in it
    }
  });
}

export function isFrozenPage(urlPath) {
  return FROZEN_PAGE_PREFIXES.some((prefix) => urlPath.startsWith(prefix));
}

/**
 * @param {string} distDirectory
 * @returns {string[]} one failure per page and target that is not in the build
 */
export function findDeadInternalLinkFailures(distDirectory) {
  const failures = [];
  const verdicts = new Map();
  for (const urlPath of listBuiltPages(distDirectory)) {
    if (isFrozenPage(urlPath)) continue;
    const html = fs.readFileSync(resolveBuiltFile(distDirectory, urlPath), 'utf-8');
    for (const target of extractSameSiteLinkTargets(html)) {
      if (!verdicts.has(target)) verdicts.set(target, isInBuild(distDirectory, target));
      if (!verdicts.get(target)) failures.push(`${urlPath}: links to ${target}, which is not in the build`);
    }
  }
  return failures;
}
