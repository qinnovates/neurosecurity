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
import { TAG_ATTRIBUTES_SOURCE, blankInertContent, parseAttributes } from './built-html.mjs';
import { DEFAULT_DIST_DIRECTORY, TOOL_PAGES, ToolPageCheckError, resolveBuiltFile } from './tool-pages.mjs';

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
const META_TAG_PATTERN = new RegExp(String.raw`<meta\b${TAG_ATTRIBUTES_SOURCE}>`, 'gi');
const POLICY_HEADER_NAME = 'content-security-policy';
const WHITESPACE_PATTERN = /\s+/;
const HEAD_START_PATTERN = /<head\b[^>]*>/i;
const HEAD_END_PATTERN = /<\/head\s*>/i;
const SCRIPT_TAG_PATTERN = /<script\b/i;
const TAG_NAME_PATTERN = new RegExp(String.raw`<\/?([a-z][a-z0-9-]*)\b${TAG_ATTRIBUTES_SOURCE}>`, 'gi');
/** The only elements a head may hold. Any other element, or text, ends the head where it stands. */
const HEAD_ELEMENTS = ['meta', 'title', 'link', 'style', 'script', 'base', 'noscript', 'template'];

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

/** What ends the head before `index`, if anything: an element a head cannot hold, or text. */
function findHeadEnders(liveHtml, headContentStart, index) {
  const beforeTag = liveHtml.slice(headContentStart, index);
  const strayElements = [...beforeTag.matchAll(TAG_NAME_PATTERN)].map((match) => match[1].toLowerCase())
    .filter((name) => !HEAD_ELEMENTS.includes(name));
  const hasStrayText = beforeTag.replace(TAG_NAME_PATTERN, '').trim() !== '';
  return [...new Set(strayElements.map((name) => `<${name}>`)), ...(hasStrayText ? ['text'] : [])];
}

/**
 * A browser applies a policy tag only when it is in the head, and only to what comes after it.
 * Returns a violation for each way the first tag is placed where it would not cover the page.
 */
function findPolicyPlacementViolations(liveHtml, tagIndex) {
  const headStart = liveHtml.match(HEAD_START_PATTERN);
  const headEnd = liveHtml.search(HEAD_END_PATTERN);
  if (headStart === null || headEnd === -1 || tagIndex < headStart.index || tagIndex > headEnd) {
    return ['Content-Security-Policy meta tag is outside the head, where browsers ignore it'];
  }
  const violations = [];
  const headEnders = findHeadEnders(liveHtml, headStart.index + headStart[0].length, tagIndex);
  if (headEnders.length > 0) {
    violations.push(`${headEnders.join(', ')} before the Content-Security-Policy meta tag ends the head early, so browsers ignore the tag`);
  }
  const firstScript = liveHtml.search(SCRIPT_TAG_PATTERN);
  if (firstScript !== -1 && firstScript < tagIndex) violations.push('a script comes before the Content-Security-Policy meta tag, so the policy does not cover it');
  return violations;
}

/** Policy tags a browser would act on: real meta elements whose `http-equiv` attribute names the policy header. */
function findPolicyTags(liveHtml) {
  return [...liveHtml.matchAll(META_TAG_PATTERN)]
    .map((match) => ({ index: match.index, attributes: parseAttributes(match[1]) }))
    .filter(({ attributes }) => (attributes.get('http-equiv') ?? '').trim().toLowerCase() === POLICY_HEADER_NAME);
}

function findPolicyViolations(html) {
  const liveHtml = blankInertContent(html);
  const policyTags = findPolicyTags(liveHtml);
  if (policyTags.length === 0) {
    return ['no Content-Security-Policy meta tag'];
  }
  return [
    ...findPolicyPlacementViolations(liveHtml, policyTags[0].index),
    ...policyTags.flatMap(({ attributes }) => findPolicyDifferences(attributes.get('content') ?? '')),
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
    throw new ToolPageCheckError('page-not-built', `Could not read the built page for ${urlPath} (${detail}). Run "npm run build" first.`);
  }
}

/**
 * Checks every listed page in a build directory.
 * Returns one human-readable failure per violation, each naming its page; empty means all pass.
 * An empty list is a failure. Throws ToolPageCheckError when a listed page was not built.
 */
export function findToolPageFailures(distDirectory = DEFAULT_DIST_DIRECTORY, pages = TOOL_PAGES) {
  if (pages.length === 0) return ['no tool pages are listed, so nothing was checked'];
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
