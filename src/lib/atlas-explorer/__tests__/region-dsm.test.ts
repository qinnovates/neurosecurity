import { describe, expect, it } from 'vitest';
import atlas from '@shared/qif-brain-bci-atlas.json';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { readPathways, readTechniqueDsm } from '../catalog-dsm';
import { buildRegionDsm } from '../region-dsm';
import { FIXTURE_IDS, buildFixtureModel } from './explorer-fixtures';

const TECHNIQUE_ID = 'QIF-T9100';
const reference = { code: 'F00.0', name: 'Fixture category', confidence: 'probable' };
const registrarWith = (dsm5: unknown): unknown => ({ techniques: [{ id: TECHNIQUE_ID, tara: { dsm5 } }, { id: 'QIF-T9101', tara: { dsm5: { primary: [reference] } } }] });
const pathwayWith = (overrides: Record<string, unknown>): unknown => ({
  pathways: [{ id: 'fixture', name: 'Fixture Pathway', origin: ['pfc'], targets: ['primary_motor_cortex', 'pfc'], dsm_conditions: ['F00.x'], dsm_names: ['Fixture category'], ...overrides }],
});

describe('the references the catalog copies from the datalake', () => {
  it('keeps the registrar\'s references word for word, primary first, for the techniques asked for and no other', () => {
    const secondary = { code: 'F00.1', name: 'Second fixture category', confidence: 'established' };
    expect(readTechniqueDsm(registrarWith({ primary: [reference], secondary: [secondary] }), [TECHNIQUE_ID])).toEqual([
      { id: TECHNIQUE_ID, references: [{ ...reference, tier: 'primary' }, { ...secondary, tier: 'secondary' }] },
    ]);
    expect(readTechniqueDsm(registrarWith({ primary: [], secondary: [] }), [TECHNIQUE_ID])).toEqual([]);
    expect(readTechniqueDsm({ techniques: [{ id: TECHNIQUE_ID }] }, [TECHNIQUE_ID])).toEqual([]);
  });

  it('stops the build on a reference with no name, and never guesses one', () => {
    expect(() => readTechniqueDsm(registrarWith({ primary: [{ code: 'F00.0', confidence: 'probable' }] }), [TECHNIQUE_ID])).toThrow(AnatomyDataError);
    expect(() => readTechniqueDsm(registrarWith({ primary: 'F00.0' }), [TECHNIQUE_ID])).toThrow(/primary: expected a list/);
  });

  it('lists a pathway under each region its record names by id or by a synonym, once', () => {
    expect(readPathways(pathwayWith({}), atlas)).toEqual([
      { id: 'fixture', name: 'Fixture Pathway', region_ids: ['pfc', 'm1'], dsm_references: [{ code: 'F00.x', name: 'Fixture category' }] },
    ]);
  });

  it('refuses a pathway end that is a broader structure or no region at all, so no region gains a reference by a guess', () => {
    expect(() => readPathways(pathwayWith({ targets: ['cortex'] }), atlas)).toThrow(/"cortex" is not a region id or a synonym of one \(it resolves as whole_to_part\)/);
    expect(() => readPathways(pathwayWith({ origin: ['nowhere'] }), atlas)).toThrow(/resolves as unclassified/);
    expect(() => readPathways(pathwayWith({ dsm_names: [] }), atlas)).toThrow(/differ in length/);
    expect(() => readPathways({ pathways: 'none' }, atlas)).toThrow(/expected a list of objects/);
  });
});

describe('the references that reach one region', () => {
  const model = buildFixtureModel();

  it('arrive through a linked technique with that link\'s review mark, and through a pathway that lists the region', () => {
    const dsm = buildRegionDsm(model, 'pfc');
    expect(dsm.viaTechniques).toEqual([{ code: 'F00.0', name: 'Fixture category', carriers: [FIXTURE_IDS.secondLinkedTechnique] }]);
    expect(dsm.linkReviewState?.mark).toBe('AI-drafted, unreviewed');
    expect(dsm.pathwayNames).toEqual(['Fixture Pathway']);
    expect(dsm.viaPathways).toEqual([{ code: 'F00.x', name: 'Fixture category (pathway wording)', carriers: ['Fixture Pathway'] }]);
  });

  it('are none for a region with no linked technique and no pathway, with no mark to show', () => {
    expect(buildRegionDsm(model, 'cord')).toEqual({ viaTechniques: [], linkReviewState: null, pathwayNames: [], viaPathways: [] });
    expect(buildRegionDsm(model, 'hippocampus').viaTechniques).toEqual([]);
  });
});
