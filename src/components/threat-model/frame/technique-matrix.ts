/**
 * Techniques by part, laid out: one line per technique, one column per part or connection
 * in model order, the row each pair makes where there is one, and the totals of both.
 */

import type { CatalogSeverity } from '@/lib/threat-model/catalog-types';
import type { ModelElement } from '@/lib/threat-model/model-order';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';

export interface MatrixTotals {
  /** Rows without a decision. */
  open: number;
  rows: number;
}

export interface MatrixLine extends MatrixTotals {
  techniqueId: string;
  title: string;
  severity: CatalogSeverity | null;
  /** One entry per column: the row for this technique on that element, or null. */
  cells: (RiskRow | null)[];
}

export interface TechniqueMatrix {
  columns: ModelElement[];
  lines: MatrixLine[];
  /** One entry per column. */
  columnTotals: MatrixTotals[];
}

function totalsOf(rows: readonly (RiskRow | null)[]): MatrixTotals {
  const present = rows.filter((row): row is RiskRow => row !== null);
  return { open: present.filter((row) => !isRiskAddressed(row)).length, rows: present.length };
}

/** Columns for a caller with no model at hand: the elements that carry a row, in order of first appearance. */
function columnsFromRows(rows: readonly RiskRow[]): ModelElement[] {
  return [...new Map(rows.map((row): [string, ModelElement] => [row.elementId, { id: row.elementId, kind: 'part', label: row.elementLabel }])).values()];
}

/**
 * @param rows any register rows; only current catalog rows are laid out
 * @param elements every part and connection in model order, including those with no row
 */
export function buildTechniqueMatrix(rows: readonly RiskRow[], elements?: readonly ModelElement[]): TechniqueMatrix {
  const catalogRows = rows.filter((row) => row.source === 'catalog' && row.catalogState === 'current' && row.techniqueId !== null);
  const columns = elements === undefined ? columnsFromRows(catalogRows) : [...elements];
  const rowByPair = new Map(catalogRows.map((row) => [`${row.techniqueId}|${row.elementId}`, row]));
  const firstRows = [...new Map(catalogRows.map((row) => [row.techniqueId as string, row])).values()];
  const lines = firstRows.map((first): MatrixLine => {
    const cells = columns.map((column) => rowByPair.get(`${first.techniqueId}|${column.id}`) ?? null);
    return { techniqueId: first.techniqueId as string, title: first.title, severity: first.catalogSeverity, cells, ...totalsOf(cells) };
  });
  return { columns, lines, columnTotals: columns.map((_column, index) => totalsOf(lines.map((line) => line.cells[index]))) };
}
