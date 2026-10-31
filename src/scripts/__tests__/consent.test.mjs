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
    expect(consent.parseConsent('{"version":1,"analytics":"yes","decidedAt":1}', NOW)).toBeNull();
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
    delete window.dataLayer;
  });

  afterEach(() => {
    window.navigator.globalPrivacyControl = false;
  });

  const analyticsScripts = () => [...document.head.querySelectorAll('script')].filter((script) => script.src.includes('googletagmanager'));

  it('requests nothing from Google until the visitor accepts, and shows both buttons alike', () => {
    consent.startConsent(window, document, memoryStorage(), () => {});
    expect(analyticsScripts()).toHaveLength(0);
    const buttons = [...document.querySelectorAll('#qinnovate-consent-banner button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['Reject analytics', 'Accept analytics']);
    buttons[1].click();
    expect(analyticsScripts()).toHaveLength(1);
    expect(analyticsScripts()[0].src).toContain(consent.ANALYTICS_ID);
    expect(document.getElementById('qinnovate-consent-banner')).toBeNull();
  });

  it('loads the Cloudflare beacon only after acceptance, and reloads the page on withdrawal', () => {
    const beacons = () => [...document.head.querySelectorAll('script')].filter((script) => script.src.includes('cloudflareinsights'));
    let reloads = 0;
    consent.startConsent(window, document, memoryStorage(), () => { reloads += 1; });
    expect(beacons()).toHaveLength(0);
    [...document.querySelectorAll('#qinnovate-consent-banner button')][1].click();
    expect(beacons()).toHaveLength(1);
    expect(JSON.parse(beacons()[0].getAttribute('data-cf-beacon')).token).toMatch(/^[0-9a-f]{32}$/);
    document.querySelector('[data-consent-open]').click();
    [...document.querySelectorAll('#qinnovate-consent-banner button')][0].click();
    expect(reloads).toBe(1);
  });

  it('keeps analytics off after a rejection and remembers it', () => {
    const storage = memoryStorage();
    consent.startConsent(window, document, storage, () => {});
    [...document.querySelectorAll('#qinnovate-consent-banner button')][0].click();
    expect(analyticsScripts()).toHaveLength(0);
    expect(JSON.parse(storage.peek(consent.CONSENT_KEY)).analytics).toBe(false);
  });

  it('does not ask again, and loads analytics at once, for a visitor who accepted earlier', () => {
    consent.startConsent(window, document, memoryStorage({ [consent.CONSENT_KEY]: stored(true, Date.now()) }), () => { window.__reloaded = true; });
    expect(document.getElementById('qinnovate-consent-banner')).toBeNull();
    expect(analyticsScripts()).toHaveLength(1);
  });

  it('does not ask a browser that sends Global Privacy Control, and sends nothing', () => {
    window.navigator.globalPrivacyControl = true;
    consent.startConsent(window, document, memoryStorage(), () => {});
    expect(document.getElementById('qinnovate-consent-banner')).toBeNull();
    expect(analyticsScripts()).toHaveLength(0);
  });

  it('lets a visitor reopen the choice and withdraw, which stops measurement and clears the cookies', () => {
    consent.startConsent(window, document, memoryStorage({ [consent.CONSENT_KEY]: stored(true, Date.now()) }), () => { window.__reloaded = true; });
    document.cookie = '_ga=GA1.1.1; path=/';
    document.cookie = '_ga_ABC=GS1; path=/';
    document.querySelector('[data-consent-open]').click();
    const banner = document.getElementById('qinnovate-consent-banner');
    expect(banner.textContent).toContain('Your current choice: analytics accepted.');
    [...banner.querySelectorAll('button')][0].click();
    expect(window[`ga-disable-${consent.ANALYTICS_ID}`]).toBe(true);
    expect(document.cookie).not.toContain('_ga');
  });

  it('builds the banner from text nodes only', () => {
    consent.startConsent(window, document, memoryStorage(), () => {});
    const banner = document.getElementById('qinnovate-consent-banner');
    expect(banner.querySelector('a').getAttribute('href')).toBe('/privacy/');
    expect(banner.querySelectorAll('script, img, iframe')).toHaveLength(0);
  });
});
