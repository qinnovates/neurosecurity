#!/usr/bin/env node
/**
 * Compares the response headers the live site really sends with the policy this repository
 * defines in src/lib/csp-policy.ts.
 *
 * The edge in front of production can add or replace headers without a commit here, and a
 * browser enforces every policy it receives. A header that is looser than the repository's
 * policy is a security regression nobody reviewed; one that is stricter breaks features
 * without any build failing. This check reports both, and fails only on the looser kind and
 * on a missing baseline header.
 *
 * Usage:
 *   node src/scripts/check-live-headers.mjs [url]     # default https://qinnovate.com/
 */

import { pathToFileURL } from 'node:url';
import { SITE_PAGE_CSP, toAllowedSources } from '../lib/csp-policy.ts';

export const LIVE_URL = 'https://qinnovate.com/';
const REQUEST_TIMEOUT_MS = 15_000;
/** Directives with no fallback to default-src: a live value here is judged only when the repository states one. */
const DIRECTIVES_WITHOUT_FALLBACK = new Set(['frame-ancestors', 'base-uri', 'form-action', 'sandbox']);
const REQUIRED_HEADERS = [
  { name: 'content-security-policy', test: (value) => value.length > 0, wording: 'a Content-Security-Policy' },
  { name: 'x-content-type-options', test: (value) => value.toLowerCase() === 'nosniff', wording: 'X-Content-Type-Options: nosniff' },
  { name: 'strict-transport-security', test: (value) => /max-age=\d{7,}/.test(value), wording: 'Strict-Transport-Security with a max-age of at least a year' },
  { name: 'referrer-policy', test: (value) => value.length > 0, wording: 'a Referrer-Policy' },
  { name: 'x-frame-options', test: (value) => ['deny', 'sameorigin'].includes(value.toLowerCase()), wording: 'X-Frame-Options: DENY or SAMEORIGIN' },
];

/**
 * @param {string} liveCsp the Content-Security-Policy header value as sent
 * @param {readonly string[]} repositoryDirectives the repository's policy, one directive per entry
 * @returns {{ looser: string[], stricter: string[] }}
 */
export function comparePolicies(liveCsp, repositoryDirectives) {
  const repository = toAllowedSources(repositoryDirectives);
  const live = toAllowedSources(liveCsp.split(';').map((directive) => directive.trim()).filter(Boolean));
  const looser = [];
  const stricter = [];
  for (const [name, liveSources] of Object.entries(live)) {
    const allowed = repository[name] ?? (DIRECTIVES_WITHOUT_FALLBACK.has(name) ? null : repository['default-src']);
    if (allowed === null || allowed === undefined) continue;
    for (const source of liveSources.filter((candidate) => !allowed.includes(candidate))) {
      looser.push(`${name} allows ${source}, which the repository policy does not`);
    }
  }
  for (const [name, repositorySources] of Object.entries(repository)) {
    const liveSources = live[name] ?? live['default-src'] ?? [];
    for (const source of repositorySources.filter((candidate) => !liveSources.includes(candidate))) {
      stricter.push(`${name} lacks ${source}, which the repository policy lists, so anything needing it will not run`);
    }
  }
  return { looser, stricter };
}

/** @param {Headers} headers */
export function findMissingHeaders(headers) {
  return REQUIRED_HEADERS.filter(({ name, test }) => !test(headers.get(name) ?? '')).map(({ wording }) => `the live response lacks ${wording}`);
}

export async function checkLiveHeaders(url = LIVE_URL) {
  const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} answered ${response.status}; the live headers cannot be checked.`);
  const failures = findMissingHeaders(response.headers);
  const { looser, stricter } = comparePolicies(response.headers.get('content-security-policy') ?? '', SITE_PAGE_CSP);
  return { failures: [...failures, ...looser], notes: stricter };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { failures, notes } = await checkLiveHeaders(process.argv[2] ?? LIVE_URL);
  for (const note of notes) console.log(`[live-headers] note  ${note}`);
  for (const failure of failures) console.log(`[live-headers] FAIL  ${failure}`);
  if (failures.length === 0) console.log('[live-headers] ok    the live headers are no looser than the repository policy');
  process.exit(failures.length === 0 ? 0 : 1);
}
