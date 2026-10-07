#!/usr/bin/env node
/**
 * Fails when the built threat model page could send a visitor's data anywhere.
 *
 * The page promises that device details stay in the browser. This check holds the
 * built HTML to that: no off-origin resources, no soft-navigation router, no
 * analytics, and a content security policy that allows connections to this site only.
 *
 * The page also shows other documents in frames. A frame does not inherit the page's
 * policy, so each framed document is checked too: a framed app must carry its own
 * policy, and a framed site page must not load analytics while it is framed.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/check-model-page.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILT_DIRECTORY = 'dist';
const BUILT_PAGE_PATH = `${BUILT_DIRECTORY}/atlas/model/index.html`;
/** The two source files that declare what the Lab frames. */
const VIEW_REGISTRY_PATH = 'src/components/workbench/view-registry.ts';
const MONITOR_MODE_PATH = 'src/components/monitor/MonitorMode.tsx';
const FRAMED_PAGE_PATTERN = /framedPath:\s*'([^']+)'/g;
const FRAMED_APP_PATTERN = /MONITOR_APP_PATH\s*=\s*'([^']+)'/;

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

/** A link tag makes a request only for these relations; a canonical or alternate link is an address. */
const FETCHING_LINK_RELATIONS = ['stylesheet', 'preload', 'modulepreload', 'prefetch', 'preconnect', 'dns-prefetch', 'icon', 'apple-touch-icon', 'manifest'];
const LINK_RELATION_PATTERN = /\brel\s*=\s*["']([^"']*)["']/i;
const ANALYTICS_MARKER = 'cloudflareinsights';
/** The shared layout skips analytics when this test is true, which is the case inside a frame. */
const FRAMED_GUARD = 'window.self !== window.top';

const FORBIDDEN_MARKERS = [
  { marker: 'astro-view-transitions', reason: 'the soft-navigation router (ClientRouter) is present' },
  { marker: ANALYTICS_MARKER, reason: 'third-party analytics is present' },
];

function isNonFetchingLink(tag) {
  if (!/^<link\b/i.test(tag)) return false;
  const relations = (tag.match(LINK_RELATION_PATTERN)?.[1] ?? '').toLowerCase().split(/\s+/);
  return !relations.some((relation) => FETCHING_LINK_RELATIONS.includes(relation));
}

function findOffOriginResources(html, { skipNonFetchingLinks = false } = {}) {
  const violations = [];
  for (const tagMatch of html.matchAll(RESOURCE_TAG_PATTERN)) {
    const tag = tagMatch[0];
    if (skipNonFetchingLinks && isNonFetchingLink(tag)) continue;
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

/** Site paths the Lab shows in a frame: pages from the view registry, and the separately built Monitor app. */
export function listFramedDocuments(registrySource, monitorSource) {
  const pages = [...registrySource.matchAll(FRAMED_PAGE_PATTERN)].map((match) => match[1]);
  const app = monitorSource.match(FRAMED_APP_PATTERN)?.[1];
  return { pages: [...new Set(pages)], apps: app === undefined ? [] : [app] };
}

/** A framed app is a separate build with its own scripts, so the browser must hold it to its own policy. */
export function findFramedAppViolations(html) {
  return [...findOffOriginResources(html), ...findPolicyViolations(html)];
}

/**
 * A framed site page uses the shared layout. This checks what its HTML requests and that
 * analytics stays off while framed. It cannot see what the page's scripts request later.
 */
export function findFramedPageViolations(html) {
  const violations = findOffOriginResources(html, { skipNonFetchingLinks: true });
  if (html.includes(ANALYTICS_MARKER) && !html.includes(FRAMED_GUARD)) {
    violations.push('third-party analytics would load while the page is framed');
  }
  return violations;
}

function readText(filePath, hint) {
  try {
    return readFileSync(path.resolve(filePath), 'utf-8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read ${filePath} (${detail}). ${hint}`);
  }
}

function builtPathFor(sitePath) {
  return path.join(BUILT_DIRECTORY, sitePath, 'index.html');
}

function runCheck() {
  const buildHint = 'Run "npm run build" first.';
  const framed = listFramedDocuments(
    readText(VIEW_REGISTRY_PATH, 'The check reads framed views from this file.'),
    readText(MONITOR_MODE_PATH, 'The check reads the Monitor app path from this file.'),
  );
  const results = [
    { file: BUILT_PAGE_PATH, violations: findIsolationViolations(readText(BUILT_PAGE_PATH, buildHint)) },
    ...framed.apps.map((sitePath) => builtPathFor(sitePath)).map((file) => ({ file, violations: findFramedAppViolations(readText(file, buildHint)) })),
    ...framed.pages.map((sitePath) => builtPathFor(sitePath)).map((file) => ({ file, violations: findFramedPageViolations(readText(file, buildHint)) })),
  ];
  const failures = results.filter((result) => result.violations.length > 0);
  for (const failure of failures) {
    process.stderr.write(`[check-model-page] ${failure.file} is not isolated:\n`);
    for (const violation of failure.violations) process.stderr.write(`  - ${violation}\n`);
  }
  if (failures.length > 0) process.exit(1);
  process.stdout.write(`[check-model-page] ${BUILT_PAGE_PATH}: no off-origin resources, router, or analytics; policy allows connections to this site only.\n`);
  process.stdout.write(`[check-model-page] framed documents: ${framed.apps.length} app(s) carry their own policy; ${framed.pages.length} site page(s) request nothing off-origin in their HTML and keep analytics off while framed.\n`);
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
