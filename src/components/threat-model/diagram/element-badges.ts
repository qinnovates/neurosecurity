/**
 * What the badge on a part or a connection says. A badge counts open catalog rows and splits
 * them by catalog severity; where nothing is placed on the element it says "not assessed",
 * never zero.
 */

import { CATALOG_SEVERITIES, type CatalogSeverity } from '@/lib/threat-model/catalog-types';
import { CATALOG_SEVERITY_LABELS } from '@/lib/threat-model/lab-terms';
import type { ElementRowCounts } from '@/lib/threat-model/register-counts';

export type ElementBadge =
  /** Open rows with their split by severity. */
  | { kind: 'split'; open: number; bySeverity: Readonly<Record<CatalogSeverity, number>> }
  /** Open rows from a caller that gave a total only. */
  | { kind: 'total'; open: number }
  /** No catalog technique is placed on the element. */
  | { kind: 'not-assessed' };

export const NOT_ASSESSED_LABEL = 'not assessed';

interface BadgeSources {
  /** Counts per part and connection, with the severity split. Preferred. */
  elementCounts?: readonly ElementRowCounts[];
  /** Older form: a total of open rows per element id. Used only when `elementCounts` is absent. */
  openRiskCounts?: ReadonlyMap<string, number>;
  /**
   * Elements with no catalog row at all. When the counts were taken under a filter, pass this
   * from the unfiltered rows so a filtered-out element is not called "not assessed".
   */
  notAssessedElementIds?: ReadonlySet<string>;
}

function badgeFromCounts(counts: ElementRowCounts, notAssessedIds: ReadonlySet<string> | undefined): ElementBadge {
  const isNotAssessed = notAssessedIds === undefined ? counts.catalogRows === 0 : notAssessedIds.has(counts.id);
  return isNotAssessed ? { kind: 'not-assessed' } : { kind: 'split', open: counts.openCatalogRows, bySeverity: counts.openBySeverity };
}

/** One badge per element the caller gave a count for, keyed by element id. No counts, no badges. */
export function buildBadges({ elementCounts, openRiskCounts, notAssessedElementIds }: BadgeSources): Map<string, ElementBadge> {
  if (elementCounts !== undefined) {
    return new Map(elementCounts.map((counts) => [counts.id, badgeFromCounts(counts, notAssessedElementIds)]));
  }
  const badges = new Map<string, ElementBadge>();
  for (const [elementId, open] of openRiskCounts ?? []) {
    if (open > 0) badges.set(elementId, { kind: 'total', open });
  }
  return badges;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** The badge in words, for the element's accessible name and tooltip. */
export function describeBadge(badge: ElementBadge | undefined): string {
  if (badge === undefined) return '';
  if (badge.kind === 'not-assessed') return 'Not assessed: no catalog technique is placed on it.';
  const total = `${plural(badge.open, 'open catalog row', 'open catalog rows')}`;
  if (badge.kind === 'total' || badge.open === 0) return `${total}.`;
  const split = CATALOG_SEVERITIES.map((severity) => `${badge.bySeverity[severity]} ${CATALOG_SEVERITY_LABELS[severity].toLowerCase()}`).join(', ');
  return `${total}: ${split}.`;
}

/** The smallest a non-empty share of the bar is drawn, so one row among many is still visible. */
const MIN_SEGMENT_WIDTH = 3;

export interface BadgeSegment { severity: CatalogSeverity; count: number; x: number; width: number }

/**
 * Splits a bar of `barWidth` pixels among the severities with at least one open row, each in
 * proportion to its count. The widths always add up to the bar.
 */
export function splitBar(bySeverity: Readonly<Record<CatalogSeverity, number>>, barWidth: number): BadgeSegment[] {
  const present = CATALOG_SEVERITIES.filter((severity) => bySeverity[severity] > 0);
  const total = present.reduce((sum, severity) => sum + bySeverity[severity], 0);
  if (total === 0) return [];
  const widths = present.map((severity) => Math.max(MIN_SEGMENT_WIDTH, Math.round((barWidth * bySeverity[severity]) / total)));
  // Rounding and the minimum can leave the widths a pixel or two off; the widest share absorbs it.
  const widest = widths.indexOf(Math.max(...widths));
  widths[widest] += barWidth - widths.reduce((sum, width) => sum + width, 0);
  let x = 0;
  return present.map((severity, index): BadgeSegment => {
    const segment = { severity, count: bySeverity[severity], x, width: widths[index] };
    x += widths[index];
    return segment;
  });
}
