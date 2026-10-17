import { describe, it, expect } from 'vitest';
import { VALIDATION_ENTRIES, getCheckedTechniqueCount } from '@/lib/validation-data';

describe('getCheckedTechniqueCount', () => {
  it('reads the count VAL-004 recorded in its own results line', () => {
    const entry = VALIDATION_ENTRIES.find((candidate) => candidate.id === 'VAL-004');
    const recorded = entry?.results.find((line) => /^\d+\/\d+ techniques/.test(line)) ?? '';
    expect(getCheckedTechniqueCount('VAL-004')).toBe(Number(recorded.split('/')[0]));
  });

  it('throws for an unknown validation id', () => {
    expect(() => getCheckedTechniqueCount('VAL-NOT-REAL')).toThrow(/not found/);
  });
});
