// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { LENS_KINDS, emptyLens, withLensSubject, type LensKind } from '@/lib/atlas-explorer/lens-state';
import type { LensTally } from '@/lib/atlas-explorer/region-rows';
import { buildFixtureModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import LensPanel from '../LensPanel';

afterEach(cleanup);

const model = buildFixtureModel();
const tally: LensTally = { withValue: 3, namedNotCounted: 1, noData: 2, drafted: 4 };
const noop = (): void => undefined;

function hasTally(kind: LensKind, hasSubject: boolean): boolean {
  const lens = hasSubject ? withLensSubject(kind, 'chosen_subject') : emptyLens(kind);
  const { container } = render(<LensPanel model={model} lens={lens} tally={tally} onChooseKind={noop} onChooseSubject={noop} onSelectRegion={noop} />);
  const found = container.querySelector('[data-tally="true"]') !== null;
  cleanup();
  return found;
}

describe('the lens panel tally', () => {
  const expectedWithoutSubject: Record<LensKind, boolean> = { band: false, technique: false, niss: true, dsm: false, stated_targets: false };
  const expectedWithSubject: Record<LensKind, boolean> = { band: false, technique: true, niss: true, dsm: true, stated_targets: true };

  it.each(LENS_KINDS)('shows the tally for %s exactly as before', (kind) => {
    expect(hasTally(kind, false)).toBe(expectedWithoutSubject[kind]);
    expect(hasTally(kind, true)).toBe(expectedWithSubject[kind]);
  });
});
