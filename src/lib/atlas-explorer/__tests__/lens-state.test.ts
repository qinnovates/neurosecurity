import { describe, expect, it } from 'vitest';
import { LENS_KINDS, lensNeedsSubject, type LensKind } from '../lens-state';

describe('lensNeedsSubject', () => {
  const expected: Record<typeof LENS_KINDS[number], boolean> = {
    band: false,
    niss: false,
    technique: true,
    dsm: true,
    stated_targets: true,
  };

  it('is pinned for every lens kind', () => {
    expect(Object.keys(expected).sort()).toEqual([...LENS_KINDS].sort());
    for (const kind of LENS_KINDS) expect(lensNeedsSubject(kind), kind).toBe(expected[kind]);
  });
});
