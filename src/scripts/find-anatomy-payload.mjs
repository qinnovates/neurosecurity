#!/usr/bin/env node
/**
 * Finds anatomy data that has been serialised into a built page.
 *
 * The anatomy index and its evidence file are served as their own static
 * files, and a page is built with only the index's path, length and digest.
 * A source scan can be routed around (a relay module, a glob, a file read);
 * this looks at what was actually built. It is meant for the post-build
 * checks, which run after `npm run build`.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/find-anatomy-payload.mjs [built-page.html ...]
 */

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DEFAULT_BUILT_PAGES = ['dist/atlas/model/index.html'];

/**
 * Strings that appear in the anatomy index or its evidence file and nowhere a
 * page has reason to hold them: field names of the index, the data file
 * prefix, and the opening of the index's status sentence. A test asserts each
 * one occurs in the real built files, so the list cannot go stale.
 */
export const ANATOMY_PAYLOAD_MARKERS = Object.freeze([
  'stale_evidence_keys',
  'declared_children',
  'clearance_reason',
  'technique_rationales',
  'qif-anatomy-',
  'AI-drafted and unreviewed unless an item says otherwise',
]);

/** HTML attribute and script encodings a serialised payload can arrive in. */
function decodeMarkup(html) {
  return html
    .replaceAll('&quot;', '"').replaceAll('&#34;', '"').replaceAll('&#x22;', '"')
    .replaceAll('&amp;', '&').replaceAll('\\"', '"').replaceAll('\\u0022', '"');
}

/** The markers found in `html`, in list order. An empty list means the page carries no anatomy payload. */
export function findAnatomyPayload(html) {
  const decoded = decodeMarkup(html);
  return ANATOMY_PAYLOAD_MARKERS.filter((marker) => html.includes(marker) || decoded.includes(marker));
}

function isInvokedDirectly() {
  return process.argv[1] !== undefined && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

function checkBuiltPages(pagePaths) {
  for (const pagePath of pagePaths) {
    const markers = findAnatomyPayload(readFileSync(pagePath, 'utf-8'));
    if (markers.length > 0) {
      throw new Error(`${pagePath} carries anatomy data (found: ${markers.join(', ')}). Pass a page only the index's path, length and sha256.`);
    }
    process.stdout.write(`[find-anatomy-payload] ${pagePath}: no anatomy data in the page.\n`);
  }
}

if (isInvokedDirectly()) {
  try {
    const pagePaths = process.argv.slice(2);
    checkBuiltPages(pagePaths.length > 0 ? pagePaths : DEFAULT_BUILT_PAGES);
  } catch (error) {
    process.stderr.write(`[find-anatomy-payload] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
