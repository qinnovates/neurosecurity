/**
 * Column checks for the query engine. A field no row carries is refused, with the closest
 * real column named: a misspelt column would otherwise come back as a missing column or as
 * one blank group, which reads as an answer.
 */

import { nearestNames } from './threat-model/nearest-names';

type Row = Record<string, unknown>;

/** Keys that could pollute prototypes if used as object keys. */
export const FORBIDDEN_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']);

export const hasOwnColumn = (row: Row, field: string): boolean => Object.prototype.hasOwnProperty.call(row, field);

function listColumns(rows: readonly Row[]): string[] {
  const columns = new Set<string>();
  for (const row of rows) for (const column of Object.keys(row)) columns.add(column);
  return [...columns];
}

/**
 * @throws Error naming the unknown column and the nearest real one.
 * With no rows to read the columns from, nothing can be checked.
 */
export function requireColumns(shapeRows: readonly Row[], fields: readonly string[], operation: string): void {
  if (shapeRows.length === 0) return;
  const unconfirmed = fields.filter(field => !hasOwnColumn(shapeRows[0], field));
  if (unconfirmed.length === 0) return;
  const columns = listColumns(shapeRows);
  for (const field of unconfirmed) {
    if (columns.includes(field)) continue;
    const nearest = nearestNames(field, columns, 1)[0];
    const hint = nearest === undefined ? '' : ` Did you mean "${nearest}"?`;
    throw new Error(`Unknown column "${field}" in ${operation}.${hint} Columns: ${columns.join(', ')}`);
  }
}
