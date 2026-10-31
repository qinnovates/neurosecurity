#!/usr/bin/env node
/**
 * Fails when Cloudflare's analytics script could run on a live page before any consent choice.
 *
 * The consent banner promises that analytics is not requested until a visitor accepts, and
 * src/site/js/consent.js adds the script only then. Cloudflare's automatic setup adds the same
 * script to every page at the edge, from /beacon.min.js/<version>. The setting lives in the
 * Cloudflare dashboard, so this check looks at what the live site really sends: the HTML, the
 * Content-Security-Policy header and any policy in a meta tag. An injected tag that every policy
 * blocks is only a note, because the browser refuses to run it; one that the policies allow is a
 * failure. Cloudflare injects only into requests that look like a browser, so the requests here
 * send browser headers.
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
const ANALYTICS_SCRIPT_TAG = /<script\b[^>]*>/gi;
const META_POLICY_TAG = /<meta\b[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi;

/** @param {string} html */
export function hasInjectedAnalytics(html) {
  return INJECTED_TAG_PATTERNS.some((pattern) => pattern.test(html));
}

/** The src of each Cloudflare analytics script tag in the HTML; an empty string for a tag with no src. */
export function findAnalyticsScriptSources(html) {
  const sources = [];
  for (const [tag] of html.matchAll(ANALYTICS_SCRIPT_TAG)) {
    const src = tag.match(/\bsrc\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? '';
    if (/static\.cloudflareinsights\.com/i.test(src) || /data-cf-beacon\s*=/i.test(tag)) sources.push(src);
  }
  return sources;
}

/** Every Content-Security-Policy that applies to the page: the header and each meta tag. */
export function collectPolicies(html, headerValue) {
  const policies = headerValue ? [headerValue] : [];
  for (const [tag] of html.matchAll(META_POLICY_TAG)) {
    const content = tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1];
    if (content) policies.push(content.replaceAll('&#39;', "'").replaceAll('&quot;', '"'));
  }
  return policies;
}

function sourcesFor(policy, directiveName) {
  const directives = new Map(policy.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const [name, ...sources] = part.split(/\s+/);
    return [name.toLowerCase(), sources];
  }));
  return directives.get(directiveName) ?? directives.get('default-src') ?? null;
}

/** A host source matches any path; a path ending in "/" matches by prefix; any other path matches that path only. */
function matchesSource(src, source) {
  if (/^https?:$/i.test(source)) return new URL(src).protocol === source.toLowerCase();
  if (!/^https?:\/\//i.test(source)) return false;
  const wanted = new URL(src);
  const allowed = new URL(source);
  if (wanted.protocol !== allowed.protocol || wanted.host !== allowed.host) return false;
  if (allowed.pathname === '/' && !/^https?:\/\/[^/]+\/./.test(source)) return true;
  return allowed.pathname.endsWith('/') ? wanted.pathname.startsWith(allowed.pathname) : wanted.pathname === allowed.pathname;
}

/** @returns {boolean} whether the policy lets a script with this address load; a policy with no script rule allows it */
export function policyAllowsScript(src, policy) {
  const sources = sourcesFor(policy, 'script-src');
  if (sources === null) return true;
  return sources.some((source) => matchesSource(src, source));
}

/**
 * @param {readonly string[]} urls
 * @param {typeof fetch} fetchPage
 * @returns {Promise<{ failures: string[], notes: string[] }>}
 */
export async function checkLiveInjection(urls, fetchPage = fetch) {
  const failures = [];
  const notes = [];
  for (const url of urls) {
    const response = await fetchPage(url, { headers: BROWSER_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
      failures.push(`${url} answered ${response.status}; the page cannot be checked`);
      continue;
    }
    const html = await response.text();
    const sources = findAnalyticsScriptSources(html);
    if (sources.length === 0) continue;
    const policies = collectPolicies(html, response.headers.get('content-security-policy'));
    const runs = sources.some((src) => !src || policies.length === 0 || policies.every((policy) => policyAllowsScript(src, policy)));
    if (runs) {
      failures.push(`${url} carries a Cloudflare analytics tag that the page policy lets run before any consent choice; switch off automatic setup under Web Analytics in the Cloudflare dashboard, or narrow script-src to the exact beacon file`);
    } else {
      notes.push(`${url} carries a Cloudflare analytics tag that the page policy blocks; it logs a console violation on each load until automatic setup is switched off`);
    }
  }
  return { failures, notes };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const urls = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_PATHS.map((path) => `${LIVE_ORIGIN}${path}`);
  const { failures, notes } = await checkLiveInjection(urls);
  for (const note of notes) console.log(`[live-injection] note  ${note}`);
  for (const failure of failures) console.log(`[live-injection] FAIL  ${failure}`);
  if (failures.length === 0) console.log(`[live-injection] ok    no injected analytics script can run before consent on ${urls.length} live pages`);
  process.exit(failures.length === 0 ? 0 : 1);
}
