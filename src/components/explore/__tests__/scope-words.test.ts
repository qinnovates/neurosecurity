import { describe, it, expect } from 'vitest';
import { SCOPE_TERMS, SCOPE_TERM_LABELS, SCOPE_TERM_SHORT_LABELS } from '@/lib/threat-model/lab-terms';
import { summariseScope } from '@/lib/threat-model/scope-statement';
import { PRESETS, engineData, referenceData } from '@/lib/threat-model/__tests__/preset-reports';
import { scopeLabelOf } from '../scope-words';

describe.each(PRESETS)('the "would apply if" label on the preset %s', (_id, { model }) => {
  const { wouldApplyIf } = summariseScope(model, engineData, referenceData);

  it('names every unmet condition of every conditional technique, each from its restoring answer', () => {
    expect(wouldApplyIf.length).toBeGreaterThan(0);
    for (const entry of wouldApplyIf) {
      const label = scopeLabelOf(entry);
      expect(label.startsWith('Would apply if '), entry.techniqueId).toBe(true);
      for (const condition of entry.conditions) {
        const clause = condition.restoringAnswer.replace(/\.$/, '');
        expect(label, `${entry.techniqueId}: ${condition.ruleId}`).toContain(clause.charAt(0).toLowerCase() + clause.slice(1));
      }
    }
  });
});

describe('the label of a technique with three unmet conditions', () => {
  it('lists all three, where it used to stop at the first', () => {
    const [, { model }] = PRESETS[2];
    const entry = summariseScope(model, engineData, referenceData).wouldApplyIf.find((candidate) => candidate.conditions.length === 3);
    expect(entry).toBeDefined();
    if (entry === undefined) return;
    expect(scopeLabelOf(entry)).toBe('Would apply if the device can record, the system shows images or plays sounds to the patient, and at least one of the device\'s target regions is cortical');
  });

  it('joins one, two and three clauses without dropping any', () => {
    const condition = (restoringAnswer: string) => ({ ruleId: restoringAnswer, detail: '', restoringAnswer });
    expect(scopeLabelOf({ term: 'would_apply_if', conditions: [condition('A is so.')] })).toBe('Would apply if a is so');
    expect(scopeLabelOf({ term: 'would_apply_if', conditions: [condition('A is so.'), condition('B is so.')] })).toBe('Would apply if a is so and b is so');
    expect(scopeLabelOf({ term: 'would_apply_if', conditions: [condition('A is so.'), condition('B is so.'), condition('C is so.')] })).toBe('Would apply if a is so, b is so, and c is so');
  });
});

describe('the short scope labels', () => {
  it('are the opening words of the full labels, so they say nothing the full labels do not', () => {
    for (const term of SCOPE_TERMS) expect(SCOPE_TERM_LABELS[term].startsWith(SCOPE_TERM_SHORT_LABELS[term]), term).toBe(true);
    expect(new Set(Object.values(SCOPE_TERM_SHORT_LABELS)).size).toBe(SCOPE_TERMS.length);
  });
});
