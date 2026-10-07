/**
 * Filtering the technique catalog. Every filter is a plain value, so the same filters
 * drive the table, the matrices, the evidence bar and the counts shown on each chip.
 */

import type { CatalogSeverity, CatalogTechnique, TechniqueMode } from './catalog-types';
import { describeEvidence } from './evidence-levels';
import type { PlacementRules } from './reference-data-types';

export const PLACEMENT_STATES = ['placed-here', 'placed-elsewhere', 'not-placed', 'not-assessed'] as const;
export type PlacementState = typeof PLACEMENT_STATES[number];

/** Where one technique stands against the device in focus. */
export function placementStateOf(techniqueId: string, rules: PlacementRules, techniqueIdsOnDevice: ReadonlySet<string>): PlacementState {
  if (techniqueId in rules.placements) return techniqueIdsOnDevice.has(techniqueId) ? 'placed-here' : 'placed-elsewhere';
  return techniqueId in rules.notPlaced ? 'not-placed' : 'not-assessed';
}

export interface CatalogFilters {
  /** Evidence values by their label, as the catalog words them. Empty means all. */
  evidence: readonly string[];
  modes: readonly TechniqueMode[];
  severities: readonly CatalogSeverity[];
  placement: readonly PlacementState[];
  tacticId: string | null;
  bandId: string | null;
  domain: string | null;
  /** Matched against name, id and alias, ignoring case. */
  text: string;
}

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  evidence: [], modes: [], severities: [], placement: [], tacticId: null, bandId: null, domain: null, text: '',
};

export function isCatalogFiltered(filters: CatalogFilters): boolean {
  return filters.evidence.length > 0 || filters.modes.length > 0 || filters.severities.length > 0 || filters.placement.length > 0
    || filters.tacticId !== null || filters.bandId !== null || filters.domain !== null || filters.text.trim() !== '';
}

function matchesText(technique: CatalogTechnique, text: string): boolean {
  const needle = text.trim().toLowerCase();
  if (needle === '') return true;
  return [technique.name, technique.id, technique.alias ?? ''].some((field) => field.toLowerCase().includes(needle));
}

function matches(technique: CatalogTechnique, filters: CatalogFilters, placementOf: (techniqueId: string) => PlacementState): boolean {
  return (filters.evidence.length === 0 || filters.evidence.includes(describeEvidence(technique).label))
    && (filters.modes.length === 0 || (technique.mode !== null && filters.modes.includes(technique.mode)))
    && (filters.severities.length === 0 || filters.severities.includes(technique.severity))
    && (filters.placement.length === 0 || filters.placement.includes(placementOf(technique.id)))
    && (filters.tacticId === null || technique.tactic === filters.tacticId)
    && (filters.bandId === null || technique.bandIds.includes(filters.bandId))
    && (filters.domain === null || technique.domain === filters.domain)
    && matchesText(technique, filters.text);
}

export function filterCatalog(
  techniques: readonly CatalogTechnique[], filters: CatalogFilters, placementOf: (techniqueId: string) => PlacementState,
): CatalogTechnique[] {
  return techniques.filter((technique) => matches(technique, filters, placementOf));
}

export interface CatalogFacetCounts {
  evidence: Map<string, number>;
  modes: Map<TechniqueMode, number>;
  severities: Map<CatalogSeverity, number>;
  placement: Map<PlacementState, number>;
}

function tally<Key>(items: readonly CatalogTechnique[], keyOf: (technique: CatalogTechnique) => Key | null): Map<Key, number> {
  const counts = new Map<Key, number>();
  for (const item of items) {
    const key = keyOf(item);
    if (key !== null) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * For each chip, how many techniques choosing it would leave. Each facet is counted with
 * the other filters applied and its own cleared, so the numbers answer "what if I pick this".
 */
export function countCatalogFacets(
  techniques: readonly CatalogTechnique[], filters: CatalogFilters, placementOf: (techniqueId: string) => PlacementState,
): CatalogFacetCounts {
  const without = (cleared: Partial<CatalogFilters>): CatalogTechnique[] => filterCatalog(techniques, { ...filters, ...cleared }, placementOf);
  return {
    evidence: tally(without({ evidence: [] }), (technique) => describeEvidence(technique).label),
    modes: tally(without({ modes: [] }), (technique) => technique.mode),
    severities: tally(without({ severities: [] }), (technique) => technique.severity),
    placement: tally(without({ placement: [] }), (technique) => placementOf(technique.id)),
  };
}
