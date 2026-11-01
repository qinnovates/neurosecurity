/**
 * Consent for the one optional thing this site can do: count page views with Cloudflare Web
 * Analytics, which sets no cookie and stores nothing in the browser.
 *
 * The Cloudflare script is not even requested until a visitor presses "Accept all" or turns
 * analytics on under "Customize". "Necessary only" and "Accept all" are the same size and weight,
 * and "Customize" opens a category list with the necessary storage locked on and analytics off.
 * A browser that sends Global Privacy Control is treated as a rejection and is not asked. The
 * choice is kept in localStorage for 180 days, then asked again, and can be changed from any
 * element marked data-consent-open (the footer's "Privacy choices"). Cloudflare's own automatic
 * injection must stay switched off in the Cloudflare dashboard, or it would load the script
 * before any choice.
 *
 * Plain module, no dependencies, no eval, no markup built from strings: every node is made with
 * createElement and textContent.
 */

export const CONSENT_KEY = 'qinnovate-consent';
export const CONSENT_VERSION = 2;
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

const CLOUDFLARE_BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js';
/** The site token Cloudflare already sends every visitor in its injected tag. It identifies the site and is not a secret. */
const CLOUDFLARE_BEACON_TOKEN = '7e92b0e996474c9e9502b816aa36beed';
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

/** Adds Cloudflare Web Analytics once. With spa set it follows the client router's page changes itself. */
export function loadAnalytics(win, doc) {
  if (win.__qinnovateAnalyticsLoaded === true) return;
  win.__qinnovateAnalyticsLoaded = true;
  const beacon = doc.createElement('script');
  beacon.defer = true;
  beacon.src = CLOUDFLARE_BEACON_URL;
  beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: CLOUDFLARE_BEACON_TOKEN, spa: true }));
  doc.head.appendChild(beacon);
}

const BANNER_CSS = `
#${BANNER_ID}{position:fixed;z-index:2147483000;left:max(1rem,env(safe-area-inset-left,0px));right:max(1rem,env(safe-area-inset-right,0px));bottom:max(1rem,env(safe-area-inset-bottom,0px));max-width:38rem;margin-inline:auto;padding:1.25rem 1.375rem;border:1px solid rgba(255,255,255,.14);border-radius:1rem;background:rgba(21,21,28,.86);-webkit-backdrop-filter:blur(14px) saturate(110%);backdrop-filter:blur(14px) saturate(110%);color:#e8e8ee;font:400 .875rem/1.6 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)}
#${BANNER_ID} h2{margin:0 0 .375rem;font:600 1rem/1.3 Inter,system-ui,sans-serif;letter-spacing:-.01em;color:#f5f6f8}
#${BANNER_ID} h2:focus{outline:none}
#${BANNER_ID} p{margin:0 0 .5rem}
#${BANNER_ID} a{color:#7dd3fc;text-decoration:underline;text-underline-offset:3px}
#${BANNER_ID} .qc-actions{display:flex;flex-wrap:wrap;gap:.625rem;margin-top:1rem}
#${BANNER_ID} button{flex:1 1 8rem;min-height:2.75rem;padding:.5rem 1.25rem;border:1px solid #f5f6f8;border-radius:999px;background:#f5f6f8;color:#0b0b10;font:500 .9375rem/1.2 Inter,system-ui,sans-serif;cursor:pointer;transition:transform .25s ease,box-shadow .25s ease}
#${BANNER_ID} button:hover{transform:translateY(-1px);box-shadow:0 4px 14px -8px rgba(14,165,233,.35)}
#${BANNER_ID} button.qc-secondary{background:rgba(255,255,255,.08);border-color:transparent;color:#f5f6f8;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
#${BANNER_ID} button.qc-secondary:hover{background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
#${BANNER_ID} button:focus-visible,#${BANNER_ID} a:focus-visible,#${BANNER_ID} input:focus-visible{outline:2px solid #7dd3fc;outline-offset:3px}
#${BANNER_ID} .qc-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:.75rem 0;border-top:1px solid rgba(255,255,255,.12)}
#${BANNER_ID} .qc-row strong{display:block;color:#f5f6f8;font-weight:500}
#${BANNER_ID} .qc-row span{display:block;color:#a3a7b5}
#${BANNER_ID} .qc-state{flex:none;font-weight:500;color:#a3a7b5;white-space:nowrap}
#${BANNER_ID} .qc-switch{flex:none;display:flex;align-items:center;gap:.5rem;min-height:2.75rem;font-weight:500;color:#f5f6f8;cursor:pointer}
#${BANNER_ID} .qc-switch input{width:1.5rem;height:1.5rem;margin:0;accent-color:#0ea5e9;cursor:pointer}
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

function choiceButton(doc, label, onChoose, extraClass) {
  const button = element(doc, 'button', label, { type: 'button' });
  if (extraClass !== undefined) button.className = extraClass;
  button.addEventListener('click', onChoose);
  return button;
}

function describeCurrentChoice(consent) {
  if (consent === null) return null;
  return consent.analytics ? 'Your current choice: analytics on.' : 'Your current choice: necessary only.';
}

export function removeBanner(doc) {
  doc.getElementById(BANNER_ID)?.remove();
}

function titleNode(doc, text) {
  return element(doc, 'h2', text, { id: 'qc-title', tabindex: '-1' });
}

function renderSummary(doc, banner, consent, onChoose, openPreferences) {
  const nodes = [titleNode(doc, 'Privacy choices')];
  nodes.push(element(doc, 'p', 'This site works without analytics. What it needs to remember your choice and display settings stays in your browser and is never sent to us. With your permission, Cloudflare Web Analytics also counts which pages are read. It sets no cookies.'));
  const current = describeCurrentChoice(consent);
  if (current !== null) nodes.push(element(doc, 'p', current));
  const policy = element(doc, 'p');
  policy.append(element(doc, 'a', 'How this site handles data', { href: PRIVACY_PATH }), doc.createTextNode('. You can change your choice at any time from Privacy choices in the footer.'));
  nodes.push(policy);
  const actions = element(doc, 'div', undefined, { class: 'qc-actions' });
  actions.append(
    choiceButton(doc, 'Necessary only', () => onChoose(false)),
    choiceButton(doc, 'Customize', openPreferences, 'qc-secondary'),
    choiceButton(doc, 'Accept all', () => onChoose(true)),
  );
  nodes.push(actions);
  banner.replaceChildren(...nodes);
}

function renderPreferences(doc, banner, consent, onChoose, backToSummary) {
  const nodes = [titleNode(doc, 'Customize your choices')];
  const necessary = element(doc, 'div', undefined, { class: 'qc-row' });
  const necessaryText = element(doc, 'div');
  necessaryText.append(element(doc, 'strong', 'Strictly necessary'), element(doc, 'span', 'Remembers this choice and your display settings, such as theme, in your browser. Never sent to us.'));
  necessary.append(necessaryText, element(doc, 'span', 'Always on', { class: 'qc-state' }));
  const analytics = element(doc, 'div', undefined, { class: 'qc-row' });
  const analyticsText = element(doc, 'div');
  analyticsText.append(element(doc, 'strong', 'Analytics', { id: 'qc-analytics-name' }), element(doc, 'span', 'Cloudflare Web Analytics counts which pages are read. Off unless you turn it on.', { id: 'qc-analytics-note' }));
  const toggle = element(doc, 'label', undefined, { class: 'qc-switch' });
  const checkbox = element(doc, 'input', undefined, { type: 'checkbox', id: 'qc-analytics', 'aria-labelledby': 'qc-analytics-name', 'aria-describedby': 'qc-analytics-note' });
  checkbox.checked = consent !== null && consent.analytics === true;
  toggle.append(checkbox, doc.createTextNode('Allow'));
  analytics.append(analyticsText, toggle);
  const actions = element(doc, 'div', undefined, { class: 'qc-actions' });
  actions.append(
    choiceButton(doc, 'Save choices', () => onChoose(checkbox.checked)),
    choiceButton(doc, 'Back', backToSummary, 'qc-secondary'),
  );
  nodes.push(necessary, analytics, actions);
  banner.replaceChildren(...nodes);
}

export function renderBanner(doc, consent, onChoose) {
  removeBanner(doc);
  ensureStyle(doc);
  const banner = element(doc, 'section', undefined, { id: BANNER_ID, role: 'region', 'aria-labelledby': 'qc-title' });
  const focusTitle = () => doc.getElementById('qc-title')?.focus();
  const showSummary = () => { renderSummary(doc, banner, consent, onChoose, showPreferences); focusTitle(); };
  const showPreferences = () => { renderPreferences(doc, banner, consent, onChoose, showSummary); focusTitle(); };
  renderSummary(doc, banner, consent, onChoose, showPreferences);
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

export function startConsent(win, doc, storage, reload = () => win.location.reload()) {
  const globalPrivacyControl = win.navigator.globalPrivacyControl === true;
  let consent = readConsent(storage);

  const apply = () => {
    if (isAnalyticsAllowed(consent)) loadAnalytics(win, doc);
    else if (win.__qinnovateAnalyticsLoaded === true) reload(); // a running script cannot be unloaded; a fresh page load is what stops it
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
