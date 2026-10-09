/**
 * How much of the catalog has a placement decision. The interface states this wherever
 * it shows risks, so an absence reads as "not assessed" and never as "clean".
 */

import { CATALOG_SEVERITIES, type CatalogSeverity, type CatalogTechnique } from './catalog-types';
import type { ScopeTerm } from './lab-terms';
import type { PlacementRules } from './reference-data-types';
import { indexScopeTerms, type ScopeStatement } from './scope-statement';

export interface PlacementCoverage {
  /** Placed, and on the device being looked at. Equals `placed` when no device is given. */
  placedHere: number;
  /** Placed in the table, but the device does not meet the technique's conditions. */
  placedElsewhere: number;
  /** Reviewed and not placed, each with a recorded reason. */
  notPlaced: number;
  /** No decision recorded. */
  notAssessed: number;
  total: number;
}

/**
 * @param techniqueIdsOnDevice ids of techniques placed on the device in focus; omit to describe the catalog alone
 */
export function summarisePlacementCoverage(
  techniques: readonly CatalogTechnique[],
  rules: PlacementRules,
  techniqueIdsOnDevice?: ReadonlySet<string>,
): PlacementCoverage {
  let placed = 0;
  let placedHere = 0;
  let notPlaced = 0;
  for (const technique of techniques) {
    if (technique.id in rules.placements) {
      placed += 1;
      if (techniqueIdsOnDevice === undefined || techniqueIdsOnDevice.has(technique.id)) placedHere += 1;
    } else if (technique.id in rules.notPlaced) {
      notPlaced += 1;
    }
  }
  return {
    placedHere,
    placedElsewhere: placed - placedHere,
    notPlaced,
    notAssessed: techniques.length - placed - notPlaced,
    total: techniques.length,
  };
}

/** One catalog severity, split by the Lab's four scope terms. */
export interface SeverityCoverageRow {
  severity: CatalogSeverity;
  byTerm: Record<ScopeTerm, number>;
  total: number;
}

export interface SeverityCoverage {
  /** One row per severity, most severe first, including severities with no technique. */
  rows: SeverityCoverageRow[];
  totalsByTerm: Record<ScopeTerm, number>;
  /** The catalog's size; every row total and every term total sums to it. */
  total: number;
}

function zeroByTerm(): Record<ScopeTerm, number> {
  return { applies: 0, would_apply_if: 0, reviewed_outside: 0, not_assessed: 0 };
}

/** Catalog techniques by severity and by where each stands against the device in focus. */
export function summariseCoverageBySeverity(techniques: readonly CatalogTechnique[], scope: ScopeStatement): SeverityCoverage {
  const termById = indexScopeTerms(scope);
  const rows = CATALOG_SEVERITIES.map((severity): SeverityCoverageRow => ({ severity, byTerm: zeroByTerm(), total: 0 }));
  const totalsByTerm = zeroByTerm();
  for (const technique of techniques) {
    const term = termById.get(technique.id);
    const row = rows[CATALOG_SEVERITIES.indexOf(technique.severity)];
    if (term === undefined) continue;
    row.byTerm[term] += 1;
    row.total += 1;
    totalsByTerm[term] += 1;
  }
  return { rows, totalsByTerm, total: rows.reduce((sum, row) => sum + row.total, 0) };
}
