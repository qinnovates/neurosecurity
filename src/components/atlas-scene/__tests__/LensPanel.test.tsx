// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LENS_DESCRIPTIONS, LENS_KINDS, emptyLens, withLensSubject, type LensKind } from '@/lib/atlas-explorer/lens-state';
import type { LensTally } from '@/lib/atlas-explorer/region-rows';
import { buildFixtureModel } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import LensPanel from '../LensPanel';

afterEach(cleanup);

const model = buildFixtureModel();
const tally: LensTally = { withValue: 3, namedNotCounted: 1, noData: 2, drafted: 4 };
const noop = (): void => undefined;

function hasTally(kind: LensKind, hasSubject: boolean): boolean {
  const lens = hasSubject ? withLensSubject(kind, 'chosen_subject') : emptyLens(kind);
  const { container } = render(<LensPanel model={model} lens={lens} previousLens={null} tally={tally} onChooseKind={noop} onRestoreLens={noop} onChooseSubject={noop} onSelectRegion={noop} />);
  const found = container.querySelector('[data-tally="true"]') !== null;
  cleanup();
  return found;
}

describe('the lens panel explains itself', () => {
  it.each(LENS_KINDS)('says in one line what the %s lens colours by', (kind) => {
    const { container } = render(<LensPanel model={model} lens={emptyLens(kind)} previousLens={null} tally={tally} onChooseKind={noop} onRestoreLens={noop} onChooseSubject={noop} onSelectRegion={noop} />);
    expect(container.querySelector(`[data-lens-description="${kind}"]`)?.textContent).toBe(LENS_DESCRIPTIONS[kind]);
    expect(screen.queryByRole('button', { name: /^Back to the .* lens$/ })).toBeNull();
  });

  it('offers the way back to the lens a drill-down replaced, as a real button', () => {
    const onRestoreLens = vi.fn();
    render(<LensPanel model={model} lens={withLensSubject('technique', 'QIF-T0001')} previousLens={{ kind: 'band' }} tally={tally} onChooseKind={noop} onRestoreLens={onRestoreLens} onChooseSubject={noop} onSelectRegion={noop} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to the Band lens' }));
    expect(onRestoreLens).toHaveBeenCalledTimes(1);
  });
});

describe('the lens panel tally', () => {
  const expectedWithoutSubject: Record<LensKind, boolean> = { band: false, technique: false, niss: true, dsm: false, stated_targets: false };
  const expectedWithSubject: Record<LensKind, boolean> = { band: false, technique: true, niss: true, dsm: true, stated_targets: true };

  it.each(LENS_KINDS)('shows the tally for %s exactly as before', (kind) => {
    expect(hasTally(kind, false)).toBe(expectedWithoutSubject[kind]);
    expect(hasTally(kind, true)).toBe(expectedWithSubject[kind]);
  });
});
