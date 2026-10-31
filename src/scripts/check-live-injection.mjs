#!/usr/bin/env node
/**
 * Fails when the live HTML carries a Cloudflare Web Analytics tag that the edge injected.
 *
 * The consent banner promises that analytics is not requested until a visitor accepts, and
 * src/site/js/consent.js adds the script only then. Cloudflare's automatic setup would add the
 * same script to every page before any choice, and the Content-Security-Policy cannot tell the
 * two copies apart because they share a host. The setting lives in the Cloudflare dashboard, so
 * this check looks at what the live site really sends. Cloudflare injects only into requests that
 * look like a browser, so the requests here send browser headers.
 *
 * Usage:
 *   node src/scripts/check-live-injection.mjs [url ...]   # default: three pages on https://qinnovate.com
 */

import { pathToFileURL } from 'node:url';

export const LIVE_ORIGIN = 'https://qinnovate.com';
export const DEFAULT_PATHS = ['/', '/privacy/', '/atlas/explorer/'];
const REQUEST_TIMEOUT_MS = 15_000;
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Headers that make the edge treat the request as a page view in a browser, so it injects when it is set to. */
export const BROWSER_HEADERS = Object.freeze({
  'user-agent': BROWSER_USER_AGENT,
  accept: 'text/html,application/xhtml+xml',
  'accept-language': 'en-US,en;q=0.9',
  'sec-fetch-mode': 'navigate',
});

const INJECTED_TAG_PATTERNS = [/data-cf-beacon\s*=/i, /<script\b[^>]*\bsrc\s*=\s*["']?https?:\/\/static\.cloudflareinsights\.com\//i];

/** @param {string} html */
export function hasInjectedAnalytics(html) {
  return INJECTED_TAG_PATTERNS.some((pattern) => pattern.test(html));
}

/**
 * @param {readonly string[]} urls
 * @param {typeof fetch} fetchPage
 * @returns {Promise<string[]>} one sentence per problem; empty when the live pages are clean
 */
export async function checkLiveInjection(urls, fetchPage = fetch) {
  const failures = [];
  for (const url of urls) {
    const response = await fetchPage(url, { headers: BROWSER_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
      failures.push(`${url} answered ${response.status}; the page cannot be checked`);
      continue;
    }
    if (hasInjectedAnalytics(await response.text())) {
      failures.push(`${url} carries a Cloudflare analytics tag in its HTML that the edge injected before any consent choice; the page policy blocks that copy and logs a violation on every load, so switch off automatic setup under Web Analytics in the Cloudflare dashboard`);
    }
  }
  return failures;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const urls = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_PATHS.map((path) => `${LIVE_ORIGIN}${path}`);
  const failures = await checkLiveInjection(urls);
  for (const failure of failures) console.log(`[live-injection] FAIL  ${failure}`);
  if (failures.length === 0) console.log(`[live-injection] ok    no injected analytics tag on ${urls.length} live pages`);
  process.exit(failures.length === 0 ? 0 : 1);
}
