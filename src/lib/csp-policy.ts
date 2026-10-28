/**
 * The one source of every content security policy this site states.
 *
 * Production is GitHub Pages, which sends no custom response header, so the only
 * enforceable policy there is the `<meta http-equiv="Content-Security-Policy">` each
 * layout renders from these constants. The Cloudflare preview host also reads
 * `src/site/_headers`, which `src/scripts/generate-headers.mjs` writes from the same
 * constants, so where header and meta both apply their intersection is the policy itself.
 *
 * Nonces are impossible on a static host. With `'unsafe-inline'` a policy does not stop
 * script injection; it is defence in depth over the real controls, which are how inputs
 * are parsed and how text is rendered.
 *
 * Every consumer imports from here: the two layouts, the model-page isolation check, the
 * headers generator and the post-build header check. Nothing restates a directive.
 */

/** A page under ToolLayout: the Lab, the atlas explorer and, later, the TARA shell. */
export const TOOL_PAGE_CSP = [
  "default-src 'self'",
  // Astro's island hydration and React inline styles need inline script and style.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  // Same origin only: the page may read this site's own data files and can reach no other host.
  "connect-src 'self'",
  "media-src 'self'",
  // Workers are emitted files instantiated by URL; no blob: worker exists.
  "worker-src 'self'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
] as const;

/**
 * A page under BaseLayout. `'wasm-unsafe-eval'` is for pagefind and DuckDB-wasm, both self-hosted.
 * `img-src https:` stays only while blog posts embed external images; it leaves when the dist
 * check lists none (the images are localised first, or those posts break).
 */
export const SITE_PAGE_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
] as const;

export type PolicyDirectives = readonly string[];

/** Joins directives the way a browser reads them and the way the layouts render them. */
export function joinPolicy(directives: PolicyDirectives): string {
  return directives.join('; ');
}

/** The tool page policy as one string: what the model-page check holds every built tool page to. */
export const ISOLATED_POLICY = joinPolicy(TOOL_PAGE_CSP);

/** Directive name to its sources, for a check that compares policies as sets rather than as text. */
export function toAllowedSources(directives: PolicyDirectives): Record<string, string[]> {
  return Object.fromEntries(directives.map((directive) => {
    const [name, ...sources] = directive.trim().split(/\s+/);
    return [name, sources];
  }));
}

/**
 * Site paths served under ToolLayout, as Cloudflare `_headers` patterns. The headers generator
 * writes the tool page policy for each and the site page policy for everything else.
 */
export const TOOL_PAGE_PATH_PATTERNS = ['/atlas/model/*', '/atlas/anatomy/*'] as const;

/**
 * Preview-host-only headers beside the policy. A BCI site's visitors own hardware, so every
 * device and sensor feature is denied. Production cannot send these; that limitation is recorded.
 */
export const PERMISSIONS_POLICY = [
  'camera=()', 'microphone=()', 'geolocation=()', 'bluetooth=()', 'serial=()', 'usb=()', 'hid=()',
  'xr-spatial-tracking=()', 'accelerometer=()', 'gyroscope=()', 'magnetometer=()', 'payment=()',
  'interest-cohort=()',
].join(', ');
