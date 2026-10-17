/**
 * The hourglass bands in their three groups, in the catalog's own order. The groups come
 * from the catalog's band list; a band that list does not name is kept apart, not guessed.
 */

import { INTERFACE_BAND, SILICON_BANDS, BAND_ORDER } from '@/lib/threat-model/catalog-types';
import type { BandFacetCount } from '@/lib/threat-model/catalog-filter';

export const BAND_GROUP_IDS = ['silicon', 'interface', 'neural', 'other'] as const;
export type BandGroupId = typeof BAND_GROUP_IDS[number];

export const BAND_GROUP_LABELS: Readonly<Record<BandGroupId, string>> = {
  silicon: 'Silicon side',
  interface: 'Interface',
  neural: 'Neural side',
  other: 'Other',
};

/** The one sentence the Lab prints about what a band is. */
export const BAND_LEGEND_SENTENCE =
  'Bands are layers in QIF, a proposed framework that is not peer reviewed. The catalog ties techniques to bands, not to brain regions.';

export function bandGroupOf(bandId: string): BandGroupId {
  if ((SILICON_BANDS as readonly string[]).includes(bandId)) return 'silicon';
  if (bandId === INTERFACE_BAND) return 'interface';
  return (BAND_ORDER as readonly string[]).includes(bandId) ? 'neural' : 'other';
}

export interface BandGroup {
  id: BandGroupId;
  label: string;
  bands: BandFacetCount[];
}

/** The band counts under their groups, groups and bands in the order given; a group with no band is left out. */
export function groupBandCounts(bands: readonly BandFacetCount[]): BandGroup[] {
  return BAND_GROUP_IDS
    .map((id): BandGroup => ({ id, label: BAND_GROUP_LABELS[id], bands: bands.filter((band) => bandGroupOf(band.bandId) === id) }))
    .filter((group) => group.bands.length > 0);
}
