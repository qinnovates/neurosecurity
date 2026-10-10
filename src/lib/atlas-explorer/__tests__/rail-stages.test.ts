import { describe, expect, it } from 'vitest';
import registrar from '@shared/qtara-registrar.json';
import { buildDeviceRail, listRailTechniqueIds } from '../rail-stages';
import { FIXTURE_IDS, buildFixtureModel, loadRealModel } from './explorer-fixtures';

const isNeural = (bandId: string): boolean => bandId.startsWith('N');
const deviceOnlyIds = registrar.techniques.filter((technique) => !technique.band_ids.some(isNeural)).map((technique) => technique.id).sort();
const anyDeviceBandIds = registrar.techniques.filter((technique) => technique.band_ids.some((bandId) => !isNeural(bandId))).map((technique) => technique.id).sort();

describe('buildDeviceRail', () => {
  it('lists the four device stages, application first, and each technique under every stage it is tagged with', () => {
    const rail = buildDeviceRail(buildFixtureModel(), false);
    expect(rail.stages.map((stage) => stage.band.id)).toEqual(['S3', 'S2', 'S1', 'I0']);
    expect(rail.stages.map((stage) => stage.techniques.map((technique) => technique.id))).toEqual([[FIXTURE_IDS.deviceOnlyTechnique], [FIXTURE_IDS.deviceOnlyTechnique], [], []]);
    expect(rail).toMatchObject({ deviceOnlyCount: 1, mixedCount: 1 });
  });

  it('adds techniques that also carry a brain band only when asked, with their drafted links counted and marked', () => {
    const rail = buildDeviceRail(buildFixtureModel(), true);
    const mixed = rail.stages[2].techniques[0];
    expect(mixed).toMatchObject({ id: FIXTURE_IDS.linkedTechnique, neuralBandIds: ['N7'], draftedLinkCount: 3 });
    expect(mixed.reviewState?.mark).toBe('AI-drafted, unreviewed');
    expect(rail.stages[0].techniques[0]).toMatchObject({ neuralBandIds: [], draftedLinkCount: 0, reviewState: null });
  });

  it('holds exactly the techniques with no brain band on the real catalog: 65 today (guard)', () => {
    const rail = buildDeviceRail(loadRealModel(), false);
    expect(deviceOnlyIds).toHaveLength(65);
    expect(listRailTechniqueIds(rail)).toEqual(deviceOnlyIds);
    expect(rail).toMatchObject({ deviceOnlyCount: 65, mixedCount: 77 });
  });

  it('holds every technique with a device band once the mixed ones are included (guard)', () => {
    expect(listRailTechniqueIds(buildDeviceRail(loadRealModel(), true))).toEqual(anyDeviceBandIds);
    expect(anyDeviceBandIds).toHaveLength(142);
  });
});
