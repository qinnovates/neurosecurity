// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

globalThis.__qinnovateConsentDisabled = true;
const consent = await import('../../site/js/consent.js');

const NOW = Date.UTC(2026, 9, 30);
const DAY = 24 * 60 * 60 * 1000;

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), peek: (key) => values.get(key) };
}

const stored = (analytics, decidedAt, version = consent.CONSENT_VERSION) => JSON.stringify({ version, analytics, decidedAt });

describe('parseConsent', () => {
  it('accepts a fresh record and rejects anything else', () => {
    expect(consent.parseConsent(stored(true, NOW - DAY), NOW)).toEqual({ analytics: true, decidedAt: NOW - DAY });
    expect(consent.parseConsent(stored(true, NOW - 181 * DAY), NOW)).toBeNull();
    expect(consent.parseConsent(stored(true, NOW + 10 * DAY), NOW)).toBeNull();
    expect(consent.parseConsent(stored(true, NOW - DAY, 0), NOW)).toBeNull();
    expect(consent.parseConsent('{"version":2,"analytics":"yes","decidedAt":1}', NOW)).toBeNull();
    expect(consent.parseConsent('not json', NOW)).toBeNull();
    expect(consent.parseConsent('null', NOW)).toBeNull();
  });
});

describe('shouldAskVisitor', () => {
  it('asks only a visitor who has not chosen and has not sent Global Privacy Control', () => {
    expect(consent.shouldAskVisitor(null, false)).toBe(true);
    expect(consent.shouldAskVisitor(null, true)).toBe(false);
    expect(consent.shouldAskVisitor({ analytics: false, decidedAt: NOW }, false)).toBe(false);
  });

  it('treats only an explicit acceptance as permission', () => {
    expect(consent.isAnalyticsAllowed(null)).toBe(false);
    expect(consent.isAnalyticsAllowed({ analytics: false, decidedAt: NOW })).toBe(false);
    expect(consent.isAnalyticsAllowed({ analytics: true, decidedAt: NOW })).toBe(true);
  });
});

describe('storage', () => {
  it('round-trips a choice and survives storage that throws', () => {
    const storage = memoryStorage();
    consent.writeConsent(storage, true, NOW);
    expect(consent.readConsent(storage, NOW)).toEqual({ analytics: true, decidedAt: NOW });
    const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(consent.readConsent(blocked, NOW)).toBeNull();
    expect(consent.writeConsent(blocked, false, NOW)).toEqual({ analytics: false, decidedAt: NOW });
  });
});

describe('startConsent', () => {
  beforeAll(() => {
    Object.defineProperty(window.navigator, 'globalPrivacyControl', { value: false, configurable: true, writable: true });
  });

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<footer></footer>';
    delete window.__qinnovateAnalyticsLoaded;
  });

  afterEach(() => {
    window.navigator.globalPrivacyControl = false;
  });

  const beacons = () => [...document.head.querySelectorAll('script')].filter((script) => script.src.includes('cloudflareinsights'));
  const buttons = () => [...document.querySelectorAll('#qinnovate-consent-banner button')];
  const noReload = () => {};

  it('requests nothing until the visitor accepts all, offers three equal first-layer choices, then adds only Cloudflare', () => {
    consent.startConsent(window, document, memoryStorage(), noReload);
    expect(beacons()).toHaveLength(0);
    expect(buttons().map((button) => button.textContent)).toEqual(['Necessary only', 'Customize', 'Accept all']);
    buttons()[2].click();
    expect(beacons()).toHaveLength(1);
    expect(JSON.parse(beacons()[0].getAttribute('data-cf-beacon')).token).toMatch(/^[0-9a-f]{32}$/);
    expect([...document.head.querySelectorAll('script')].every((script) => script.src === '' || script.src.startsWith('https://static.cloudflareinsights.com/'))).toBe(true);
    expect(document.getElementById('qinnovate-consent-banner')).toBeNull();
  });

  it('keeps analytics off after "Necessary only" and remembers it', () => {
    const storage = memoryStorage();
    consent.startConsent(window, document, storage, noReload);
    buttons()[0].click();
    expect(beacons()).toHaveLength(0);
    expect(JSON.parse(storage.peek(consent.CONSENT_KEY)).analytics).toBe(false);
  });

  it('does not ask again, and loads analytics at once, for a visitor who accepted earlier', () => {
    consent.startConsent(window, document, memoryStorage({ [consent.CONSENT_KEY]: stored(true, Date.now()) }), noReload);
    expect(document.getElementById('qinnovate-consent-banner')).toBeNull();
    expect(beacons()).toHaveLength(1);
  });

  it('does not ask a browser that sends Global Privacy Control, and sends nothing', () => {
    window.navigator.globalPrivacyControl = true;
    consent.startConsent(window, document, memoryStorage(), noReload);
    expect(document.getElementById('qinnovate-consent-banner')).toBeNull();
    expect(beacons()).toHaveLength(0);
  });

  it('lets a visitor reopen the choice and withdraw, which reloads the page to stop the running script', () => {
    let reloads = 0;
    consent.startConsent(window, document, memoryStorage({ [consent.CONSENT_KEY]: stored(true, Date.now()) }), () => { reloads += 1; });
    document.querySelector('[data-consent-open]').click();
    expect(document.getElementById('qinnovate-consent-banner').textContent).toContain('Your current choice: analytics on.');
    buttons()[0].click();
    expect(reloads).toBe(1);
  });

  const labelled = () => [...document.querySelectorAll('#qinnovate-consent-banner button')].map((button) => button.textContent);
  const analyticsBox = () => document.getElementById('qc-analytics');

  it('opens a category list with the necessary storage locked on and analytics off', () => {
    consent.startConsent(window, document, memoryStorage(), noReload);
    buttons()[1].click();
    const banner = document.getElementById('qinnovate-consent-banner');
    expect(banner.textContent).toContain('Strictly necessary');
    expect(banner.textContent).toContain('Always on');
    expect(analyticsBox().type).toBe('checkbox');
    expect(analyticsBox().checked).toBe(false);
    expect(labelled()).toEqual(['Save choices', 'Back']);
    expect(beacons()).toHaveLength(0);
  });

  it('saves the analytics switch as the choice, and leaves it off by default', () => {
    const storage = memoryStorage();
    consent.startConsent(window, document, storage, noReload);
    buttons()[1].click();
    buttons()[0].click();
    expect(JSON.parse(storage.peek(consent.CONSENT_KEY)).analytics).toBe(false);
    expect(beacons()).toHaveLength(0);
    document.querySelector('[data-consent-open]').click();
    buttons()[1].click();
    analyticsBox().checked = true;
    buttons()[0].click();
    expect(JSON.parse(storage.peek(consent.CONSENT_KEY)).analytics).toBe(true);
    expect(beacons()).toHaveLength(1);
  });

  it('returns from the category list to the first layer and shows the saved choice when reopened', () => {
    consent.startConsent(window, document, memoryStorage({ [consent.CONSENT_KEY]: stored(true, Date.now()) }), noReload);
    document.querySelector('[data-consent-open]').click();
    buttons()[1].click();
    expect(analyticsBox().checked).toBe(true);
    buttons()[1].click();
    expect(labelled()).toEqual(['Necessary only', 'Customize', 'Accept all']);
  });

  it('gives the switch an accessible name and moves focus to the new heading', () => {
    consent.startConsent(window, document, memoryStorage(), noReload);
    buttons()[1].click();
    expect(analyticsBox().getAttribute('aria-labelledby')).toBe('qc-analytics-name');
    expect(document.getElementById('qc-analytics-name').textContent).toBe('Analytics');
    expect(document.activeElement.id).toBe('qc-title');
  });

  it('builds the banner from text nodes only', () => {
    consent.startConsent(window, document, memoryStorage(), noReload);
    const banner = document.getElementById('qinnovate-consent-banner');
    expect(banner.querySelector('a').getAttribute('href')).toBe('/privacy/');
    expect(banner.querySelectorAll('script, img, iframe')).toHaveLength(0);
  });
});
