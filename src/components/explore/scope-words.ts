/**
 * Where a technique stands against a device, in the Lab's terms, with the condition filled
 * in from the scope statement. Nothing is worded here that the scope statement does not hold.
 */

import { SCOPE_TERM_LABELS, wouldApplyIfLabel } from '@/lib/threat-model/lab-terms';
import type { ScopeEntry } from '@/lib/threat-model/scope-statement';

const LAST_CLAUSE_WORD = 'and';
const FINAL_FULL_STOP = /\.$/;

/** A sentence from the scope statement as a clause: no capital, no full stop. */
function toClause(sentence: string): string {
  const trimmed = sentence.trim().replace(FINAL_FULL_STOP, '');
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** "a", "a and b", or "a, b, and c": every clause is printed, none is dropped. */
function joinClauses(clauses: readonly string[]): string {
  if (clauses.length <= 2) return clauses.join(` ${LAST_CLAUSE_WORD} `);
  return `${clauses.slice(0, -1).join(', ')}, ${LAST_CLAUSE_WORD} ${clauses[clauses.length - 1]}`;
}

/** The term's label; under "would apply if", the device states that would meet each unmet condition. */
export function scopeLabelOf(entry: Pick<ScopeEntry, 'term' | 'conditions'>): string {
  if (entry.term !== 'would_apply_if' || entry.conditions.length === 0) return SCOPE_TERM_LABELS[entry.term];
  return wouldApplyIfLabel(joinClauses(entry.conditions.map((condition) => toClause(condition.restoringAnswer))));
}
