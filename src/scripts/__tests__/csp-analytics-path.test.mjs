import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_PAGE_CSP } from '../../lib/csp-policy.ts';

const BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js';
const CONSENT_SCRIPT = fs.readFileSync(path.resolve(import.meta.dirname, '../../site/js/consent.js'), 'utf8');

const scriptSources = () => SITE_PAGE_CSP.find((directive) => directive.startsWith('script-src ')).split(/\s+/).slice(1);

describe('the analytics script source', () => {
  it('names the one file the consent script loads, so the edge-injected versioned path stays blocked', () => {
    const sources = scriptSources();
    expect(sources).toContain(BEACON_URL);
    expect(sources).not.toContain('https://static.cloudflareinsights.com');
    expect(BEACON_URL.endsWith('/')).toBe(false);
  });

  it('is the address consent.js adds, so the two cannot drift apart', () => {
    expect(CONSENT_SCRIPT).toContain(`'${BEACON_URL}'`);
  });
});
