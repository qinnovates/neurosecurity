/**
 * The sentences of the homepage brain hero: what it says while the 3D view
 * loads, when it cannot load, and beside the picture before and after a region
 * is picked. Held apart from limits-copy.ts for the same reason as
 * mount-copy.ts: the hero's shell ships with the homepage, and the whole limit
 * table must not load there to say a few sentences. The limits of the picture
 * itself come from the view's own caption, not from here. This module imports
 * nothing.
 */
export const HERO_COPY = {
  loading: 'Loading the 3D brain…',
  failed: 'The 3D brain could not be loaded. The full atlas has everything it would show.',
  idle_title: 'Pick a region',
  idle: 'Turn the brain and pick a region to see what the TARA catalog links to it. Each link was drafted by an AI and no expert has checked it.',
  selected_bands: 'QIF band',
  selected_links: 'Techniques linked',
  /** How many drafted links reach the region, and how many of them pass the index's checks and so count in the picture. */
  selected_links_value: (lit: number, drafted: number): string => {
    if (drafted === 0) return 'No linked techniques yet.';
    if (lit === drafted) return `${drafted} technique${drafted === 1 ? '' : 's'} linked.`;
    return `${drafted} technique${drafted === 1 ? '' : 's'} linked, ${lit} shown under the current lens.`;
  },
  selected_announcement: (name: string): string => `Selected: ${name}. Its summary is beside the picture.`,
  /** The card's two sections after a pick: the region's risks, then the devices whose records name it. */
  risks_title: 'Risks linked to this region',
  risks_note: 'Each link was drafted by an AI; none has been checked by an expert.',
  risks_none: 'No linked techniques yet.',
  risks_more: (hiddenCount: number): string => `${hiddenCount} more in the full atlas.`,
  risk_step: (step: string, count: number): string => `Highest NISS step: ${step}, across ${count} linked technique${count === 1 ? '' : 's'}.`,
  devices_title: 'Devices whose record lists this region',
  devices_none: 'No device record lists this region yet.',
  see_details: 'See its details',
  fallback_title: 'The regions in the atlas',
  fallback: 'Each opens the full atlas with that region selected.',
} as const;
