/**
 * Filtering the technique catalog. Every filter is a plain value, so the same filters
 * drive the table, the matrices, the evidence bar and the counts shown on each chip.
 */

import { BAND_ORDER, type CatalogSeverity, type CatalogTechnique, type EngineData, type TechniqueMode } from './catalog-types';
import { describeEvidence } from './evidence-levels';
import { SCOPE_TERMS, type ScopeTerm } from './lab-terms';
import type { EntryPath, PlacementRules } from './reference-data-types';

/** Where one technique stands against the device in focus, from the placement table and the techniques on the device. */
export function placementStateOf(techniqueId: string, rules: PlacementRules, techniqueIdsOnDevice: ReadonlySet<string>): ScopeTerm {
  if (techniqueId in rules.placements) return techniqueIdsOnDevice.has(techniqueId) ? 'applies' : 'would_apply_if';
  return techniqueId in rules.notPlaced ? 'reviewed_outside' : 'not_assessed';
}

/** How a technique gets in, from the placement table; null when it has no placement decision. */
export function entryPathOf(techniqueId: string, rules: PlacementRules): EntryPath | null {
  return rules.placements[techniqueId]?.entryPath ?? (techniqueId in rules.notPlaced ? 'around_device' : null);
}

export interface CatalogFilters {
  /** Evidence values by their label, as `describeEvidence` words them. Empty means all. */
  evidence: readonly string[];
  modes: readonly TechniqueMode[];
  severities: readonly CatalogSeverity[];
  placement: readonly ScopeTerm[];
  /** Empty means every entry path. */
  entryPaths: readonly EntryPath[];
  /** A technique passes when it lists any of these bands. Empty means all. */
  bandIds: readonly string[];
  tacticId: string | null;
  domain: string | null;
  /** Matched, ignoring case, against name, id, alias, detection note, sources, and the ids and products of linked CVEs. */
  text: string;
}

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  evidence: [], modes: [], severities: [], placement: [], entryPaths: [], bandIds: [], tacticId: null, domain: null, text: '',
};

export function isCatalogFiltered(filters: CatalogFilters): boolean {
  return [filters.evidence, filters.modes, filters.severities, filters.placement, filters.entryPaths, filters.bandIds].some((values) => values.length > 0)
    || filters.tacticId !== null || filters.domain !== null || filters.text.trim() !== '';
}

/** What the filters read that a technique does not carry itself. Build it once per device with `buildCatalogFilterContext`. */
export interface CatalogFilterContext {
  placementOf: (techniqueId: string) => ScopeTerm;
  entryPathOf: (techniqueId: string) => EntryPath | null;
  /** Everything the text search reads for one technique, lower-cased. */
  searchTextOf: (techniqueId: string) => string;
}

function buildSearchText(technique: CatalogTechnique, cveWords: readonly string[]): string {
  return [technique.name, technique.id, technique.alias ?? '', technique.detection ?? '', ...technique.sources, ...cveWords].join('\n').toLowerCase();
}

export function buildCatalogFilterContext(
  engineData: Pick<EngineData, 'techniques' | 'precedentCves'>, rules: PlacementRules, techniqueIdsOnDevice: ReadonlySet<string>,
): CatalogFilterContext {
  const cveWordsByTechnique = new Map<string, string[]>();
  for (const cve of engineData.precedentCves) {
    for (const techniqueId of cve.techniqueIds) {
      cveWordsByTechnique.set(techniqueId, [...(cveWordsByTechnique.get(techniqueId) ?? []), cve.cveId, cve.product]);
    }
  }
  const searchText = new Map(engineData.techniques.map((technique) => [technique.id, buildSearchText(technique, cveWordsByTechnique.get(technique.id) ?? [])]));
  return {
    placementOf: (techniqueId) => placementStateOf(techniqueId, rules, techniqueIdsOnDevice),
    entryPathOf: (techniqueId) => entryPathOf(techniqueId, rules),
    searchTextOf: (techniqueId) => searchText.get(techniqueId) ?? '',
  };
}

function isAmong<Value>(selected: readonly Value[], value: Value | null): boolean {
  return selected.length === 0 || (value !== null && selected.includes(value));
}

function matches(technique: CatalogTechnique, filters: CatalogFilters, context: CatalogFilterContext): boolean {
  const needle = filters.text.trim().toLowerCase();
  return isAmong(filters.evidence, describeEvidence(technique).label)
    && isAmong(filters.modes, technique.mode)
    && isAmong(filters.severities, technique.severity)
    && isAmong(filters.placement, context.placementOf(technique.id))
    && isAmong(filters.entryPaths, context.entryPathOf(technique.id))
    && (filters.bandIds.length === 0 || technique.bandIds.some((bandId) => filters.bandIds.includes(bandId)))
    && (filters.tacticId === null || technique.tactic === filters.tacticId)
    && (filters.domain === null || technique.domain === filters.domain)
    && (needle === '' || context.searchTextOf(technique.id).includes(needle));
}

export function filterCatalog(techniques: readonly CatalogTechnique[], filters: CatalogFilters, context: CatalogFilterContext): CatalogTechnique[] {
  return techniques.filter((technique) => matches(technique, filters, context));
}

export interface BandFacetCount {
  bandId: string;
  /** Distinct techniques that list the band. A technique in two bands counts once under each. */
  count: number;
}

export interface CatalogFacetCounts {
  evidence: Map<string, number>;
  modes: Map<TechniqueMode, number>;
  severities: Map<CatalogSeverity, number>;
  placement: Map<ScopeTerm, number>;
  entryPaths: Map<EntryPath, number>;
  /** One entry per band in `BAND_ORDER`, then any band the catalog names that the order does not. */
  bands: BandFacetCount[];
}

function tally<Key>(items: readonly CatalogTechnique[], keyOf: (technique: CatalogTechnique) => Key | null): Map<Key, number> {
  const counts = new Map<Key, number>();
  for (const item of items) {
    const key = keyOf(item);
    if (key !== null) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function countBands(items: readonly CatalogTechnique[]): BandFacetCount[] {
  const counts = new Map<string, number>(BAND_ORDER.map((bandId) => [bandId, 0]));
  for (const item of items) {
    for (const bandId of new Set(item.bandIds)) counts.set(bandId, (counts.get(bandId) ?? 0) + 1);
  }
  return [...counts].map(([bandId, count]) => ({ bandId, count }));
}

/**
 * For each chip, how many techniques choosing it would leave. Each facet is counted with
 * the other filters applied and its own cleared, so the numbers answer "what if I pick this".
 */
export function countCatalogFacets(techniques: readonly CatalogTechnique[], filters: CatalogFilters, context: CatalogFilterContext): CatalogFacetCounts {
  const without = (cleared: Partial<CatalogFilters>): CatalogTechnique[] => filterCatalog(techniques, { ...filters, ...cleared }, context);
  return {
    evidence: tally(without({ evidence: [] }), (technique) => describeEvidence(technique).label),
    modes: tally(without({ modes: [] }), (technique) => technique.mode),
    severities: tally(without({ severities: [] }), (technique) => technique.severity),
    placement: tally(without({ placement: [] }), (technique) => context.placementOf(technique.id)),
    entryPaths: tally(without({ entryPaths: [] }), (technique) => context.entryPathOf(technique.id)),
    bands: countBands(without({ bandIds: [] })),
  };
}

/** The numbers behind "N apply here, M not assessed, K reviewed and outside" for the techniques shown. */
export interface CatalogScopeCounts {
  byTerm: Record<ScopeTerm, number>;
  shown: number;
  /** True when the placement facet is on, which is when the line is printed. */
  isPlacementFacetOn: boolean;
}

export function countScopeTermsShown(techniques: readonly CatalogTechnique[], filters: CatalogFilters, context: CatalogFilterContext): CatalogScopeCounts {
  const shown = filterCatalog(techniques, filters, context);
  const byTerm = Object.fromEntries(SCOPE_TERMS.map((term) => [term, 0])) as Record<ScopeTerm, number>;
  for (const technique of shown) byTerm[context.placementOf(technique.id)] += 1;
  return { byTerm, shown: shown.length, isPlacementFacetOn: filters.placement.length > 0 };
}
