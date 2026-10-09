#!/usr/bin/env node
/**
 * Opens one built page in a real browser and records what it does: every request,
 * console line, page error and content-security-policy violation, before and after an
 * optional button press. Evidence for a pull request, not a test that runs in CI.
 *
 * Playwright is deliberately not a dependency of this repository. Supply it yourself:
 * either set PLAYWRIGHT_MODULE to the directory of an installed `playwright` package,
 * or run this where `playwright` resolves. Without it, follow atlas-checklist.md by hand.
 *
 * Usage (serve the production build first: `npm run build && npm run preview`):
 *   node src/scripts/browser-evidence/run-browser-evidence.mjs \
 *     --base-url http://127.0.0.1:4321 --out <directory> [--page /atlas/model/] \
 *     [--press <css selector>] [--wait-for <css selector>] [--forbid-request <text>]... \
 *     [--reduced-motion] [--disable-webgl] [--allow-remote]
 *
 * Writes evidence.json and screenshots into --out. Exits 1 when the page made a request to
 * another origin, violated its policy, threw an error, or requested something forbidden;
 * 2 when it could not run.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const DEFAULT_PAGE_URL_PATH = '/atlas/model/';
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);
const VIEWPORT = { width: 1280, height: 1100 };
const SETTLE_MS = 800;
const WAIT_TIMEOUT_MS = 20_000;
const EXIT_FINDINGS = 1;
const EXIT_COULD_NOT_RUN = 2;
/** Full Chromium in headless mode. The lighter headless shell has no WebGL on some machines. */
const BROWSER_CHANNEL = 'chromium';
const DISABLE_WEBGL_ARGUMENT = '--disable-3d-apis';
const VIOLATION_BINDING = 'recordPolicyViolation';
/** URLs the browser resolves in memory. They never reach a network, so they are not another origin. */
const IN_MEMORY_URL_PATTERN = /^(data|blob|about):/i;

class EvidenceRunError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EvidenceRunError';
  }
}

function readValue(argumentList, index, flag) {
  const value = argumentList[index];
  if (value === undefined || value.startsWith('--')) throw new EvidenceRunError(`${flag} needs a value.`);
  return value;
}

function parseArguments(argumentList) {
  const options = { baseUrl: null, outDirectory: null, pageUrlPath: DEFAULT_PAGE_URL_PATH, pressSelector: null, waitForSelector: null, forbiddenRequests: [], isMotionReduced: false, isWebGLDisabled: false, isRemoteAllowed: false };
  for (let index = 0; index < argumentList.length; index += 1) {
    const flag = argumentList[index];
    if (flag === '--base-url') options.baseUrl = readValue(argumentList, ++index, flag);
    else if (flag === '--out') options.outDirectory = readValue(argumentList, ++index, flag);
    else if (flag === '--page') options.pageUrlPath = readValue(argumentList, ++index, flag);
    else if (flag === '--press') options.pressSelector = readValue(argumentList, ++index, flag);
    else if (flag === '--wait-for') options.waitForSelector = readValue(argumentList, ++index, flag);
    else if (flag === '--forbid-request') options.forbiddenRequests.push(readValue(argumentList, ++index, flag));
    else if (flag === '--reduced-motion') options.isMotionReduced = true;
    else if (flag === '--disable-webgl') options.isWebGLDisabled = true;
    else if (flag === '--allow-remote') options.isRemoteAllowed = true;
    else throw new EvidenceRunError(`Unknown argument "${flag}". See the usage note at the top of this script.`);
  }
  return options;
}

/** Returns the origin to test, refusing anything that is not this machine unless asked. */
function validateTarget(options) {
  if (options.baseUrl === null || options.outDirectory === null) {
    throw new EvidenceRunError('Both --base-url and --out are required. See the usage note at the top of this script.');
  }
  if (!options.pageUrlPath.startsWith('/')) throw new EvidenceRunError('--page needs a site path that starts with "/".');
  let target;
  try {
    target = new URL(options.baseUrl);
  } catch (parseError) {
    throw new EvidenceRunError(`--base-url "${options.baseUrl}" is not a URL (${parseError instanceof Error ? parseError.message : String(parseError)}).`);
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') throw new EvidenceRunError('--base-url must be an http or https URL.');
  if (!LOOPBACK_HOSTS.has(target.hostname) && !options.isRemoteAllowed) {
    throw new EvidenceRunError(`--base-url host "${target.hostname}" is not this machine. Serve the build locally, or pass --allow-remote for a site you own.`);
  }
  return target.origin;
}

async function loadPlaywright() {
  const modulePath = process.env.PLAYWRIGHT_MODULE;
  try {
    if (modulePath !== undefined && modulePath !== '') return createRequire(import.meta.url)(path.resolve(modulePath));
    return await import('playwright');
  } catch (loadError) {
    throw new EvidenceRunError(
      'Playwright is not installed, and it is deliberately not a dependency of this repository. '
      + 'Set PLAYWRIGHT_MODULE to the directory of an installed "playwright" package, or follow '
      + `src/scripts/browser-evidence/atlas-checklist.md by hand. (${loadError instanceof Error ? loadError.message : String(loadError)})`,
    );
  }
}

function watchPage(page, log) {
  page.on('request', (request) => log.requests.push({ url: request.url(), resourceType: request.resourceType(), status: null }));
  page.on('response', (response) => {
    const entry = log.requests.find((request) => request.url === response.url() && request.status === null);
    if (entry !== undefined) entry.status = response.status();
  });
  page.on('requestfailed', (request) => log.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText ?? 'unknown' }));
  page.on('console', (message) => log.console.push(`[${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => log.pageErrors.push(String(error)));
}

/** Records policy violations from outside the page, so a page without its own recorder is covered too. */
async function recordPolicyViolations(page, log) {
  await page.exposeFunction(VIOLATION_BINDING, (violation) => log.policyViolations.push(violation));
  await page.addInitScript((bindingName) => {
    document.addEventListener('securitypolicyviolation', (event) => {
      window[bindingName]({ effectiveDirective: event.effectiveDirective, blockedURI: event.blockedURI, sourceFile: event.sourceFile, lineNumber: event.lineNumber });
    });
  }, VIOLATION_BINDING);
}

async function describeBrowser(page) {
  return page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl');
    const rendererInfo = context?.getExtension('WEBGL_debug_renderer_info');
    return {
      userAgent: navigator.userAgent,
      isWebGLAvailable: context !== null,
      webglRenderer: context && rendererInfo ? context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) : null,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      policyMetaTags: [...document.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]')].map((tag) => tag.getAttribute('content')),
    };
  });
}

async function pressAndSettle(page, options) {
  await page.click(options.pressSelector, { timeout: WAIT_TIMEOUT_MS });
  if (options.waitForSelector !== null) await page.waitForSelector(options.waitForSelector, { timeout: WAIT_TIMEOUT_MS });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(SETTLE_MS);
}

async function collectEvidence(browser, origin, options) {
  const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: options.isMotionReduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const log = { requests: [], failedRequests: [], console: [], pageErrors: [], policyViolations: [] };
  watchPage(page, log);
  await recordPolicyViolations(page, log);
  await page.goto(`${origin}${options.pageUrlPath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS);
  const requestCountOnLoad = log.requests.length;
  const screenshots = ['1-on-load.png'];
  await page.screenshot({ path: path.join(options.outDirectory, screenshots[0]), fullPage: true });
  if (options.pressSelector !== null) {
    await pressAndSettle(page, options);
    screenshots.push('2-after-press.png');
    await page.screenshot({ path: path.join(options.outDirectory, screenshots[1]), fullPage: true });
  }
  const evidence = { page: options.pageUrlPath, origin, browser: await describeBrowser(page), requestCountOnLoad, ...log, screenshots };
  await context.close();
  return evidence;
}

/** Everything in the evidence that breaks the page's promise; empty means the run is clean. */
function findFindings(evidence, origin, forbiddenRequests) {
  const requestUrls = evidence.requests.map((request) => request.url);
  return [
    ...requestUrls.filter((url) => !url.startsWith(`${origin}/`) && !IN_MEMORY_URL_PATTERN.test(url)).map((url) => `request to another origin: ${url}`),
    ...evidence.policyViolations.map((violation) => `policy violation: ${violation.effectiveDirective} blocked ${violation.blockedURI || '(inline)'}`),
    ...evidence.pageErrors.map((error) => `page error: ${error}`),
    ...requestUrls.filter((url) => forbiddenRequests.some((text) => url.includes(text))).map((url) => `forbidden request: ${url}`),
  ];
}

async function run(argumentList) {
  const options = parseArguments(argumentList);
  const origin = validateTarget(options);
  const { chromium } = await loadPlaywright();
  mkdirSync(options.outDirectory, { recursive: true });
  const browser = await chromium.launch({ channel: BROWSER_CHANNEL, headless: true, args: options.isWebGLDisabled ? [DISABLE_WEBGL_ARGUMENT] : [] });
  try {
    const evidence = await collectEvidence(browser, origin, options);
    const findings = findFindings(evidence, origin, options.forbiddenRequests);
    writeFileSync(path.join(options.outDirectory, 'evidence.json'), `${JSON.stringify({ ...evidence, findings }, null, 2)}\n`);
    process.stdout.write(`[browser-evidence] ${evidence.page}: ${evidence.requests.length} requests (${evidence.requestCountOnLoad} on load), ${findings.length} findings. Written to ${options.outDirectory}\n`);
    for (const finding of findings) process.stderr.write(`[browser-evidence] FINDING: ${finding}\n`);
    return findings.length === 0 ? 0 : EXIT_FINDINGS;
  } finally {
    await browser.close();
  }
}

run(process.argv.slice(2)).then(
  (exitCode) => process.exit(exitCode),
  (error) => {
    process.stderr.write(`[browser-evidence] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(EXIT_COULD_NOT_RUN);
  },
);
