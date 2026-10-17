/**
 * The four figures that head both the Overview and the Report, with their labels. One
 * function and one set of words, so the same label can never stand over two different numbers.
 * Every figure is counted from the report; none is typed in.
 */

import type { CatalogSeverity } from './catalog-types';
import type { SeverityCoverage } from './placement-coverage';
import type { PlacementTableInfo } from './reference-data-types';
import type { RiskRow, ThreatModelReport } from './report-types';
import { isRiskAddressed } from './risk-register';

/** The two most severe catalog ratings: the rows a reader looks for first. */
export const SEVERE_RATINGS: readonly CatalogSeverity[] = ['critical', 'high'];

export const HEADLINE_FIGURE_IDS = ['open-rows', 'severe-open', 'techniques-that-apply', 'techniques-not-assessed'] as const;
export type HeadlineFigureId = typeof HEADLINE_FIGURE_IDS[number];

export const HEADLINE_LABELS: Readonly<Record<HeadlineFigureId, string>> = {
  'open-rows': 'Open rows',
  'severe-open': 'Critical and high still open',
  'techniques-that-apply': 'Techniques that apply',
  'techniques-not-assessed': 'Catalog techniques not assessed',
};

export interface HeadlineFigure {
  id: HeadlineFigureId;
  label: string;
  figure: number;
  /** What the figure is out of: "of 52". */
  unit: string;
  /** A second count printed under the label, or null. */
  note: string | null;
  /** True when the figure is zero only because nothing of its kind was assessed; it is then said in words, never printed as 0. */
  isNotAssessed: boolean;
}

function countOpen(rows: readonly RiskRow[]): number {
  return rows.filter((row) => !isRiskAddressed(row)).length;
}

function isSevere(row: RiskRow): boolean {
  return row.catalogSeverity !== null && SEVERE_RATINGS.includes(row.catalogSeverity);
}

/**
 * @param report the report of the device in focus
 * @param severityCoverage when given, the severe figure reads "not assessed" only if a critical or
 *   high technique is unassessed; without it, if any technique is.
 */
export function summariseHeadlineFigures(report: ThreatModelReport, severityCoverage?: SeverityCoverage): HeadlineFigure[] {
  // A row kept only because a saved decision points at a technique the catalog no longer holds is not a row of this device.
  const currentRows = report.riskRows.filter((row) => row.catalogState === 'current');
  const catalogRows = currentRows.filter((row) => row.source === 'catalog');
  const baselineRows = currentRows.filter((row) => row.source === 'stride');
  const severeRows = catalogRows.filter(isSevere);
  const techniquesThatApply = new Set(catalogRows.map((row) => row.techniqueId)).size;
  const { totalTechniques, notReviewedTechniques } = report.catalogCoverage;
  const hasUnassessed = notReviewedTechniques > 0;
  const hasUnassessedSevere = severityCoverage === undefined
    ? hasUnassessed
    : severityCoverage.rows.some((row) => SEVERE_RATINGS.includes(row.severity) && row.byTerm.not_assessed > 0);
  const figure = (id: HeadlineFigureId, count: number, outOf: number, isNotAssessed: boolean, note: string | null = null): HeadlineFigure =>
    ({ id, label: HEADLINE_LABELS[id], figure: count, unit: `of ${outOf}`, note, isNotAssessed });
  return [
    figure('open-rows', countOpen(catalogRows), catalogRows.length, catalogRows.length === 0 && hasUnassessed, `${countOpen(baselineRows)} of ${baselineRows.length} baseline rows open`),
    figure('severe-open', countOpen(severeRows), severeRows.length, severeRows.length === 0 && hasUnassessedSevere),
    figure('techniques-that-apply', techniquesThatApply, totalTechniques, techniquesThatApply === 0 && hasUnassessed),
    figure('techniques-not-assessed', notReviewedTechniques, totalTechniques, false),
  ];
}

/**
 * Who drafted the placement decisions and whether the file records a review, counted from the
 * placement table: every decision, placed or left outside, was drafted the same way.
 */
export function describePlacementDrafting(placementTable: Pick<PlacementTableInfo, 'placementCount' | 'notPlacedCount' | 'reviewedPlacementCount'>): string {
  const { placementCount, notPlacedCount, reviewedPlacementCount } = placementTable;
  const review = reviewedPlacementCount > 0 ? `${reviewedPlacementCount} reviewed` : 'the placement file records no review yet';
  return `${placementCount + notPlacedCount} placement decisions (${placementCount} placed, ${notPlacedCount} reviewed, outside the device) drafted with an AI assistant; ${review}.`;
}
