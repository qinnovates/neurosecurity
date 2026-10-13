import { describe, expect, it } from 'vitest';
import registrar from '@shared/qtara-registrar.json';
import { filterSubjectOptions, listClusterOptions, listDeviceOptions, listSubjectOptions, listTechniqueOptions } from '../subject-options';
import { FIXTURE_IDS, buildFixtureModel, loadRealModel } from './explorer-fixtures';

const model = buildFixtureModel();
const options = listTechniqueOptions(model);

describe('listTechniqueOptions', () => {
  it('lists neural and device-only techniques together, in id order, each saying what kind it is', () => {
    expect(options.map((option) => [option.id, option.techniqueKind])).toEqual([
      [FIXTURE_IDS.linkedTechnique, 'regions'], [FIXTURE_IDS.bandLevelTechnique, 'band_level'], [FIXTURE_IDS.notDraftedTechnique, 'not_drafted'],
      [FIXTURE_IDS.secondLinkedTechnique, 'regions'], [FIXTURE_IDS.deviceOnlyTechnique, 'device_only'],
    ]);
    expect(options[0].detail).toBe('1 region linked; S1, N7');
    expect(options[4].detail).toBe('device stages only; S2, S3');
  });

  it('carries the review mark exactly where a drafted link stands behind the option', () => {
    expect(options.map((option) => option.reviewState?.mark ?? null)).toEqual(['AI-drafted, unreviewed', null, null, 'AI-drafted, unreviewed', null]);
  });

  it('offers every technique of the real catalog, once (guard)', () => {
    const real = listTechniqueOptions(loadRealModel());
    expect(real).toHaveLength(registrar.techniques.length);
    expect(real).toHaveLength(176);
    expect(new Set(real.map((option) => option.id)).size).toBe(176);
    expect(real.filter((option) => option.techniqueKind === 'device_only')).toHaveLength(65);
    expect(real.filter((option) => option.reviewState !== null).length).toBeGreaterThan(0);
  });
});

describe('filterSubjectOptions', () => {
  it('keeps everything for an empty query and nothing for a query that matches nothing', () => {
    expect(filterSubjectOptions(options, '  ')).toEqual(options);
    expect(filterSubjectOptions(options, 'zzz')).toEqual([]);
  });

  it('matches every word against id, name and detail, whatever the case', () => {
    expect(filterSubjectOptions(options, 'FIXTURE firmware').map((option) => option.id)).toEqual([FIXTURE_IDS.deviceOnlyTechnique]);
    expect(filterSubjectOptions(options, 'band tag').map((option) => option.id)).toEqual([FIXTURE_IDS.bandLevelTechnique]);
    expect(filterSubjectOptions(options, 'n7').map((option) => option.id)).toEqual([FIXTURE_IDS.linkedTechnique, FIXTURE_IDS.notDraftedTechnique, FIXTURE_IDS.secondLinkedTechnique]);
  });

  it('puts an exact id first', () => {
    const real = listTechniqueOptions(loadRealModel());
    expect(filterSubjectOptions(real, 'qif-t0010')[0].id).toBe('QIF-T0010');
    expect(filterSubjectOptions(real, 'QIF-T001').length).toBeGreaterThan(1);
  });
});

describe('cluster and device options', () => {
  it('list the cluster tags the techniques carry and the devices the atlas file records', () => {
    expect(listClusterOptions(model).map((option) => [option.id, option.label, option.detail])).toEqual([
      ['cognitive_psychotic', 'cognitive psychotic', '1 catalog entry'], ['mood_trauma', 'mood trauma', '2 catalog entries'],
    ]);
    expect(listDeviceOptions(model)).toEqual([{ id: FIXTURE_IDS.device, label: FIXTURE_IDS.device, detail: '1 region listed', reviewState: null }]);
    expect(listSubjectOptions(model, 'band')).toEqual([]);
    expect(listSubjectOptions(model, 'stated_targets')).toHaveLength(1);
    expect(listDeviceOptions(loadRealModel()).length).toBeGreaterThan(10);
  });
});
