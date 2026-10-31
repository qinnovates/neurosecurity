import { describe, expect, it } from 'vitest';
import { BROWSER_HEADERS, checkLiveInjection, hasInjectedAnalytics } from '../check-live-injection.mjs';

const CLEAN_PAGE = '<html><head><script type="module" src="/js/consent.js"></script></head><body>privacy</body></html>';
const INJECTED_PAGE = '<html><head></head><body><script defer src="https://static.cloudflareinsights.com/beacon.min.js/v1" data-cf-beacon=\'{"token":"x"}\'></script></body></html>';

const answer = (status, body) => async () => new Response(body, { status });

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

describe('checkLiveInjection', () => {
  it('passes clean pages and fails each page that carries the tag', async () => {
    expect(await checkLiveInjection(['https://example.test/'], answer(200, CLEAN_PAGE))).toEqual([]);
    const failures = await checkLiveInjection(['https://example.test/', 'https://example.test/privacy/'], answer(200, INJECTED_PAGE));
    expect(failures).toHaveLength(2);
    expect(failures[0]).toContain('https://example.test/');
    expect(failures[0]).toContain('automatic setup');
  });

  it('fails when a page cannot be read, so an outage is not mistaken for a pass', async () => {
    const failures = await checkLiveInjection(['https://example.test/'], answer(526, ''));
    expect(failures).toEqual(['https://example.test/ answered 526; the page cannot be checked']);
  });

  it('asks the way a browser does, because the edge injects only for browsers', async () => {
    let sent;
    await checkLiveInjection(['https://example.test/'], async (_url, init) => { sent = init.headers; return new Response(CLEAN_PAGE, { status: 200 }); });
    expect(sent).toEqual(BROWSER_HEADERS);
    expect(sent['user-agent']).toMatch(/Mozilla\/5\.0/);
    expect(sent.accept).toContain('text/html');
  });
});
