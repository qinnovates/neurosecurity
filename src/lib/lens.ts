/**
 * Dual Lens System — Pure TypeScript state manager
 *
 * Manages the Security / Clinical lens toggle across all Astro islands.
 * Zero React dependencies. Uses localStorage + CustomEvent for cross-island sync.
 */

export type Lens = 'security' | 'both' | 'clinical';

/** localStorage key */
export const LENS_KEY = 'qif-lens';

/** CustomEvent name for cross-island sync */
export const LENS_EVENT = 'qif-lens-change';

/** Human-readable labels per lens */
export const LENS_LABELS: Record<Lens, { name: string; short: string }> = {
  security: { name: 'Security', short: 'SEC' },
  both: { name: 'Both', short: 'ALL' },
  clinical: { name: 'Clinical', short: 'CLN' },
};

/**
 * Per-lens field name preferences.
 * Components use these to relabel columns/headers based on active lens.
 */
export const LENS_DEFAULTS: Record<
  Lens,
  {
    sortField: string;
    visibleColumns: string[];
    collapsedSections: string[];
  }
> = {
  security: {
    sortField: 'niss_score',
    visibleColumns: [
      'technique',
      'tactic',
      'domain',
      'niss_score',
      'severity',
      'attack_vector',
    ],
    collapsedSections: ['clinical_mapping', 'dsm5_reference'],
  },
  both: {
    sortField: 'niss_score',
    visibleColumns: [
      'technique',
      'tactic',
      'domain',
      'niss_score',
      'severity',
      'attack_vector',
      'brain_region',
      'pathway',
      'clinical_severity',
    ],
    collapsedSections: [],
  },
  clinical: {
    sortField: 'clinical_severity',
    visibleColumns: [
      'technique',
      'brain_region',
      'pathway',
      'neurotransmitter',
      'dsm5_category',
      'clinical_severity',
    ],
    collapsedSections: ['attack_vector', 'niss_breakdown'],
  },
};

/**
 * CSS custom property overrides per lens.
 * Applied to document.documentElement on lens change.
 */
export const LENS_COLORS: Record<Lens, Record<string, string>> = {
  security: {
    '--lens-accent': 'var(--color-accent-primary)',
    '--lens-accent-glow': 'var(--color-glow-primary)',
    '--lens-indicator': '#3b82f6',
  },
  both: {
    '--lens-accent': 'var(--color-accent-primary)',
    '--lens-accent-glow': 'var(--color-glow-primary)',
    '--lens-indicator': '#3b82f6',
  },
  clinical: {
    '--lens-accent': 'var(--color-accent-secondary)',
    '--lens-accent-glow': 'var(--color-glow-secondary)',
    '--lens-indicator': '#06b6d4',
  },
};

/** Read current lens from localStorage (defaults to 'both'). */
export function getLens(): Lens {
  if (typeof window === 'undefined') return 'both';
  const stored = localStorage.getItem(LENS_KEY);
  if (stored === 'security' || stored === 'both' || stored === 'clinical') return stored;
  return 'both';
}

/** Set lens, persist to localStorage, update DOM attributes, apply colors, and dispatch sync event. */
export function setLens(lens: Lens): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(LENS_KEY, lens);
  document.documentElement.setAttribute('data-lens', lens);

  // Apply lens-specific CSS custom properties
  const colors = LENS_COLORS[lens];
  for (const [prop, value] of Object.entries(colors)) {
    document.documentElement.style.setProperty(prop, value);
  }

  // Dispatch sync event for all listening islands
  window.dispatchEvent(
    new CustomEvent(LENS_EVENT, { detail: { lens } })
  );
}

/** Cycle through security → both → clinical → security. Returns the new lens. */
export function toggleLens(): Lens {
  const current = getLens();
  const order: Lens[] = ['security', 'both', 'clinical'];
  const next = order[(order.indexOf(current) + 1) % order.length];
  setLens(next);
  return next;
}
