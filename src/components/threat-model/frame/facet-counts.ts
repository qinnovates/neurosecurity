/**
 * The numbers the Model facet bar prints. Each one says how many open rows choosing that
 * value would leave, counted with the other facets applied. A zero where the placement
 * table is incomplete is never printed bare: the chip says "not assessed".
 */

import { CATALOG_SEVERITIES, type CatalogSeverity } from '@/lib/threat-model/catalog-types';
import { countByEvidence, describeEvidence } from '@/lib/threat-model/evidence-levels';
import { applyLens, countOpenRisks, type Lens, type LensContext, type LensCounts } from '@/lib/threat-model/lens';
import type { SeverityCoverage } from '@/lib/threat-model/placement-coverage';
import { THREAT_GOALS, type GoalCoverage, type RiskRow, type ThreatGoal } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';

export interface EvidenceFacetCount {
  /** The tier's name as `describeEvidence` words it; this is the value the lens holds. */
  label: string;
  count: number;
}

export interface FacetCounts {
  lens: LensCounts;
  /** Open catalog rows by goal: `lens.byGoal` without its baseline rows. */
  catalogByGoal: Record<ThreatGoal, number>;
  /** Open catalog rows by catalog severity. */
  bySeverity: Record<CatalogSeverity, number>;
  /** One entry per evidence value on this device's catalog rows, strongest first. */
  byEvidence: EvidenceFacetCount[];
  /** Open rows the whole lens leaves, catalog and baseline. */
  openRows: number;
}

function isOpenCatalogRow(row: RiskRow): boolean {
  return row.source === 'catalog' && !isRiskAddressed(row);
}

export function countFacets(rows: readonly RiskRow[], lens: Lens, context: LensContext): FacetCounts {
  const lensCounts = countOpenRisks(rows, lens, context);
  const withoutSeverity = applyLens(rows, { ...lens, severities: [] }, context).filter(isOpenCatalogRow);
  const withoutEvidence = applyLens(rows, { ...lens, evidenceLevels: [] }, context).filter(isOpenCatalogRow);
  const catalogRows = rows.filter((row) => row.source === 'catalog');
  return {
    lens: lensCounts,
    catalogByGoal: Object.fromEntries(THREAT_GOALS.map((goal) => [goal, lensCounts.byGoal[goal] - lensCounts.baselineByGoal[goal]])) as Record<ThreatGoal, number>,
    bySeverity: Object.fromEntries(CATALOG_SEVERITIES.map((severity) =>
      [severity, withoutSeverity.filter((row) => row.catalogSeverity === severity).length])) as Record<CatalogSeverity, number>,
    byEvidence: countByEvidence(catalogRows).map((evidence) => ({
      label: evidence.label, count: withoutEvidence.filter((row) => describeEvidence(row).label === evidence.label).length,
    })),
    openRows: applyLens(rows, lens, context).filter((row) => !isRiskAddressed(row)).length,
  };
}

/** Where a zero cannot be told from "nothing was looked at". */
export interface CoverageGaps {
  byGoal: Record<ThreatGoal, boolean>;
  bySeverity: Record<CatalogSeverity, boolean>;
  /** True when any catalog technique has no placement decision. */
  isAnyIncomplete: boolean;
}

export function findCoverageGaps(goalCoverage: Record<ThreatGoal, GoalCoverage>, severityCoverage: SeverityCoverage): CoverageGaps {
  const bySeverity = Object.fromEntries(severityCoverage.rows.map((row) => [row.severity, row.byTerm.not_assessed > 0])) as Record<CatalogSeverity, boolean>;
  const byGoal = Object.fromEntries(THREAT_GOALS.map((goal) => [goal, goalCoverage[goal].isIncomplete])) as Record<ThreatGoal, boolean>;
  return { byGoal, bySeverity, isAnyIncomplete: THREAT_GOALS.some((goal) => byGoal[goal]) || severityCoverage.totalsByTerm.not_assessed > 0 };
}

/** The one rule: a zero count of catalog rows, where coverage of that kind is incomplete, reads "not assessed". */
export function isZeroNotAssessed(catalogCount: number, isIncomplete: boolean): boolean {
  return catalogCount === 0 && isIncomplete;
}
