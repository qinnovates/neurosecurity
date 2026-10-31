/**
 * Post-build check: no built page asks the browser to fetch a script, stylesheet, font, frame,
 * icon or preconnect target from another origin.
 *
 * A page that does this sends every visitor's IP address and browser details to that origin
 * before they have chosen anything, and runs code the repository did not review. The one
 * deliberate exception, Google Analytics, is not in any page's HTML: src/site/js/consent.js
 * adds it only after a visitor accepts, so it cannot appear here.
 *
 * Images are not checked: some republished posts still embed images from another host, and the
 * privacy policy says so.
 */

import fs from 'node:fs';
import { listBuiltPages } from './check-internal-links.mjs';
import { resolveBuiltFile } from './tool-pages.mjs';

const OWN_HOSTS = new Set(['qinnovate.com', 'www.qinnovate.com']);
const TAG_PATTERN = /<(script|link|iframe)\b[^>]*>/gi;
const LOADING_RELATIONS = new Set(['stylesheet', 'preload', 'modulepreload', 'preconnect', 'dns-prefetch', 'icon', 'manifest', 'prefetch']);

function attributeOf(tag, name) {
  return new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag)?.[1] ?? null;
}

function foreignHost(reference) {
  if (reference === null || !/^(?:https?:)?\/\//i.test(reference)) return null;
  try {
    const { hostname } = new URL(reference, 'https://qinnovate.com');
    return OWN_HOSTS.has(hostname) ? null : hostname;
  } catch {
    return reference;
  }
}

/** @returns {{ kind: string, host: string }[]} every cross-origin load in one page */
export function findThirdPartyLoads(html) {
  const loads = [];
  for (const [tag, name] of html.matchAll(TAG_PATTERN)) {
    const kind = name.toLowerCase();
    if (kind === 'link') {
      const relations = (attributeOf(tag, 'rel') ?? '').toLowerCase().split(/\s+/);
      if (!relations.some((relation) => LOADING_RELATIONS.has(relation))) continue;
    }
    const host = foreignHost(attributeOf(tag, kind === 'link' ? 'href' : 'src'));
    if (host !== null) loads.push({ kind, host });
  }
  return loads;
}

/** @returns {string[]} one failure per page and third-party origin */
export function findThirdPartyLoadFailures(distDirectory) {
  const failures = [];
  for (const urlPath of listBuiltPages(distDirectory)) {
    const html = fs.readFileSync(resolveBuiltFile(distDirectory, urlPath), 'utf-8');
    const seen = new Set(findThirdPartyLoads(html).map(({ kind, host }) => `${kind} from ${host}`));
    for (const load of seen) failures.push(`${urlPath}: loads a ${load}`);
  }
  return failures;
}
