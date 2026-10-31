/**
 * Consent for the one optional thing this site can do: count page views with Google Analytics.
 *
 * Nothing is sent to Google, and the Google script is not even requested, until a visitor
 * presses "Accept analytics". "Reject analytics" and "Accept analytics" are the same size and
 * weight. A browser that sends Global Privacy Control is treated as a rejection and is not
 * asked. The choice is kept in localStorage for 180 days, then asked again, and can be changed
 * from any element marked data-consent-open (the footer's "Privacy choices").
 *
 * Plain module, no dependencies, no eval, no markup built from strings: every node is made with
 * createElement and textContent.
 */

export const CONSENT_KEY = 'qinnovate-consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
export const ANALYTICS_ID = 'G-DKB9RWW0C2';

const ANALYTICS_COOKIE_SECONDS = CONSENT_MAX_AGE_MS / 1000;
const GTAG_URL = 'https://www.googletagmanager.com/gtag/js?id=';
const PRIVACY_PATH = '/privacy/';
const BANNER_ID = 'qinnovate-consent-banner';
const STYLE_ID = 'qinnovate-consent-style';
const CLOCK_SKEW_MS = 60 * 1000;

/** @returns {{ analytics: boolean, decidedAt: number } | null} null when absent, malformed, from another version, or older than 180 days */
export function parseConsent(raw, now) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (value === null || typeof value !== 'object' || value.version !== CONSENT_VERSION) return null;
  if (typeof value.analytics !== 'boolean' || !Number.isFinite(value.decidedAt)) return null;
  const age = now - value.decidedAt;
  if (age < -CLOCK_SKEW_MS || age >= CONSENT_MAX_AGE_MS) return null;
  return { analytics: value.analytics, decidedAt: value.decidedAt };
}

export function readConsent(storage, now = Date.now()) {
  try {
    const raw = storage?.getItem(CONSENT_KEY);
    return typeof raw === 'string' ? parseConsent(raw, now) : null;
  } catch {
    return null; // storage blocked: behave as if the visitor has not chosen
  }
}

/** Stores the choice. The returned record is used even when storage refuses it, so the visitor's click still takes effect on this page. */
export function writeConsent(storage, analytics, now = Date.now()) {
  const record = { analytics, decidedAt: now };
  try {
    storage?.setItem(CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, ...record }));
  } catch {
    // The choice holds for this page view only.
  }
  return record;
}

/** A visitor is asked only when they have not chosen and have not already said no through Global Privacy Control. */
export function shouldAskVisitor(consent, globalPrivacyControl) {
  return consent === null && globalPrivacyControl !== true;
}

export function isAnalyticsAllowed(consent) {
  return consent !== null && consent.analytics === true;
}

export function loadAnalytics(win, doc) {
  if (win.__qinnovateAnalyticsLoaded === true) {
    win[`ga-disable-${ANALYTICS_ID}`] = false;
    return;
  }
  win.__qinnovateAnalyticsLoaded = true;
  win.dataLayer = win.dataLayer || [];
  win.gtag = function gtag() {
    win.dataLayer.push(arguments);
  };
  win.gtag('js', new Date());
  win.gtag('config', ANALYTICS_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: ANALYTICS_COOKIE_SECONDS,
    cookie_flags: 'SameSite=Lax;Secure',
  });
  const script = doc.createElement('script');
  script.async = true;
  script.src = `${GTAG_URL}${encodeURIComponent(ANALYTICS_ID)}`;
  doc.head.appendChild(script);
}

function hostCandidates(hostname) {
  const parts = hostname.split('.');
  return parts.slice(0, Math.max(parts.length - 1, 1)).map((_, index) => parts.slice(index).join('.'));
}

/** Stops measurement and deletes the cookies the tag set, on this host and its parent domains. */
export function withdrawAnalytics(win, doc) {
  win[`ga-disable-${ANALYTICS_ID}`] = true;
  const names = doc.cookie.split(';').map((pair) => pair.split('=')[0].trim()).filter((name) => name === '_ga' || name.startsWith('_ga_'));
  for (const name of names) {
    for (const domain of ['', ...hostCandidates(win.location.hostname).flatMap((host) => [host, `.${host}`])]) {
      const scope = domain === '' ? '' : `; domain=${domain}`;
      doc.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${scope}`;
    }
  }
}

const BANNER_CSS = `
#${BANNER_ID}{position:fixed;z-index:2147483000;left:max(1rem,env(safe-area-inset-left,0px));right:max(1rem,env(safe-area-inset-right,0px));bottom:max(1rem,env(safe-area-inset-bottom,0px));max-width:38rem;margin-inline:auto;padding:1.125rem 1.25rem;border:1px solid rgba(255,255,255,.28);border-radius:.75rem;background:#0b0b10;color:#e8e8ee;font:400 .875rem/1.55 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.55)}
#${BANNER_ID} h2{margin:0 0 .375rem;font:600 1rem/1.3 "Space Grotesk",Inter,system-ui,sans-serif;color:#fff}
#${BANNER_ID} p{margin:0 0 .5rem}
#${BANNER_ID} a{color:#9bbcff;text-decoration:underline}
#${BANNER_ID} .qc-actions{display:flex;flex-wrap:wrap;gap:.625rem;margin-top:.875rem}
#${BANNER_ID} button{flex:1 1 9rem;min-height:2.75rem;padding:.5rem 1rem;border:1px solid #1d5fe6;border-radius:.5rem;background:#1d5fe6;color:#fff;font:600 .875rem/1.2 inherit;cursor:pointer}
#${BANNER_ID} button:hover{background:#2468f0}
#${BANNER_ID} button:focus-visible,#${BANNER_ID} a:focus-visible{outline:3px solid #fff;outline-offset:2px}
.qc-reopen{padding:.5rem .25rem;border:0;background:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}
`;

function ensureStyle(doc) {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = BANNER_CSS;
  doc.head.appendChild(style);
}

function element(doc, tag, text, attributes = {}) {
  const node = doc.createElement(tag);
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function choiceButton(doc, label, onChoose) {
  const button = element(doc, 'button', label, { type: 'button' });
  button.addEventListener('click', onChoose);
  return button;
}

function describeCurrentChoice(consent) {
  if (consent === null) return null;
  return consent.analytics ? 'Your current choice: analytics accepted.' : 'Your current choice: analytics rejected.';
}

export function removeBanner(doc) {
  doc.getElementById(BANNER_ID)?.remove();
}

export function renderBanner(doc, consent, onChoose) {
  removeBanner(doc);
  ensureStyle(doc);
  const banner = element(doc, 'section', undefined, { id: BANNER_ID, role: 'region', 'aria-labelledby': 'qc-title' });
  banner.append(element(doc, 'h2', 'Privacy choices', { id: 'qc-title' }));
  banner.append(element(doc, 'p', 'We would like to use Google Analytics to count which pages are read. If you accept, it sets two cookies and sends usage data to Google. If you reject or do not choose, nothing is sent and no analytics cookie is set.'));
  const current = describeCurrentChoice(consent);
  if (current !== null) banner.append(element(doc, 'p', current));
  const policy = element(doc, 'p');
  policy.append(element(doc, 'a', 'How this site handles data', { href: PRIVACY_PATH }), doc.createTextNode('. You can change your choice at any time from Privacy choices in the footer.'));
  banner.append(policy);
  const actions = element(doc, 'div', undefined, { class: 'qc-actions' });
  actions.append(choiceButton(doc, 'Reject analytics', () => onChoose(false)), choiceButton(doc, 'Accept analytics', () => onChoose(true)));
  banner.append(actions);
  doc.body.appendChild(banner);
}

/** Static pages have no shared footer component, so give them the same way back to the choice. */
function ensureReopenControl(doc) {
  if (doc.querySelector('[data-consent-open]') !== null) return;
  const footer = doc.querySelector('footer');
  if (footer === null) return;
  ensureStyle(doc);
  footer.append(element(doc, 'button', 'Privacy choices', { type: 'button', class: 'qc-reopen', 'data-consent-open': '' }));
}

export function startConsent(win, doc, storage) {
  const globalPrivacyControl = win.navigator.globalPrivacyControl === true;
  let consent = readConsent(storage);
  let isFirstPage = true;

  const apply = () => {
    if (isAnalyticsAllowed(consent)) loadAnalytics(win, doc);
    else if (win.__qinnovateAnalyticsLoaded === true) withdrawAnalytics(win, doc);
  };
  const choose = (analytics) => {
    consent = writeConsent(storage, analytics);
    removeBanner(doc);
    apply();
  };
  const show = () => renderBanner(doc, consent, choose);

  apply();
  ensureReopenControl(doc);
  if (shouldAskVisitor(consent, globalPrivacyControl)) show();

  doc.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-consent-open]') !== null) {
      event.preventDefault();
      show();
    }
  });
  // Astro's client router swaps the body between pages, which removes the banner and the footer control.
  doc.addEventListener('astro:page-load', () => {
    ensureReopenControl(doc);
    if (shouldAskVisitor(consent, globalPrivacyControl) && doc.getElementById(BANNER_ID) === null) show();
    if (!isFirstPage && isAnalyticsAllowed(consent)) win.gtag?.('event', 'page_view', { page_location: win.location.href, page_title: doc.title });
    isFirstPage = false;
  });
  return { getConsent: () => consent };
}

function readStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

if (typeof document !== 'undefined' && globalThis.__qinnovateConsentDisabled !== true) {
  startConsent(window, document, readStorage());
}
