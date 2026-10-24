import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ISOLATED_POLICY, SITE_PAGE_CSP, TOOL_PAGE_CSP, TOOL_PAGE_PATH_PATTERNS, joinPolicy } from '../../lib/csp-policy.ts';
import { HEADERS_FILE, renderHeaders } from '../generate-headers.mjs';
import { expectedPolicies, findHeaderPolicyFailures, readPolicyLines } from '../check-headers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LAYOUTS = ['src/layouts/BaseLayout.astro', 'src/layouts/ToolLayout.astro'];
const POLICY_META_PATTERN = /http-equiv="Content-Security-Policy"/g;
const MODULE_IMPORT_PATTERN = /from '\.\.\/lib\/csp-policy'/;
/** Hosts that left with the browser tutor and the analytics beacon; none may come back through any policy. */
const RETIRED_HOSTS = ['api.openai.com', 'api.anthropic.com', 'cloudflareinsights.com'];
/** Metas a static host cannot enforce; their presence would claim a control that does not exist. */
const NO_OP_METAS = ['http-equiv="Permissions-Policy"', 'http-equiv="Cross-Origin-Opener-Policy"', 'http-equiv="X-Content-Type-Options"', 'http-equiv="Referrer-Policy"'];

const readSource = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');

describe('csp-policy.ts is the only source of a policy', () => {
  it.each(LAYOUTS)('%s imports the module and renders exactly one policy meta', (layout) => {
    const source = readSource(layout);
    expect(source).toMatch(MODULE_IMPORT_PATTERN);
    expect(source.match(POLICY_META_PATTERN)).toHaveLength(1);
    for (const meta of NO_OP_METAS) expect(source).not.toContain(meta);
    expect(source).not.toContain('cloudflareinsights');
  });

  it('names no retired host and no blob: worker in either policy', () => {
    for (const policy of [joinPolicy(SITE_PAGE_CSP), ISOLATED_POLICY]) {
      for (const host of RETIRED_HOSTS) expect(policy).not.toContain(host);
      expect(policy).not.toContain('blob:');
      expect(policy).toContain("worker-src 'self'");
      expect(policy).toContain("media-src 'self'");
    }
    expect(joinPolicy(TOOL_PAGE_CSP)).not.toContain('wasm-unsafe-eval');
  });

  it('writes the committed _headers byte for byte from the module', () => {
    expect(fs.readFileSync(HEADERS_FILE, 'utf-8')).toBe(renderHeaders());
  });

  it('adds the robots header only to a preview build', () => {
    expect(renderHeaders({ preview: true })).toContain('X-Robots-Tag: noindex, nofollow');
    expect(renderHeaders()).not.toContain('X-Robots-Tag');
  });

  it('reads one policy per path group back out of the rendered file', () => {
    const policies = readPolicyLines(renderHeaders());
    expect([...policies.keys()]).toEqual(['/*', ...TOOL_PAGE_PATH_PATTERNS]);
    expect(policies).toEqual(expectedPolicies());
  });

  it('fails the post-build check when a built _headers states a different policy', () => {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'headers-check-'));
    fs.writeFileSync(path.join(dist, '_headers'), renderHeaders());
    expect(findHeaderPolicyFailures(dist)).toEqual([]);
    fs.writeFileSync(path.join(dist, '_headers'), renderHeaders().replace("connect-src 'self'; media-src 'self'; worker-src 'self'; object-src", "connect-src *; media-src 'self'; worker-src 'self'; object-src"));
    expect(findHeaderPolicyFailures(dist)).toEqual(['_headers: the policy under /* differs from csp-policy.ts']);
    fs.rmSync(path.join(dist, '_headers'));
    expect(findHeaderPolicyFailures(dist)[0]).toMatch(/_headers was not emitted/);
  });
});
