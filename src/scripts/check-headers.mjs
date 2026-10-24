/**
 * Post-build check: the emitted `_headers` states exactly the policies in src/lib/csp-policy.ts.
 *
 * The preview host applies both the header and each page's policy meta, and a browser
 * enforces their intersection. Holding the header text equal to the module keeps that
 * intersection equal to the policy. Anything else in the file is left to the generator.
 */

import fs from 'node:fs';
import { ISOLATED_POLICY, SITE_PAGE_CSP, TOOL_PAGE_PATH_PATTERNS, joinPolicy } from '../lib/csp-policy.ts';
import { resolveBuiltFile } from './tool-pages.mjs';

const HEADERS_PATH = '_headers';
const CSP_LINE_PATTERN = /^\s+Content-Security-Policy:\s*(.*)$/;
const PATTERN_LINE_PATTERN = /^\/\S*$/;

/** Path pattern to the policy string stated under it; a pattern with two policies records the last. */
export function readPolicyLines(headersText) {
  const policies = new Map();
  let pattern = null;
  for (const line of headersText.split('\n')) {
    if (PATTERN_LINE_PATTERN.test(line)) {
      pattern = line;
      continue;
    }
    const match = line.match(CSP_LINE_PATTERN);
    if (match && pattern !== null) policies.set(pattern, match[1].trim());
  }
  return policies;
}

/** The pattern to policy map the module says the file must hold. */
export function expectedPolicies() {
  return new Map([
    ['/*', joinPolicy(SITE_PAGE_CSP)],
    ...TOOL_PAGE_PATH_PATTERNS.map((pattern) => [pattern, ISOLATED_POLICY]),
  ]);
}

/**
 * @param {string} distDirectory
 * @returns {string[]} one failure per pattern whose policy differs, is missing, or is not in the module
 */
export function findHeaderPolicyFailures(distDirectory) {
  let text;
  try {
    text = fs.readFileSync(resolveBuiltFile(distDirectory, HEADERS_PATH), 'utf-8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return [`${HEADERS_PATH} was not emitted (${detail}); prebuild writes it from csp-policy.ts`];
  }
  const actual = readPolicyLines(text);
  const expected = expectedPolicies();
  const failures = [];
  for (const [pattern, policy] of expected) {
    if (!actual.has(pattern)) failures.push(`${HEADERS_PATH}: no Content-Security-Policy under ${pattern}`);
    else if (actual.get(pattern) !== policy) failures.push(`${HEADERS_PATH}: the policy under ${pattern} differs from csp-policy.ts`);
  }
  for (const pattern of actual.keys()) {
    if (!expected.has(pattern)) failures.push(`${HEADERS_PATH}: a Content-Security-Policy under ${pattern} is not in csp-policy.ts`);
  }
  return failures;
}
