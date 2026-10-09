/**
 * Parsing and arithmetic for the query engine's `summarize` step:
 * `count() by field[, field]` and `sum|avg|min|max(field) by field[, field]`.
 */

import { FORBIDDEN_KEYS } from './kql-columns';

export type Aggregate = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface SummarizePlan {
  fn: Aggregate;
  /** The column aggregated; empty for count(). */
  valueField: string;
  groupFields: string[];
}

const SUMMARIZE_PATTERN = /^(count|sum|avg|min|max)\((\w*)\)\s+by\s+(.+)$/i;
const SUMMARIZE_FIELD_PATTERN = /^\w+$/;
const SUMMARIZE_USAGE = 'Expected: count() by field[, field], or sum/avg/min/max(field) by field[, field]';

export function aggregate(fn: Aggregate, values: readonly number[]): number {
  switch (fn) {
    case 'count': return values.length;
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min': return Math.min(...values);
    case 'max': return Math.max(...values);
  }
}

/** @throws Error when the clause is not one of the two forms, or names a group column twice. */
export function parseSummarize(clause: string): SummarizePlan {
  const match = clause.trim().match(SUMMARIZE_PATTERN);
  if (!match) throw new Error(`Invalid summarize: "${clause}". ${SUMMARIZE_USAGE}`);
  const fn = match[1].toLowerCase() as Aggregate;
  const valueField = match[2];
  const groupFields = match[3].split(',').map(field => field.trim());
  const isValid = (fn === 'count') === (valueField === '')
    && groupFields.every(field => SUMMARIZE_FIELD_PATTERN.test(field) && !FORBIDDEN_KEYS.has(field))
    && new Set(groupFields).size === groupFields.length;
  if (!isValid) throw new Error(`Invalid summarize: "${clause}". ${SUMMARIZE_USAGE}`);
  return { fn, valueField, groupFields };
}
