/**
 * Where the catalog's techniques of one kind stand against this device, counted under the
 * four scope terms. It lets a facet or a note with no row on the device say what is true:
 * "none on this device" where placement decisions exist, "not assessed" only where none does.
 */

import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { GOAL_BY_MODE, SCOPE_TERMS, SCOPE_TERM_LABELS, type ScopeTerm } from '@/lib/threat-model/lab-terms';
import { PLACED_ENTRY_PATHS, type PlacedEntryPath, type PlacementRules } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type ThreatGoal } from '@/lib/threat-model/report-types';
import type { SeverityCoverage } from '@/lib/threat-model/placement-coverage';
import { listScopeEntries, type ScopeStatement } from '@/lib/threat-model/scope-statement';
import type { ScopeByKind } from './facet-counts';

export type TermCounts = Record<ScopeTerm, number>;

export const NONE_ON_DEVICE_LABEL = 'none on this device';
export const NOT_ASSESSED_LABEL = 'not assessed';
/** A kind that has rows on the device, none of them open under the filters in use; the diagram's badge says the same. */
export const NONE_OPEN_LABEL = '0 open';
/** The terms a kind with no row on the device can still hold techniques under. */
const TERMS_WITHOUT_A_ROW: readonly ScopeTerm[] = SCOPE_TERMS.filter((term) => term !== 'applies');

function emptyCounts(): TermCounts {
  return Object.fromEntries(SCOPE_TERMS.map((term) => [term, 0])) as TermCounts;
}

function tally<Kind extends string>(kinds: readonly Kind[], scope: ScopeStatement, kindOf: (techniqueId: string) => Kind | null): Record<Kind, TermCounts> {
  const counts = Object.fromEntries(kinds.map((kind) => [kind, emptyCounts()])) as Record<Kind, TermCounts>;
  for (const entry of listScopeEntries(scope)) {
    const kind = kindOf(entry.techniqueId);
    if (kind !== null) counts[kind][entry.term] += 1;
  }
  return counts;
}

/** Every catalog technique with an effect, under its scope term. */
export function countScopeByGoal(scope: ScopeStatement, techniques: readonly Pick<CatalogTechnique, 'id' | 'mode'>[]): Record<ThreatGoal, TermCounts> {
  const goalById = new Map(techniques.map((technique) => [technique.id, technique.mode === null ? null : GOAL_BY_MODE[technique.mode]]));
  return tally(THREAT_GOALS, scope, (techniqueId) => goalById.get(techniqueId) ?? null);
}

/**
 * Techniques by the entry path their placement records. Only a placed technique has one, so
 * only "applies" and "would apply if" are ever counted here.
 */
export function countScopeByEntryPath(scope: ScopeStatement, placements: PlacementRules['placements']): Record<PlacedEntryPath, TermCounts> {
  return tally(PLACED_ENTRY_PATHS, scope, (techniqueId) => placements[techniqueId]?.entryPath ?? null);
}

/** Every kind a facet offers, counted once so the facet bar and the Overview agree. */
export function buildScopeByKind(
  scope: ScopeStatement, techniques: readonly Pick<CatalogTechnique, 'id' | 'mode'>[], placements: PlacementRules['placements'], severityCoverage: SeverityCoverage,
): ScopeByKind {
  return {
    byGoal: countScopeByGoal(scope, techniques),
    byEntryPath: countScopeByEntryPath(scope, placements),
    bySeverity: Object.fromEntries(severityCoverage.rows.map((row) => [row.severity, row.byTerm])) as ScopeByKind['bySeverity'],
    all: severityCoverage.totalsByTerm,
  };
}

/** True when a placement decision exists for some technique of the kind: it applies, would apply, or was reviewed and left outside. */
export function hasPlacementDecision(counts: TermCounts): boolean {
  return counts.applies + counts.would_apply_if + counts.reviewed_outside > 0;
}

/**
 * What a filter prints in place of a bare zero; null when there are open rows to count.
 * A kind with rows on the device says none is open; a kind with decisions and no row says so;
 * only a kind nobody placed or reviewed says "not assessed".
 */
export function zeroLabelFor(openRowCount: number, counts: TermCounts): string | null {
  if (openRowCount > 0) return null;
  if (counts.applies > 0) return NONE_OPEN_LABEL;
  return hasPlacementDecision(counts) ? NONE_ON_DEVICE_LABEL : NOT_ASSESSED_LABEL;
}

/** The counts behind a kind with no row here, under the scope terms' own names: "1 would apply if (condition); 4 reviewed, outside the device; 21 not assessed". */
export function describeTermCounts(counts: TermCounts): string {
  return TERMS_WITHOUT_A_ROW.filter((term) => counts[term] > 0).map((term) => `${counts[term]} ${SCOPE_TERM_LABELS[term].toLowerCase()}`).join('; ');
}
