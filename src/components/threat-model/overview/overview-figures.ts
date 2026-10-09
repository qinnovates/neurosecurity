/**
 * The figures the Overview prints. Each is counted here from the register rows, the scope
 * statement or the per-element counts; none is written in a component.
 */

import { RISK_STATUSES, type RiskStatus } from '@/lib/threat-model/device-model';
import { SEVERE_RATINGS } from '@/lib/threat-model/headline-figures';
import type { ElementRowCounts } from '@/lib/threat-model/register-counts';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import type { ScopeStatement } from '@/lib/threat-model/scope-statement';

export interface OverviewFigures {
  catalogRows: number;
  openCatalogRows: number;
  baselineRows: number;
  openBaselineRows: number;
  /** Catalog rows rated critical or high. */
  severeRows: number;
  openSevereRows: number;
  techniquesThatApply: number;
  techniquesNotAssessed: number;
  catalogTechniques: number;
}

function countOpen(rows: readonly RiskRow[]): number {
  return rows.filter((row) => !isRiskAddressed(row)).length;
}

/** @param rows current register rows for the whole device */
export function summariseOverview(rows: readonly RiskRow[], scope: ScopeStatement): OverviewFigures {
  const catalogRows = rows.filter((row) => row.source === 'catalog');
  const baselineRows = rows.filter((row) => row.source === 'stride');
  const severeRows = catalogRows.filter((row) => row.catalogSeverity !== null && SEVERE_RATINGS.includes(row.catalogSeverity));
  return {
    catalogRows: catalogRows.length,
    openCatalogRows: countOpen(catalogRows),
    baselineRows: baselineRows.length,
    openBaselineRows: countOpen(baselineRows),
    severeRows: severeRows.length,
    openSevereRows: countOpen(severeRows),
    techniquesThatApply: scope.applies.length,
    techniquesNotAssessed: scope.notAssessed.length,
    catalogTechniques: scope.total,
  };
}

export interface DecisionTotals {
  catalog: Record<RiskStatus, number>;
  baseline: Record<RiskStatus, number>;
}

/** Rows by the decision recorded on each, summed over every part and connection. */
export function sumDecisions(elementCounts: readonly ElementRowCounts[]): DecisionTotals {
  const sum = (read: (counts: ElementRowCounts) => Record<RiskStatus, number>): Record<RiskStatus, number> =>
    Object.fromEntries(RISK_STATUSES.map((status) => [status, elementCounts.reduce((total, counts) => total + read(counts)[status], 0)])) as Record<RiskStatus, number>;
  return { catalog: sum((counts) => counts.catalogByStatus), baseline: sum((counts) => counts.baselineByStatus) };
}

/** The first open catalog rows in the register's own order, which is most severe first. */
export function listTopOpenRows(rows: readonly RiskRow[], limit: number): RiskRow[] {
  return rows.filter((row) => row.source === 'catalog' && !isRiskAddressed(row)).slice(0, limit);
}
