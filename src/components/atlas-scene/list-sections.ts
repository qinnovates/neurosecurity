/**
 * The region list's sections: the bands, and then the regions the active lens
 * holds nothing for.
 *
 * Why they are separated rather than sorted together: under the NISS lens 31
 * of 38 regions hold no value. Left among the bands they read as the quiet end
 * of a ranking, and any ordering by value would place them next to "low". A
 * region nobody has assessed is not a low one, so it is listed under its own
 * heading, below every band, where the count makes the atlas's sparsity
 * visible instead of hiding it between bands.
 *
 * Under the band lens every region holds a value, so there is one section per
 * band and this group does not appear at all.
 */

import type { BandGroup, RegionRow } from '@/lib/atlas-explorer/region-rows';

export const NOT_ASSESSED_KEY = 'not_assessed';
export const NOT_ASSESSED_NAME = 'Not assessed';

export interface ListSection {
  key: string;
  /** The band's code, for the spine in the gutter. Null for the not-assessed group, which belongs to no band. */
  code: string | null;
  name: string;
  rows: RegionRow[];
  /** Rows the section holds before filtering, so a filtered list can say how many it hides. */
  totalRows: number;
  isNotAssessed: boolean;
}

function holdsNothing(row: RegionRow): boolean {
  return row.lens.standing === 'no_data';
}

/**
 * @param filtered the band groups as the filter leaves them, in band order
 * @param unfiltered the same groups before the filter, for each section's own total
 */
export function listSections(filtered: readonly BandGroup[], unfiltered: readonly BandGroup[]): ListSection[] {
  const assessedTotals = new Map(unfiltered.map((group) => [group.band.id, group.rows.filter((row) => !holdsNothing(row)).length]));
  const bands = filtered.map((group): ListSection => ({
    key: group.band.id,
    code: group.band.id,
    name: group.band.name,
    rows: group.rows.filter((row) => !holdsNothing(row)),
    totalRows: assessedTotals.get(group.band.id) ?? 0,
    isNotAssessed: false,
  }));
  const total = unfiltered.reduce((count, group) => count + group.rows.filter(holdsNothing).length, 0);
  if (total === 0) return bands;
  return [...bands, {
    key: NOT_ASSESSED_KEY,
    code: null,
    name: NOT_ASSESSED_NAME,
    rows: filtered.flatMap((group) => group.rows.filter(holdsNothing)),
    totalRows: total,
    isNotAssessed: true,
  }];
}

/** The ids of the rows on screen, top to bottom: the order the arrow keys walk. */
export function listSectionRowIds(sections: readonly ListSection[]): string[] {
  return sections.flatMap((section) => section.rows.map((row) => row.id));
}
