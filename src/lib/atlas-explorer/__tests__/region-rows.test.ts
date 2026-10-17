import { describe, expect, it } from 'vitest';
import { EMPTY_LIST_FILTER, GEOMETRY_LABELS, buildBandGroups, filterBandGroups, listVisibleRowIds, tallyLens } from '../region-rows';
import { FIXTURE_IDS, buildFixtureModel, loadRealModel } from './explorer-fixtures';

const model = buildFixtureModel();
const techniqueMode = { kind: 'technique', techniqueId: FIXTURE_IDS.linkedTechnique } as const;

describe('buildBandGroups', () => {
  it('lists every band from the neocortex down, each region under its band, with its facts in words', () => {
    const groups = buildBandGroups(model, { kind: 'band' });
    expect(groups.map((group) => group.band.id)).toEqual(['N7', 'N6', 'N5', 'N4', 'N3', 'N2', 'N1']);
    expect(groups[0].rows.map((row) => row.id)).toEqual(['pfc', 'm1', 'sma']);
    expect(groups[0].rows[1]).toMatchObject({ geometryState: 'contained', geometryLabel: 'inside a larger shape', bandId: 'N7' });
    expect(groups[6].rows[0]).toMatchObject({ id: 'cord', geometryLabel: 'no shape', geometryReason: 'No cleared atlas draws the cord.' });
    expect(groups[2]).toMatchObject({ rows: [], totalRows: 0 });
  });

  it('gives every row of the real index a review mark, a geometry label and a lens value (guard)', () => {
    const rows = buildBandGroups(loadRealModel(), { kind: 'band' }).flatMap((group) => group.rows);
    expect(rows).toHaveLength(38);
    expect(rows.filter((row) => row.reviewState.mark === '' || row.geometryLabel === '' || row.lens.value === '' || row.lens.reason === '')).toEqual([]);
    expect(Object.values(GEOMETRY_LABELS).every((label) => label.length > 0)).toBe(true);
  });
});

describe('filterBandGroups', () => {
  const groups = buildBandGroups(model, techniqueMode);

  it('keeps everything when the filter is empty', () => {
    expect(listVisibleRowIds(filterBandGroups(groups, EMPTY_LIST_FILTER))).toEqual(['pfc', 'm1', 'sma', 'hippocampus', 'cord']);
  });

  it('narrows by name, id or band without changing what a row says', () => {
    expect(listVisibleRowIds(filterBandGroups(groups, { ...EMPTY_LIST_FILTER, query: ' HIPPO ' }))).toEqual(['hippocampus']);
    expect(listVisibleRowIds(filterBandGroups(groups, { ...EMPTY_LIST_FILTER, query: 'n7' }))).toEqual(['pfc', 'm1', 'sma']);
    expect(listVisibleRowIds(filterBandGroups(groups, { ...EMPTY_LIST_FILTER, query: 'nothing' }))).toEqual([]);
    const filtered = filterBandGroups(groups, { ...EMPTY_LIST_FILTER, query: 'pfc' });
    expect(filtered[0].rows[0]).toBe(groups[0].rows[0]);
    expect(filtered[0].totalRows).toBe(3);
  });

  it('narrows by shape status and by whether the lens holds data', () => {
    expect(listVisibleRowIds(filterBandGroups(groups, { ...EMPTY_LIST_FILTER, geometry: 'inside' }))).toEqual(['m1', 'sma']);
    expect(listVisibleRowIds(filterBandGroups(groups, { ...EMPTY_LIST_FILTER, geometry: 'no_shape' }))).toEqual(['hippocampus', 'cord']);
    expect(listVisibleRowIds(filterBandGroups(groups, { ...EMPTY_LIST_FILTER, onlyWithData: true }))).toEqual(['pfc', 'hippocampus']);
  });
});

describe('tallyLens', () => {
  it('counts no data on its own and counts over every region, filtered or not', () => {
    expect(tallyLens(buildBandGroups(model, techniqueMode))).toEqual({ withValue: 1, namedNotCounted: 1, noData: 3, drafted: 2 });
    expect(tallyLens(buildBandGroups(model, { kind: 'technique', techniqueId: FIXTURE_IDS.deviceOnlyTechnique }))).toEqual({ withValue: 0, namedNotCounted: 0, noData: 5, drafted: 0 });
  });
});
