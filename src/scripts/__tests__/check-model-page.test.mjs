import { describe, it, expect } from 'vitest';
import { findIsolationViolations } from '../check-model-page.mjs';

const ISOLATED_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'none'; base-uri 'none'; object-src 'none'";

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
    const html = buildPage({ policy: ISOLATED_POLICY.replace("connect-src 'self'", "connect-src *") });
    expect(findIsolationViolations(html)).toEqual(['Content-Security-Policy is missing "connect-src \'self\'"']);
  });
});
