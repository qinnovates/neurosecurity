import { describe, expect, it } from 'vitest';
import { BROWSER_HEADERS, checkLiveInjection, collectPolicies, findAnalyticsScriptSources, hasInjectedAnalytics, policyAllowsScript } from '../check-live-injection.mjs';

const INJECTED_SRC = 'https://static.cloudflareinsights.com/beacon.min.js/vce701823e78c4301a35b7e07294d87301792088814092';
const CLEAN_PAGE = '<html><head><script type="module" src="/js/consent.js"></script></head><body>privacy</body></html>';
const INJECTED_PAGE = `<html><head></head><body><script type="module" src="${INJECTED_SRC}" data-cf-beacon='{"token":"x"}'></script></body></html>`;

const HOST_WIDE = "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com";
const EXACT_FILE = "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com/beacon.min.js";

const page = (status, body, csp) => async () => new Response(body, { status, headers: csp ? { 'content-security-policy': csp } : {} });

describe('hasInjectedAnalytics', () => {
  it('finds the tag the edge injects, whichever attribute marks it', () => {
    expect(hasInjectedAnalytics(INJECTED_PAGE)).toBe(true);
    expect(hasInjectedAnalytics('<script src="https://static.cloudflareinsights.com/beacon.min.js"></script>')).toBe(true);
    expect(hasInjectedAnalytics('<script data-cf-beacon="{}" defer></script>')).toBe(true);
  });

  it('does not flag a page that only loads the site\'s own consent script', () => {
    expect(hasInjectedAnalytics(CLEAN_PAGE)).toBe(false);
    expect(hasInjectedAnalytics('<p>We use Cloudflare Web Analytics only after you accept.</p>')).toBe(false);
  });
});

describe('policyAllowsScript', () => {
  it('lets a host-wide source run the injected path', () => {
    expect(policyAllowsScript(INJECTED_SRC, HOST_WIDE)).toBe(true);
  });

  it('matches a source with a path and no trailing slash against that path only', () => {
    expect(policyAllowsScript(INJECTED_SRC, EXACT_FILE)).toBe(false);
    expect(policyAllowsScript('https://static.cloudflareinsights.com/beacon.min.js', EXACT_FILE)).toBe(true);
    expect(policyAllowsScript('https://static.cloudflareinsights.com/beacon.min.js?x=1', EXACT_FILE)).toBe(true);
  });

  it('matches a source that ends in a slash by prefix, and falls back to default-src', () => {
    expect(policyAllowsScript(INJECTED_SRC, "script-src https://static.cloudflareinsights.com/beacon.min.js/")).toBe(true);
    expect(policyAllowsScript(INJECTED_SRC, "default-src 'self'")).toBe(false);
  });
});

describe('collectPolicies and findAnalyticsScriptSources', () => {
  it('reads the header and every meta policy, and each analytics script address', () => {
    const html = `<meta http-equiv="Content-Security-Policy" content="${EXACT_FILE}">${INJECTED_PAGE}`;
    expect(collectPolicies(html, HOST_WIDE)).toEqual([HOST_WIDE, EXACT_FILE]);
    expect(findAnalyticsScriptSources(html)).toEqual([INJECTED_SRC]);
  });
});

describe('checkLiveInjection', () => {
  it('passes clean pages', async () => {
    expect(await checkLiveInjection(['https://example.test/'], page(200, CLEAN_PAGE, EXACT_FILE))).toEqual({ failures: [], notes: [] });
  });

  it('fails when the policies would let the injected script run', async () => {
    const { failures, notes } = await checkLiveInjection(['https://example.test/'], page(200, INJECTED_PAGE, HOST_WIDE));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('https://example.test/');
    expect(failures[0]).toContain('automatic setup');
    expect(notes).toEqual([]);
  });

  it('only notes an injected tag that the header policy blocks', async () => {
    const { failures, notes } = await checkLiveInjection(['https://example.test/'], page(200, INJECTED_PAGE, EXACT_FILE));
    expect(failures).toEqual([]);
    expect(notes).toHaveLength(1);
  });

  it('still fails when only one of two policies blocks it', async () => {
    const withMeta = `<meta http-equiv="Content-Security-Policy" content="${HOST_WIDE}">${INJECTED_PAGE}`;
    const { failures } = await checkLiveInjection(['https://example.test/'], page(200, withMeta, HOST_WIDE));
    expect(failures).toHaveLength(1);
  });

  it('blocks when a meta policy blocks it even if the header is wide', async () => {
    const withMeta = `<meta http-equiv="Content-Security-Policy" content="${EXACT_FILE}">${INJECTED_PAGE}`;
    const { failures, notes } = await checkLiveInjection(['https://example.test/'], page(200, withMeta, HOST_WIDE));
    expect(failures).toEqual([]);
    expect(notes).toHaveLength(1);
  });

  it('fails when a page cannot be read, so an outage is not mistaken for a pass', async () => {
    const { failures } = await checkLiveInjection(['https://example.test/'], page(526, ''));
    expect(failures).toEqual(['https://example.test/ answered 526; the page cannot be checked']);
  });

  it('asks the way a browser does, because the edge injects only for browsers', async () => {
    let sent;
    await checkLiveInjection(['https://example.test/'], async (_url, init) => { sent = init.headers; return new Response(CLEAN_PAGE, { status: 200 }); });
    expect(sent).toEqual(BROWSER_HEADERS);
    expect(sent['user-agent']).toMatch(/Mozilla\/5\.0/);
  });
});
