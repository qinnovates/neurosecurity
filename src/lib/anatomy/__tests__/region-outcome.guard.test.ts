import { describe, expect, it } from 'vitest';
import { loadAnatomyBundle, loadAnatomyData } from '@/components/atlas-scene/load-anatomy-data';
import { summariseRegionOutcome } from '../region-outcome';

/**
 * The outcome over the 38 QIF regions. These lists change only in a reviewed
 * diff that adds or removes geometry; the mappings behind them are AI-drafted
 * and no neuroanatomist has checked them.
 */
const REGION_COUNT = 38;
const OWN_SHAPE_COUNT = 22;
const CONTAINED_REGION_IDS = ['a1', 'cerebellum_cortex', 'm1', 'pfc', 'pmc', 's1_cortex', 'sma', 'v1', 'vim', 'wernicke'];
const NO_GEOMETRY_REGION_IDS = ['cauda_equina', 'cervical_cord', 'lumbar_cord', 'reticular_formation', 'sacral_cord', 'thoracic_cord'];
/** Has a row of its own but is too small on its source grid to outline, so it ships as a marker. */
const MARKER_ONLY_REGION_IDS = ['vta'];

const data = loadAnatomyData();
const regionIds = data.engineData.regions.map((region) => region.id);
const outcome = summariseRegionOutcome(regionIds, data.crosswalk, data.manifest);

describe('summariseRegionOutcome on bad fixtures', () => {
  it('reports a region with neither a drawing row nor a no-geometry record', () => {
    const withHole = { ...data.crosswalk, rows: data.crosswalk.rows.filter((row) => row.subject_id !== 'stn') };
    expect(summariseRegionOutcome(regionIds, withHole, data.manifest).unaccounted).toEqual(['stn']);
  });

  it('reports a drawing row whose labels are in no shipped asset', () => {
    expect(summariseRegionOutcome(regionIds, data.crosswalk, null).withoutShippedNode).toHaveLength(OWN_SHAPE_COUNT + CONTAINED_REGION_IDS.length);
    const manifest = data.manifest;
    if (manifest === null) throw new Error('the manifest is missing');
    const withoutCit168 = { ...manifest, assets: manifest.assets.filter((asset) => !asset.source_ids.includes('cit168_rl')) };
    expect(summariseRegionOutcome(regionIds, data.crosswalk, withoutCit168).withoutShippedNode.sort()).toEqual(['gpe', 'gpi', 'stn', 'striatum', 'substantia_nigra', 'vta']);
  });

  it('counts a region as contained only when every drawing row for it is', () => {
    const regraded = { ...data.crosswalk, rows: data.crosswalk.rows.map((row) => (row.subject_id === 'stn' ? { ...row, extent_match: 'contained' as const } : row)) };
    expect(summariseRegionOutcome(regionIds, regraded, data.manifest).contained).toContain('stn');
  });
});

describe('the region outcome (guard)', () => {
  it('accounts for every one of the 38 regions, end to end', () => {
    expect(regionIds).toHaveLength(REGION_COUNT);
    expect(outcome.unaccounted).toEqual([]);
    expect(outcome.withoutShippedNode).toEqual([]);
    expect(outcome.own.length + outcome.contained.length + outcome.none.length).toBe(REGION_COUNT);
  });

  it('is 22 with a shape of their own, 10 contained and 6 with none', () => {
    expect(outcome.own).toHaveLength(OWN_SHAPE_COUNT);
    expect([...outcome.contained].sort()).toEqual(CONTAINED_REGION_IDS);
    expect([...outcome.none].sort()).toEqual(NO_GEOMETRY_REGION_IDS);
  });

  it('draws every row from a buildable atlas, and gives every region without geometry a reason and its source', () => {
    const drawing = data.crosswalk.rows.filter((row) => row.draws);
    expect(drawing.length).toBeGreaterThanOrEqual(OWN_SHAPE_COUNT + CONTAINED_REGION_IDS.length);
    expect(drawing.filter((row) => data.buildabilityBySource.get(row.atlas)?.buildable !== true)).toEqual([]);
    expect(data.crosswalk.rows.filter((row) => row.drafted_by !== 'ai' || row.evidence.check_status !== 'unchecked')).toEqual([]);
    expect(data.crosswalk.no_geometry.filter((record) => record.reason.length === 0 || record.reason_source.length === 0)).toEqual([]);
  });

  it('reaches the index with the same outcome, and a marker never reads as drawn', () => {
    const regions = loadAnatomyBundle().index.subjects.filter((subject) => subject.kind === 'region');
    const idsIn = (state: string): string[] => regions.filter((subject) => subject.geometry.state === state).map((subject) => subject.id).sort();
    expect(idsIn('marker_only')).toEqual(MARKER_ONLY_REGION_IDS);
    expect(idsIn('drawn')).toHaveLength(OWN_SHAPE_COUNT - MARKER_ONLY_REGION_IDS.length);
    expect(idsIn('contained')).toEqual(CONTAINED_REGION_IDS);
    expect(idsIn('no_geometry')).toEqual(NO_GEOMETRY_REGION_IDS);
  });
});
