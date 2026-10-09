/**
 * The `where` clause of the query engine: how it is read, and the checks the strict option
 * adds. A filter on a column no row carries, or with nothing after its operator, would
 * otherwise come back as "no rows" or as every row, which reads as an answer.
 */

import { requireColumns } from './kql-columns';

type Row = Record<string, unknown>;

interface WhereClause {
  field: string;
  operator: string;
  /** The text after the operator, trimmed; empty when nothing follows it. */
  rawValue: string;
}

const WHERE_OPERATORS = ['!=', '>=', '<=', '==', '>', '<', '!contains', 'contains', 'startswith', 'has'];

function findWhereOperator(clause: string): { operator: string; index: number } | null {
  for (const operator of WHERE_OPERATORS) {
    const spacedIndex = clause.indexOf(` ${operator} `);
    if (spacedIndex >= 0) return { operator, index: spacedIndex + 1 };
    // A symbol may be written without spaces around it; a word may not.
    const tightIndex = /[><=!]/.test(operator[0]) ? clause.indexOf(operator) : -1;
    if (tightIndex > 0) return { operator, index: tightIndex };
  }
  return null;
}

/** @throws Error when the clause has no operator between a field and a value. */
export function parseWhereClause(clause: string): WhereClause {
  const found = findWhereOperator(clause);
  if (found === null) throw new Error(`Invalid where clause: "${clause}". Expected: field op value`);
  return { field: clause.slice(0, found.index).trim(), operator: found.operator, rawValue: clause.slice(found.index + found.operator.length).trim() };
}

/** The strict checks on a `where`: the field is a column, and something follows the operator. */
export function requireWhereOperands(clause: string, shapeRows: readonly Row[]): void {
  const { field, operator, rawValue } = parseWhereClause(clause);
  if (rawValue === '') throw new Error(`Missing value in where clause: "${clause}". Expected: field ${operator} value. Write "" to match an empty value.`);
  requireColumns(shapeRows, [field], 'where');
}
