#!/usr/bin/env node
/**
 * Fails when a built tool page could send a visitor's data anywhere.
 *
 * Each page promises that what is entered stays in the browser. This check holds the
 * built HTML to that: no off-origin resources, no soft-navigation router, no
 * analytics, and a content security policy equal to the one recorded below, so a
 * loosened policy fails here instead of shipping.
 *
 * It reads the built HTML only. It cannot see what the scripts do when they run, or
 * anything the host adds to a response after the build.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/check-model-page.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_DIST_DIRECTORY, TOOL_PAGES, resolveBuiltFile } from './tool-pages.mjs';

/**
 * The whole policy of a tool page: every directive, and every source each may name.
 * It mirrors TOOL_PAGE_CSP in src/layouts/ToolLayout.astro. A change there fails this
 * check until the same change is made here, which is the review point for the policy.
 */
export const ALLOWED_CSP_SOURCES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'form-action': ["'none'"],
  'base-uri': ["'none'"],
  'object-src': ["'none'"],
};

/** Tags whose attributes make the browser fetch something without a click. */
const RESOURCE_TAG_PATTERN = /<(script|link|img|iframe|source|video|audio|object|embed|form|track)\b[^>]*>/gi;
const RESOURCE_ATTRIBUTE_PATTERN = /\b(src|href|data|action|srcset|poster)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const OFF_ORIGIN_URL_PATTERN = /^\s*(https?:)?\/\//i;
const CSS_OFF_ORIGIN_PATTERN = /(url\(\s*['"]?\s*(https?:)?\/\/|@import\s+['"]\s*(https?:)?\/\/)/i;
const CSP_META_PATTERN = /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/gi;
const CONTENT_ATTRIBUTE_PATTERN = /\bcontent\s*=\s*"([^"]*)"/i;
const WHITESPACE_PATTERN = /\s+/;
const HEAD_END_PATTERN = /<\/head\s*>/i;
const SCRIPT_TAG_PATTERN = /<script\b/i;

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

/** Splits a policy into [directive name, sources] pairs, in the order written. */
function parsePolicy(policy) {
  return policy
    .split(';')
    .map((directive) => directive.trim().split(WHITESPACE_PATTERN).filter((token) => token !== ''))
    .filter((tokens) => tokens.length > 0)
    .map(([name, ...sources]) => [name.toLowerCase(), sources]);
}

function findDirectiveSetViolations(directiveNames, allowedSources) {
  const seen = new Set();
  const violations = [];
  for (const name of directiveNames) {
    if (seen.has(name)) violations.push(`Content-Security-Policy repeats "${name}"`);
    else if (!Object.hasOwn(allowedSources, name)) violations.push(`Content-Security-Policy has "${name}", which is not in the allowed policy`);
    seen.add(name);
  }
  const missing = Object.keys(allowedSources).filter((name) => !seen.has(name));
  return [...violations, ...missing.map((name) => `Content-Security-Policy is missing "${name}"`)];
}

function findSourceViolations(name, sources, allowedSources) {
  if (!Object.hasOwn(allowedSources, name)) return [];
  const allowed = allowedSources[name];
  return [
    ...sources.filter((source) => !allowed.includes(source))
      .map((source) => `Content-Security-Policy "${name}" allows ${source}, which is not in the allowed policy`),
    ...allowed.filter((source) => !sources.includes(source))
      .map((source) => `Content-Security-Policy "${name}" no longer has ${source}`),
  ];
}

/**
 * Returns every way one policy string differs from an allowed policy; empty means equal.
 * A page with a policy of its own passes its own map of directive names to sources.
 */
export function findPolicyDifferences(policy, allowedSources = ALLOWED_CSP_SOURCES) {
  const directives = parsePolicy(policy);
  return [
    ...findDirectiveSetViolations(directives.map(([name]) => name), allowedSources),
    ...directives.flatMap(([name, sources]) => findSourceViolations(name, sources, allowedSources)),
  ];
}

/**
 * A browser applies a policy tag only inside the head, and only to what comes after it.
 * Returns a violation when the first tag is placed where it would not cover the page's scripts.
 */
function findPolicyPlacementViolations(html, firstTagIndex) {
  const headEnd = html.search(HEAD_END_PATTERN);
  const firstScript = html.search(SCRIPT_TAG_PATTERN);
  const violations = [];
  if (headEnd === -1 || firstTagIndex > headEnd) violations.push('Content-Security-Policy meta tag is outside the head, where browsers ignore it');
  if (firstScript !== -1 && firstScript < firstTagIndex) violations.push('a script comes before the Content-Security-Policy meta tag, so the policy does not cover it');
  return violations;
}

function findPolicyViolations(html) {
  const metaTags = [...html.matchAll(CSP_META_PATTERN)];
  if (metaTags.length === 0) {
    return ['no Content-Security-Policy meta tag'];
  }
  return [
    ...findPolicyPlacementViolations(html, metaTags[0].index),
    ...metaTags.flatMap(([metaTag]) => findPolicyDifferences(metaTag.match(CONTENT_ATTRIBUTE_PATTERN)?.[1] ?? '')),
  ];
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

function readBuiltPage(distDirectory, urlPath) {
  const filePath = resolveBuiltFile(distDirectory, urlPath);
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read the built page for ${urlPath} (${detail}). Run "npm run build" first.`);
  }
}

/**
 * Checks every listed page in a build directory.
 * Returns one human-readable failure per violation, each naming its page; empty means all pass.
 * Throws when a listed page was not built.
 */
export function findToolPageFailures(distDirectory = DEFAULT_DIST_DIRECTORY, pages = TOOL_PAGES) {
  return pages.flatMap(({ urlPath }) => findIsolationViolations(readBuiltPage(distDirectory, urlPath))
    .map((violation) => `${urlPath}: ${violation}`));
}

function runCheck() {
  const failures = findToolPageFailures();
  if (failures.length > 0) {
    process.stderr.write('[check-model-page] not isolated:\n');
    for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
    process.exit(1);
  }
  const pageList = TOOL_PAGES.map(({ urlPath }) => urlPath).join(', ');
  process.stdout.write(`[check-model-page] ${pageList}: no off-origin resources, router, or analytics; policy equals the allowed policy.\n`);
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
