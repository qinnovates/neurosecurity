#!/usr/bin/env node
/**
 * Fails when the built threat model page could send a visitor's data anywhere.
 *
 * The page promises that device details stay in the browser. This check holds the
 * built HTML to that: no off-origin resources, no soft-navigation router, no
 * analytics, and a content security policy that allows connections to this site only.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/check-model-page.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILT_PAGE_PATH = 'dist/atlas/model/index.html';

const REQUIRED_CSP_DIRECTIVES = [
  "default-src 'self'",
  "connect-src 'self'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
];

/** Tags whose attributes make the browser fetch something without a click. */
const RESOURCE_TAG_PATTERN = /<(script|link|img|iframe|source|video|audio|object|embed|form|track)\b[^>]*>/gi;
const RESOURCE_ATTRIBUTE_PATTERN = /\b(src|href|data|action|srcset|poster)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const OFF_ORIGIN_URL_PATTERN = /^\s*(https?:)?\/\//i;
const CSS_OFF_ORIGIN_PATTERN = /(url\(\s*['"]?\s*(https?:)?\/\/|@import\s+['"]\s*(https?:)?\/\/)/i;
const CSP_META_PATTERN = /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i;
const CONTENT_ATTRIBUTE_PATTERN = /\bcontent\s*=\s*"([^"]*)"/i;

const FORBIDDEN_MARKERS = [
  { marker: 'astro-view-transitions', reason: 'the soft-navigation router (ClientRouter) is present' },
  { marker: 'cloudflareinsights', reason: 'third-party analytics is present' },
];

function findOffOriginResources(html) {
  const violations = [];
  for (const tagMatch of html.matchAll(RESOURCE_TAG_PATTERN)) {
    const tag = tagMatch[0];
    for (const attributeMatch of tag.matchAll(RESOURCE_ATTRIBUTE_PATTERN)) {
      const value = attributeMatch[3] ?? attributeMatch[4] ?? '';
      const candidates = attributeMatch[1].toLowerCase() === 'srcset' ? value.split(',') : [value];
      if (candidates.some((candidate) => OFF_ORIGIN_URL_PATTERN.test(candidate))) {
        violations.push(`off-origin resource: ${tag.slice(0, 160)}`);
      }
    }
  }
  if (CSS_OFF_ORIGIN_PATTERN.test(html)) {
    violations.push('off-origin URL inside inline CSS (url() or @import)');
  }
  return violations;
}

function findPolicyViolations(html) {
  const metaTag = html.match(CSP_META_PATTERN)?.[0];
  if (!metaTag) {
    return ['no Content-Security-Policy meta tag'];
  }
  const policy = metaTag.match(CONTENT_ATTRIBUTE_PATTERN)?.[1] ?? '';
  const directives = policy.split(';').map((directive) => directive.trim());
  return REQUIRED_CSP_DIRECTIVES
    .filter((required) => !directives.includes(required))
    .map((missing) => `Content-Security-Policy is missing "${missing}"`);
}

function findForbiddenMarkers(html) {
  return FORBIDDEN_MARKERS
    .filter(({ marker }) => html.includes(marker))
    .map(({ reason }) => reason);
}

/** Returns a list of human-readable violations; empty means the page is isolated. */
export function findIsolationViolations(html) {
  return [
    ...findOffOriginResources(html),
    ...findPolicyViolations(html),
    ...findForbiddenMarkers(html),
  ];
}

function readBuiltPage() {
  try {
    return readFileSync(path.resolve(BUILT_PAGE_PATH), 'utf-8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read ${BUILT_PAGE_PATH} (${detail}). Run "npm run build" first.`);
  }
}

function runCheck() {
  const violations = findIsolationViolations(readBuiltPage());
  if (violations.length > 0) {
    process.stderr.write(`[check-model-page] ${BUILT_PAGE_PATH} is not isolated:\n`);
    for (const violation of violations) process.stderr.write(`  - ${violation}\n`);
    process.exit(1);
  }
  process.stdout.write(`[check-model-page] ${BUILT_PAGE_PATH}: no off-origin resources, router, or analytics; policy allows connections to this site only.\n`);
}

const isRunDirectly = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isRunDirectly) {
  try {
    runCheck();
  } catch (error) {
    process.stderr.write(`[check-model-page] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
