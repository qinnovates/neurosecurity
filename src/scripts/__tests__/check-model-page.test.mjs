import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ISOLATED_POLICY, TOOL_PAGE_CSP } from '../../lib/csp-policy.ts';
import {
  ALLOWED_CSP_SOURCES,
  findFramedAppViolations,
  findFramedPageViolations,
  findIsolationViolations,
  findPolicyDifferences,
  findToolPageFailures,
  listFramedDocuments,
} from '../check-model-page.mjs';

const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIST = path.join(TEST_DIRECTORY, 'fixtures', 'lab-first-load');
const SCRIPT_DIRECTIVE = "script-src 'self' 'unsafe-inline'";

function buildPage({ policy = ISOLATED_POLICY, head = '', body = '' } = {}) {
  const policyTag = policy === null ? '' : `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
  return `<!DOCTYPE html><html><head>${policyTag}${head}</head><body>${body}</body></html>`;
}

describe('findIsolationViolations', () => {
  it('accepts a page with same-origin resources and the required policy', () => {
    const html = buildPage({
      head: '<link rel="stylesheet" href="/_astro/model.css"><script type="module" src="/_astro/model.js"></script>',
      body: '<img src="data:image/png;base64,AAAA"><a href="https://www.fda.gov/">source</a>',
    });
    expect(findIsolationViolations(html)).toEqual([]);
  });

  it('flags a third-party script', () => {
    const html = buildPage({ body: '<script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script>' });
    const violations = findIsolationViolations(html);
    expect(violations.some((violation) => violation.startsWith('off-origin resource'))).toBe(true);
    expect(violations).toContain('third-party analytics is present');
  });

  it('flags protocol-relative URLs and off-origin srcset entries', () => {
    const html = buildPage({ body: '<img src="//cdn.example/a.png"><img srcset="/a.png 1x, https://cdn.example/b.png 2x">' });
    expect(findIsolationViolations(html)).toHaveLength(2);
  });

  it('flags a form that posts off-origin', () => {
    const html = buildPage({ body: '<form action="https://collector.example/submit"></form>' });
    expect(findIsolationViolations(html)).toHaveLength(1);
  });

  it('flags off-origin URLs inside inline CSS', () => {
    const html = buildPage({ head: '<style>body{background:url("https://cdn.example/bg.png")}</style>' });
    expect(findIsolationViolations(html)).toContain('off-origin URL inside inline CSS (url() or @import)');
  });

  it('flags the soft-navigation router', () => {
    const html = buildPage({ head: '<meta name="astro-view-transitions-enabled" content="true">' });
    expect(findIsolationViolations(html)).toContain('the soft-navigation router (ClientRouter) is present');
  });

  it('flags a missing policy', () => {
    expect(findIsolationViolations(buildPage({ policy: null }))).toEqual(['no Content-Security-Policy meta tag']);
  });

  it('flags a policy that allows connections to other sites', () => {
    const html = buildPage({ policy: ISOLATED_POLICY.replace("connect-src 'self'", 'connect-src *') });
    expect(findIsolationViolations(html)).toEqual([
      'Content-Security-Policy "connect-src" allows *, which is not in the allowed policy',
      'Content-Security-Policy "connect-src" no longer has \'self\'',
    ]);
  });

  it('flags a policy tag that a script precedes', () => {
    const html = `<!DOCTYPE html><html><head><script src="/early.js"></script><meta http-equiv="Content-Security-Policy" content="${ISOLATED_POLICY}"></head><body></body></html>`;
    expect(findIsolationViolations(html)).toEqual(['a script comes before the Content-Security-Policy meta tag, so the policy does not cover it']);
  });

  it('flags a policy tag outside the head', () => {
    const html = `<!DOCTYPE html><html><head></head><body><meta http-equiv="Content-Security-Policy" content="${ISOLATED_POLICY}"></body></html>`;
    expect(findIsolationViolations(html)).toEqual(['Content-Security-Policy meta tag is outside the head, where browsers ignore it']);
  });

  it('holds a second policy tag on the same page to the same policy', () => {
    const html = buildPage({ head: '<meta http-equiv="Content-Security-Policy" content="default-src *">' });
    expect(findIsolationViolations(html)).toContain('Content-Security-Policy "default-src" allows *, which is not in the allowed policy');
  });
});

describe('which policy tags a browser would act on', () => {
  const NO_TAG = ['no Content-Security-Policy meta tag'];
  const goodTag = `<meta http-equiv="Content-Security-Policy" content="${ISOLATED_POLICY}">`;
  const inHead = (headContent) => `<!DOCTYPE html><html><head>${headContent}</head><body></body></html>`;

  it('reads the content attribute itself, not one whose name ends the same way', () => {
    const html = inHead(`<meta http-equiv="Content-Security-Policy" data-content="${ISOLATED_POLICY}" content="default-src *">`);
    const violations = findIsolationViolations(html);
    expect(violations).toContain('Content-Security-Policy "default-src" allows *, which is not in the allowed policy');
    expect(violations).toContain('Content-Security-Policy is missing "connect-src"');
  });

  it('does not take data-http-equiv for http-equiv', () => {
    expect(findIsolationViolations(inHead(`<meta data-http-equiv="Content-Security-Policy" content="${ISOLATED_POLICY}">`))).toEqual(NO_TAG);
  });

  it.each([
    ['an HTML comment', `<!-- ${goodTag} -->`],
    ['noscript', `<noscript>${goodTag}</noscript>`],
    ['template', `<template>${goodTag}</template>`],
    ['a style comment', `<style>/* ${goodTag} */</style>`],
    ['a script string', `<script>var decoy = '${goodTag}';</script>`],
    ['the title', `<title>${goodTag}</title>`],
  ])('ignores a policy tag written inside %s', (_label, headContent) => {
    expect(findIsolationViolations(inHead(headContent))).toEqual(NO_TAG);
  });

  it('flags a policy tag that follows an element a head cannot hold', () => {
    expect(findIsolationViolations(inHead(`<div></div>${goodTag}`))).toEqual([
      '<div> before the Content-Security-Policy meta tag ends the head early, so browsers ignore the tag',
    ]);
  });

  it('flags a policy tag that follows text in the head', () => {
    expect(findIsolationViolations(inHead(`stray words${goodTag}`))).toEqual([
      'text before the Content-Security-Policy meta tag ends the head early, so browsers ignore the tag',
    ]);
  });

  it('accepts the tag after the elements a head may hold, and after a comment', () => {
    const html = inHead(`<meta charset="UTF-8"><title>Tool</title><link rel="icon" href="/favicon.svg"><!-- note --><style>body{margin:0}</style>${goodTag}`);
    expect(findIsolationViolations(html)).toEqual([]);
  });

  it('accepts the tag after a head element whose attribute value contains ">"', () => {
    expect(findIsolationViolations(inHead(`<meta name="description" content="values > 5 are flagged">${goodTag}`))).toEqual([]);
  });

  it('accepts an unquoted or differently cased http-equiv, as a browser does', () => {
    expect(findIsolationViolations(inHead(`<meta http-equiv=Content-Security-Policy content="${ISOLATED_POLICY}">`))).toEqual([]);
    expect(findIsolationViolations(inHead(`<META HTTP-EQUIV="content-security-policy" CONTENT="${ISOLATED_POLICY}">`))).toEqual([]);
  });

  it('is not fooled by a lax decoy in a comment beside the real tag', () => {
    const html = inHead(`${goodTag}<!-- <meta http-equiv="Content-Security-Policy" content="default-src *"> -->`);
    expect(findIsolationViolations(html)).toEqual([]);
  });

  it('reads a policy tag whose earlier attribute value contains ">"', () => {
    const html = inHead(`<meta name="note" content="x"><meta title="a > b" http-equiv="Content-Security-Policy" content="default-src *">`);
    expect(findIsolationViolations(html)).toContain('Content-Security-Policy "default-src" allows *, which is not in the allowed policy');
  });
});

describe('findPolicyDifferences', () => {
  it('accepts the policy of the page as built today', () => {
    expect(findPolicyDifferences(ISOLATED_POLICY)).toEqual([]);
  });

  it('accepts the same policy with directives reordered and spaced differently', () => {
    const reordered = ISOLATED_POLICY.split('; ').reverse().join(' ;  ').replace("'self' 'unsafe-inline'", "'unsafe-inline'   'self'");
    expect(findPolicyDifferences(`${reordered};`)).toEqual([]);
  });

  it('records the policy this test calls today\'s', () => {
    const recorded = Object.entries(ALLOWED_CSP_SOURCES).map(([name, sources]) => `${name} ${sources.join(' ')}`).join('; ');
    expect(recorded).toBe(ISOLATED_POLICY);
  });

  it('equals the tool page policy of csp-policy.ts, directive for directive', () => {
    expect(TOOL_PAGE_CSP.join('; ')).toBe(ISOLATED_POLICY);
    expect(TOOL_PAGE_CSP).toContain("worker-src 'self'");
    expect(ISOLATED_POLICY).not.toContain('blob:');
  });

  it.each([
    ["'wasm-unsafe-eval'", `${SCRIPT_DIRECTIVE} 'wasm-unsafe-eval'`, 'Content-Security-Policy "script-src" allows \'wasm-unsafe-eval\', which is not in the allowed policy'],
    ["'unsafe-eval'", `${SCRIPT_DIRECTIVE} 'unsafe-eval'`, 'Content-Security-Policy "script-src" allows \'unsafe-eval\', which is not in the allowed policy'],
    ['blob:', `${SCRIPT_DIRECTIVE} blob:`, 'Content-Security-Policy "script-src" allows blob:, which is not in the allowed policy'],
    ['a host', `${SCRIPT_DIRECTIVE} https://cdn.example`, 'Content-Security-Policy "script-src" allows https://cdn.example, which is not in the allowed policy'],
  ])('rejects script-src widened with %s', (_label, widenedDirective, expected) => {
    expect(findPolicyDifferences(ISOLATED_POLICY.replace(SCRIPT_DIRECTIVE, widenedDirective))).toEqual([expected]);
  });

  it.each([
    ['child-src', "child-src 'self' blob:"],
    ['frame-src', 'frame-src *'],
    ['script-src-elem', 'script-src-elem https://cdn.example'],
  ])('rejects an added %s directive', (name, addedDirective) => {
    expect(findPolicyDifferences(`${ISOLATED_POLICY}; ${addedDirective}`)).toEqual([
      `Content-Security-Policy has "${name}", which is not in the allowed policy`,
    ]);
  });

  it('rejects img-src *', () => {
    expect(findPolicyDifferences(ISOLATED_POLICY.replace("img-src 'self' data:", 'img-src *'))).toEqual([
      'Content-Security-Policy "img-src" allows *, which is not in the allowed policy',
      'Content-Security-Policy "img-src" no longer has \'self\'',
      'Content-Security-Policy "img-src" no longer has data:',
    ]);
  });

  it('rejects blob: added to worker-src, which the policy names with self only', () => {
    expect(findPolicyDifferences(ISOLATED_POLICY.replace("worker-src 'self'", "worker-src 'self' blob:"))).toEqual([
      'Content-Security-Policy "worker-src" allows blob:, which is not in the allowed policy',
    ]);
  });

  it('rejects blob: added to connect-src', () => {
    expect(findPolicyDifferences(ISOLATED_POLICY.replace("connect-src 'self'", "connect-src 'self' blob:"))).toEqual([
      'Content-Security-Policy "connect-src" allows blob:, which is not in the allowed policy',
    ]);
  });

  it('rejects a missing directive', () => {
    expect(findPolicyDifferences(ISOLATED_POLICY.replace("; object-src 'none'", ''))).toEqual(['Content-Security-Policy is missing "object-src"']);
  });

  it('rejects a repeated directive, whichever copy is the lax one', () => {
    expect(findPolicyDifferences(`${ISOLATED_POLICY}; connect-src *`)).toEqual([
      'Content-Security-Policy repeats "connect-src"',
      'Content-Security-Policy "connect-src" allows *, which is not in the allowed policy',
      'Content-Security-Policy "connect-src" no longer has \'self\'',
    ]);
  });

  it('treats directive names without regard to case, as browsers do', () => {
    expect(findPolicyDifferences(ISOLATED_POLICY.replace('script-src', 'Script-Src'))).toEqual([]);
  });

  it('compares against another allowed policy when a page has its own', () => {
    const ownPolicy = { 'default-src': ["'self'"], 'worker-src': ["'self'", 'blob:'] };
    expect(findPolicyDifferences("default-src 'self'; worker-src 'self' blob:", ownPolicy)).toEqual([]);
    expect(findPolicyDifferences("default-src 'self'; worker-src 'self' blob: data:", ownPolicy)).toEqual([
      'Content-Security-Policy "worker-src" allows data:, which is not in the allowed policy',
    ]);
  });

  it('does not mistake an inherited object property for an allowed directive', () => {
    expect(findPolicyDifferences(`${ISOLATED_POLICY}; constructor *`)).toEqual([
      'Content-Security-Policy has "constructor", which is not in the allowed policy',
    ]);
  });

  it('rejects an empty policy by naming every missing directive', () => {
    expect(findPolicyDifferences('')).toHaveLength(Object.keys(ALLOWED_CSP_SOURCES).length);
  });
});

describe('findToolPageFailures', () => {
  it('passes a built page that carries the allowed policy', () => {
    expect(findToolPageFailures(FIXTURE_DIST, [{ urlPath: '/tool/' }])).toEqual([]);
  });

  it('checks every listed page and names the one that fails', () => {
    expect(findToolPageFailures(FIXTURE_DIST, [{ urlPath: '/tool/' }, { urlPath: '/eager/' }])).toEqual([
      '/eager/: no Content-Security-Policy meta tag',
    ]);
  });

  it('fails an empty page list instead of passing with nothing checked', () => {
    expect(findToolPageFailures(FIXTURE_DIST, [])).toEqual(['no tool pages are listed, so nothing was checked']);
  });

  it('throws with the next step when a listed page was not built', () => {
    expect(() => findToolPageFailures(FIXTURE_DIST, [{ urlPath: '/absent/' }])).toThrow(/Could not read the built page for \/absent\/.*npm run build/);
  });
});

describe('listFramedDocuments', () => {
  it('reads framed pages from the view registry and the app path from the Monitor mode', () => {
    const registry = "{ id: 'catalog', label: 'Catalog', framedPath: '/atlas/tara/' }, { id: 'own', label: 'Own', framedPath: null }, { id: 'again', label: 'Again', framedPath: '/atlas/tara/' }";
    const monitor = "const MONITOR_APP_PATH = '/brain-siem/';";
    expect(listFramedDocuments(registry, monitor)).toEqual({ pages: ['/atlas/tara/'], apps: ['/brain-siem/'] });
  });

  it('returns nothing when no view is framed', () => {
    expect(listFramedDocuments("{ id: 'own', framedPath: null }", 'export default function MonitorMode() {}')).toEqual({ pages: [], apps: [] });
  });
});

describe('listFramedDocuments, when the Monitor frame cannot be read', () => {
  it('fails instead of skipping the app', () => {
    expect(() => listFramedDocuments('', "return <iframe src={SOME_OTHER_NAME} />;")).toThrow(/address was not found/);
  });
});

describe('findFramedAppViolations', () => {
  it('accepts an app that carries the required policy', () => {
    expect(findFramedAppViolations(buildPage({ head: '<script type="module" src="/brain-siem/assets/index.js"></script>' }))).toEqual([]);
  });

  it('flags an app with no policy, because a frame does not inherit the page policy', () => {
    expect(findFramedAppViolations(buildPage({ policy: null }))).toEqual(['no Content-Security-Policy meta tag']);
  });
});

describe('findFramedPageViolations', () => {
  const guardedAnalytics = "<script>(function () { if (window.self !== window.top) return; var beacon = document.createElement('script'); beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js'; })();</script>";

  it('accepts a site page whose analytics is skipped inside a frame', () => {
    const html = buildPage({ policy: null, head: '<link rel="canonical" href="https://qinnovate.com/atlas/tara/">', body: guardedAnalytics });
    expect(findFramedPageViolations(html)).toEqual([]);
  });

  it('flags a site page that would load analytics while framed', () => {
    const html = buildPage({ policy: null, body: guardedAnalytics.replace('if (window.self !== window.top) return; ', '') });
    expect(findFramedPageViolations(html)).toEqual(['third-party analytics would load while the page is framed']);
  });

  it('flags an off-origin stylesheet but not a canonical link', () => {
    const html = buildPage({ policy: null, head: '<link rel="canonical" href="https://qinnovate.com/x/"><link rel="stylesheet" href="https://fonts.example/a.css">' });
    expect(findFramedPageViolations(html)).toHaveLength(1);
  });
});
