/**
 * The counts the views print about a register, each computed from the rows. A count is never
 * typed in, and the sentence that states the unit of the counts is assembled in one place.
 */

import { CATALOG_SEVERITIES, type CatalogSeverity } from './catalog-types';
import { RISK_STATUSES, type DeviceModel, type RiskStatus } from './device-model';
import { listElementsInModelOrder, type ModelElement } from './model-order';
import type { RiskRow } from './report-types';
import { isRiskAddressed } from './risk-register';

export interface ElementRowCounts extends ModelElement {
  /** Open rows from the technique catalog, by catalog severity. */
  openBySeverity: Record<CatalogSeverity, number>;
  /** Rows from the technique catalog, by the decision recorded on each. */
  catalogByStatus: Record<RiskStatus, number>;
  /** Rows from the generic baseline, by the decision recorded on each. */
  baselineByStatus: Record<RiskStatus, number>;
  openCatalogRows: number;
  catalogRows: number;
  baselineRows: number;
}

function zeroBy<Key extends string>(keys: readonly Key[]): Record<Key, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<Key, number>;
}

/** Rows whose technique is still in the catalog, and baseline rows. A row kept only for its saved decision is not counted. */
function isCurrent(row: RiskRow): boolean {
  return row.catalogState === 'current';
}

function countForElement(element: ModelElement, rows: readonly RiskRow[]): ElementRowCounts {
  const counts: ElementRowCounts = {
    ...element, openBySeverity: zeroBy(CATALOG_SEVERITIES), catalogByStatus: zeroBy(RISK_STATUSES), baselineByStatus: zeroBy(RISK_STATUSES),
    openCatalogRows: 0, catalogRows: 0, baselineRows: 0,
  };
  for (const row of rows) {
    if (row.elementId !== element.id || !isCurrent(row)) continue;
    if (row.source === 'stride') {
      counts.baselineByStatus[row.status] += 1;
      counts.baselineRows += 1;
      continue;
    }
    counts.catalogByStatus[row.status] += 1;
    counts.catalogRows += 1;
    if (isRiskAddressed(row) || row.catalogSeverity === null) continue;
    counts.openBySeverity[row.catalogSeverity] += 1;
    counts.openCatalogRows += 1;
  }
  return counts;
}

/** One entry per part and per connection, in model order, including those with no row. */
export function countRowsByElement(model: DeviceModel, rows: readonly RiskRow[]): ElementRowCounts[] {
  return listElementsInModelOrder(model).map((element) => countForElement(element, rows));
}

/** What the register's numbers count. */
export interface RegisterUnits {
  /** Distinct catalog techniques with at least one row. */
  techniques: number;
  /** Parts and connections that carry at least one catalog row. */
  elementsWithCatalogRows: number;
  /** Every part and connection in the model. */
  elements: number;
  catalogRows: number;
  baselineRows: number;
}

export function summariseRegisterUnits(model: DeviceModel, rows: readonly RiskRow[]): RegisterUnits {
  const current = rows.filter(isCurrent);
  const catalogRows = current.filter((row) => row.source === 'catalog');
  return {
    techniques: new Set(catalogRows.map((row) => row.techniqueId)).size,
    elementsWithCatalogRows: new Set(catalogRows.map((row) => row.elementId)).size,
    elements: model.components.length + model.links.length,
    catalogRows: catalogRows.length,
    baselineRows: current.length - catalogRows.length,
  };
}

function counted(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** The one sentence that says what the register's numbers count. */
export function describeRegisterUnits(units: RegisterUnits): string {
  const techniques = counted(units.techniques, 'technique', 'techniques');
  const elements = counted(units.elementsWithCatalogRows, 'part or connection', 'parts and connections');
  const verb = units.techniques === 1 ? 'makes' : 'make';
  return `${techniques} on ${elements} ${verb} ${counted(units.catalogRows, 'row', 'rows')}, plus ${counted(units.baselineRows, 'baseline row', 'baseline rows')}.`;
}
