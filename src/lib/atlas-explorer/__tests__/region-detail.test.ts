import { describe, expect, it } from 'vitest';
import { techniqueLinkKey } from '@/lib/anatomy/row-digest';
import { buildRegionDetail, evidenceKeyOfLink } from '../region-detail';
import { summariseTechnique } from '../technique-summary';
import { FIXTURE_IDS, buildFixtureModel, loadRealModel } from './explorer-fixtures';

const model = buildFixtureModel();

describe('buildRegionDetail', () => {
  it('keeps counted links, uncounted links and band-only techniques in three separate groups', () => {
    const pfc = buildRegionDetail(model, 'pfc');
    expect(pfc?.linked.map((technique) => technique.id)).toEqual([FIXTURE_IDS.linkedTechnique, FIXTURE_IDS.secondLinkedTechnique]);
    expect(pfc?.namedNotCounted).toEqual([]);
    expect(pfc?.bandLevel).toEqual([]);
    const hippocampus = buildRegionDetail(model, 'hippocampus');
    expect(hippocampus?.linked).toEqual([]);
    expect(hippocampus?.namedNotCounted.map((technique) => [technique.id, technique.uncountedReason])).toEqual([[FIXTURE_IDS.linkedTechnique, 'the technique\'s own band tags do not include this region\'s band']]);
    expect(hippocampus?.bandLevel).toEqual([{ id: FIXTURE_IDS.bandLevelTechnique, name: 'Fixture band-level' }]);
  });

  it('gives NISS and DSM as facts about linked techniques, and no data where none is linked', () => {
    expect(buildRegionDetail(model, 'pfc')).toMatchObject({ nissStep: 'high', clusters: [{ cluster: 'cognitive_psychotic', entryCount: 1 }, { cluster: 'mood_trauma', entryCount: 1 }] });
    expect(buildRegionDetail(model, 'hippocampus')).toMatchObject({ nissStep: null, clusters: [] });
  });

  it('says what a region is drawn through, what else that shape holds, and which devices name it', () => {
    const m1 = buildRegionDetail(model, 'm1');
    expect(m1?.shapes).toHaveLength(1);
    expect(m1?.shapes[0]).toMatchObject({ label: 'Label 20', sharedWith: ['sma'], shipped: 'nothing', mirrored: false });
    expect(m1?.geometryLimit.id).toBe('geometry_contained');
    expect(m1?.deviceIds).toEqual([FIXTURE_IDS.device]);
    expect(buildRegionDetail(model, 'cord')).toMatchObject({ shapes: [], deviceIds: [], description: null });
    expect(buildRegionDetail(model, 'cord')?.geometryLimit.text).toContain('No cleared atlas draws the cord.');
    expect(buildRegionDetail(model, 'pfc')?.description).toBe('Fixture description of the prefrontal cortex.');
  });

  it('never calls a location marker a shape on the real data (guard)', () => {
    const real = loadRealModel();
    const vta = buildRegionDetail(real, 'vta');
    expect(vta?.region.geometry.state).toBe('marker_only');
    expect(vta?.shapes.map((shape) => shape.shipped)).toEqual(vta?.shapes.map(() => 'marker'));
    expect(vta?.shapes.length).toBeGreaterThan(0);
    expect(buildRegionDetail(real, 'hippocampus')?.shapes.some((shape) => shape.shipped === 'shape')).toBe(true);
  });

  it('returns null for an id the index does not hold', () => {
    expect(buildRegionDetail(model, 'default_mode')).toBeNull();
    expect(buildRegionDetail(model, 'nowhere')).toBeNull();
  });

  it('builds the evidence key the build writes', () => {
    expect(evidenceKeyOfLink('QIF-T0010', 'motor cortex')).toBe(techniqueLinkKey('QIF-T0010', 'motor cortex'));
  });

  it('finds linked techniques, band-only techniques and a description on the real data (guard)', () => {
    const real = loadRealModel();
    const details = real.regions.map((region) => buildRegionDetail(real, region.id));
    expect(details.filter((detail) => detail === null)).toEqual([]);
    expect(details.filter((detail) => (detail?.linked.length ?? 0) > 0).length).toBeGreaterThan(0);
    expect(details.filter((detail) => (detail?.bandLevel.length ?? 0) > 0).length).toBeGreaterThan(30);
    expect(details.filter((detail) => detail?.description === null)).toEqual([]);
    const linkedIds = new Set(details.flatMap((detail) => detail?.linked.map((technique) => technique.id) ?? []));
    const bandLevelIds = new Set(details.flatMap((detail) => detail?.bandLevel.map((technique) => technique.id) ?? []));
    expect([...linkedIds].filter((id) => bandLevelIds.has(id))).toEqual([]);
  });
});

describe('summariseTechnique', () => {
  it('lists linked regions, regions named but not counted, and words the atlas has no region for', () => {
    expect(summariseTechnique(model, FIXTURE_IDS.linkedTechnique)).toMatchObject({
      kind: 'regions', linkedRegions: [{ id: 'pfc', name: 'pfc' }], unresolvedTerms: ['cochlea'],
      namedNotCounted: [{ id: 'hippocampus', term: 'hippocampus', reason: 'the technique\'s own band tags do not include this region\'s band' }],
    });
  });

  it('describes a device-only technique as linked to nothing, and an unknown id as null', () => {
    expect(summariseTechnique(model, FIXTURE_IDS.deviceOnlyTechnique)).toMatchObject({ kind: 'device_only', linkedRegions: [], reviewState: null });
    expect(summariseTechnique(model, 'QIF-T0000')).toBeNull();
  });
});
