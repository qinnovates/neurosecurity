/**
 * The register's own order: rows of one technique sit together, one line per part, so a
 * technique reads as a group while every part keeps its own decision. Groups with an open
 * row come first, so triage starts at the top.
 */

import type { ModelElement } from '@/lib/threat-model/model-order';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';

const BASELINE_GROUP_PREFIX = 'baseline:';

/** What a row is grouped by: its technique, or its baseline category. */
export function groupKeyOf(row: RiskRow): string {
  return row.techniqueId ?? `${BASELINE_GROUP_PREFIX}${row.strideCategories.join('+')}`;
}

export interface GroupedRegister {
  rows: RiskRow[];
  /** Risk ids of the first row of each group. */
  leadRiskIds: ReadonlySet<string>;
}

/**
 * @param rows in register order; the order of first appearance is the order of the groups
 * @param elements every part and connection in model order, which orders the lines inside a group
 */
export function groupRegisterRows(rows: readonly RiskRow[], elements: readonly ModelElement[]): GroupedRegister {
  const positionOf = new Map(elements.map((element, index) => [element.id, index]));
  const groups = new Map<string, RiskRow[]>();
  for (const row of rows) {
    const key = groupKeyOf(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const inModelOrder = (group: RiskRow[]): RiskRow[] =>
    [...group].sort((left, right) => (positionOf.get(left.elementId) ?? elements.length) - (positionOf.get(right.elementId) ?? elements.length));
  const ordered = [...groups.values()].map(inModelOrder);
  const hasOpenRow = (group: RiskRow[]): boolean => group.some((row) => !isRiskAddressed(row));
  const openFirst = [...ordered.filter(hasOpenRow), ...ordered.filter((group) => !hasOpenRow(group))];
  return { rows: openFirst.flat(), leadRiskIds: new Set(openFirst.map((group) => group[0].riskId)) };
}
