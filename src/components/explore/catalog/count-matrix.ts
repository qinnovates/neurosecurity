/**
 * The catalog counted on two axes. A technique that sits under several values of an axis is
 * counted once in each cell it touches, and once in every total: totals are distinct
 * techniques, so a row's total can be less than the sum of its cells.
 */

import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';

export interface MatrixAxisItem {
  id: string;
  label: string;
  /** A longer name, when the label is a code. */
  title?: string;
}

export interface CountMatrixData {
  /** Distinct techniques in each cell that has any; read with `cellKey`. */
  cells: ReadonlyMap<string, number>;
  rowTotals: ReadonlyMap<string, number>;
  columnTotals: ReadonlyMap<string, number>;
  /** Distinct techniques that sit in at least one cell. */
  total: number;
}

const KEY_SEPARATOR = '\n';

export function cellKey(rowId: string, columnId: string): string {
  return `${rowId}${KEY_SEPARATOR}${columnId}`;
}

function addOne(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

/** The ids a technique has on an axis, without repeats and without ids the axis does not list. */
function idsOnAxis(ids: readonly string[], axis: ReadonlySet<string>): string[] {
  return [...new Set(ids)].filter((id) => axis.has(id));
}

export function countMatrix(
  techniques: readonly CatalogTechnique[], rows: readonly MatrixAxisItem[], columns: readonly MatrixAxisItem[],
  rowIdsOf: (technique: CatalogTechnique) => readonly string[], columnIdsOf: (technique: CatalogTechnique) => readonly string[],
): CountMatrixData {
  const rowAxis = new Set(rows.map((row) => row.id));
  const columnAxis = new Set(columns.map((column) => column.id));
  const cells = new Map<string, number>();
  const rowTotals = new Map<string, number>();
  const columnTotals = new Map<string, number>();
  let total = 0;
  for (const technique of techniques) {
    const rowIds = idsOnAxis(rowIdsOf(technique), rowAxis);
    const columnIds = idsOnAxis(columnIdsOf(technique), columnAxis);
    if (rowIds.length === 0 || columnIds.length === 0) continue;
    total += 1;
    for (const rowId of rowIds) addOne(rowTotals, rowId);
    for (const columnId of columnIds) addOne(columnTotals, columnId);
    for (const rowId of rowIds) for (const columnId of columnIds) addOne(cells, cellKey(rowId, columnId));
  }
  return { cells, rowTotals, columnTotals, total };
}
