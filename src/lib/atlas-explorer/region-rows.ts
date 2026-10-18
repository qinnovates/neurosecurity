/**
 * The region list as data: one row per region, grouped by band, each carrying
 * in words everything a colour mode would show. Filtering narrows what is
 * listed and never changes what a row says.
 */

import type { GeometryState, IndexReviewState, IndexSubject } from '@/lib/anatomy/anatomy-index-types';
import type { ColourMode } from '@/lib/anatomy/colour-modes';
import type { CatalogBand } from './explorer-catalog';
import type { ExplorerModel } from './explorer-model';
import { describeRegionUnderLens, type RegionLensFact } from './region-lens';

/** The geometry state in two or three words, for a table cell. The full sentence is a limit sentence. */
export const GEOMETRY_LABELS: Readonly<Record<GeometryState, string>> = {
  drawn: 'own shape',
  contained: 'inside a larger shape',
  marker_only: 'location marker only',
  not_built: 'shape not built yet',
  no_geometry: 'no shape',
  predates_addressing: 'matching out of date',
  not_mapped: 'not matched yet',
};

export const GEOMETRY_FILTERS = ['all', 'own_shape', 'inside', 'no_shape'] as const;
export type GeometryFilter = typeof GEOMETRY_FILTERS[number];

export const GEOMETRY_FILTER_LABELS: Readonly<Record<GeometryFilter, string>> = {
  all: 'Any shape status',
  own_shape: 'Own shape',
  inside: 'Inside a larger shape',
  no_shape: 'No shape',
};

const FILTER_STATES: Readonly<Record<Exclude<GeometryFilter, 'all'>, readonly GeometryState[]>> = {
  own_shape: ['drawn', 'marker_only'],
  inside: ['contained'],
  no_shape: ['not_built', 'no_geometry', 'predates_addressing', 'not_mapped'],
};

export interface ListFilter {
  query: string;
  geometry: GeometryFilter;
  /** Keep only regions the active lens holds a fact for. */
  onlyWithData: boolean;
}

export const EMPTY_LIST_FILTER: ListFilter = { query: '', geometry: 'all', onlyWithData: false };

export interface RegionRow {
  id: string;
  name: string;
  bandId: string;
  geometryState: GeometryState;
  geometryLabel: string;
  /** Why the region has no shape of its own, when the index records a reason. */
  geometryReason: string | null;
  reviewState: IndexReviewState;
  lens: RegionLensFact;
}

export interface BandGroup {
  band: CatalogBand;
  rows: RegionRow[];
  /** Rows in the band before filtering, so a filtered list can say how many it hides. */
  totalRows: number;
}

function toRow(model: ExplorerModel, region: IndexSubject, mode: ColourMode | null): RegionRow {
  return {
    id: region.id,
    name: region.name,
    bandId: region.band_ids[0] ?? '',
    geometryState: region.geometry.state,
    geometryLabel: GEOMETRY_LABELS[region.geometry.state],
    geometryReason: region.geometry.reason,
    reviewState: region.review_state,
    lens: describeRegionUnderLens(model, region, mode),
  };
}

/** Every region, grouped by band with the neocortex first. A band with no region is still listed, empty. */
export function buildBandGroups(model: ExplorerModel, mode: ColourMode | null): BandGroup[] {
  return model.neuralBands.map((band) => {
    const rows = model.regions.filter((region) => region.band_ids.includes(band.id)).map((region) => toRow(model, region, mode));
    return { band, rows, totalRows: rows.length };
  });
}

function matchesQuery(row: RegionRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  return row.name.toLowerCase().includes(needle) || row.id.toLowerCase().includes(needle) || row.bandId.toLowerCase() === needle;
}

function matchesFilter(row: RegionRow, filter: ListFilter): boolean {
  const matchesGeometry = filter.geometry === 'all' || FILTER_STATES[filter.geometry].includes(row.geometryState);
  const hasData = row.lens.standing === 'value' || row.lens.standing === 'named_not_counted';
  return matchesGeometry && matchesQuery(row, filter.query) && (!filter.onlyWithData || hasData);
}

export function filterBandGroups(groups: readonly BandGroup[], filter: ListFilter): BandGroup[] {
  return groups.map((group) => ({ ...group, rows: group.rows.filter((row) => matchesFilter(row, filter)) }));
}

/** The ids of the rows on screen, top to bottom: the order the arrow keys walk. */
export function listVisibleRowIds(groups: readonly BandGroup[]): string[] {
  return groups.flatMap((group) => group.rows.map((row) => row.id));
}

export interface LensTally {
  withValue: number;
  namedNotCounted: number;
  noData: number;
  drafted: number;
}

/** How many regions hold a fact under the lens. Counted over every region, not the filtered list. */
export function tallyLens(groups: readonly BandGroup[]): LensTally {
  const rows = groups.flatMap((group) => group.rows);
  const count = (predicate: (row: RegionRow) => boolean): number => rows.filter(predicate).length;
  return {
    withValue: count((row) => row.lens.standing === 'value'),
    namedNotCounted: count((row) => row.lens.standing === 'named_not_counted'),
    noData: count((row) => row.lens.standing === 'no_data'),
    drafted: count((row) => row.lens.reviewState !== null),
  };
}
