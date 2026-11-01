import { describe, expect, it } from 'vitest';
import { model } from '../atlas-scene/__tests__/region-view-test-kit';
import { INITIAL_TARA_STATE, taraReducer, buildTaraPanelModel, filterTtpList, taraBrainLens, type TaraTechnique } from './tara-state';

const linked = [...model.linksByRegion.entries()].find(([, links]) => links.some(({ link }) => link.lit))!;
const id = linked[1].find(({ link }) => link.lit)!.technique.id;
const catalog: TaraTechnique[] = [...new Set(model.index.techniques.map((t) => t.id))].map((techniqueId) => ({ id: techniqueId, name: techniqueId, therapeuticAnalog: techniqueId === id ? 'Therapeutic analog' : null, evidenceTier: 'theoretical_proposed', sources: ['Recorded source'], clinicalSources: [] }));
const initial = { ...INITIAL_TARA_STATE, selectedRegionId: linked[0] };

describe('one TARA state', () => {
  it('keeps NISS scores out of the default panel model', () => {
    expect(initial.nissOpen).toBe(false);
    expect(buildTaraPanelModel(model, initial, catalog).scores).toEqual([]);
  });
  it('changes panel emphasis and brain colouring together for every lens', () => {
    for (const lens of ['band', 'niss', 'evidence'] as const) {
      const state = taraReducer(initial, { type: 'lens', lens });
      expect(taraBrainLens(state, catalog).kind).toBe(lens);
      expect(buildTaraPanelModel(model, state, catalog).emphasis).toBe(lens === 'band' ? 'band' : lens === 'niss' ? 'NISS score' : 'Evidence');
      expect(state.nissOpen).toBe(lens === 'niss');
      expect(state.evidenceOpen).toBe(lens === 'evidence');
    }
  });
  it('opens NISS only on disclosure or NISS selection and resets on region change', () => {
    const opened = taraReducer(initial, { type: 'niss', open: true });
    expect(opened.nissOpen).toBe(true);
    expect(taraReducer(opened, { type: 'region', id: model.regions[1].id }).nissOpen).toBe(false);
    const niss = taraReducer(initial, { type: 'lens', lens: 'niss' });
    expect(taraReducer(niss, { type: 'region', id: model.regions[1].id }).nissOpen).toBe(true);
    expect(taraReducer(niss, { type: 'lens', lens: 'band' }).nissOpen).toBe(false);
  });
  it('filters the region panel by perspective and derives its count', () => {
    const clinical = taraReducer(initial, { type: 'perspective', perspective: 'clinical' });
    const panel = buildTaraPanelModel(model, clinical, catalog);
    expect(panel.techniques.map((t) => t.id)).toEqual([id]);
    expect(panel.count).toBe(panel.techniques.length);
    expect(panel.techniques.every((t) => t.therapeuticAnalog)).toBe(true);
  });
  it('changes the selected region and gives an empty-region message', () => {
    const emptyModel = { ...model, linksByRegion: new Map() };
    const state = taraReducer(initial, { type: 'region', id: model.regions[1].id });
    const panel = buildTaraPanelModel(emptyModel, state, catalog);
    expect(panel.region?.id).toBe(model.regions[1].id);
    expect(panel.count).toBe(0);
    expect(panel.emptyMessage).toBe('No mapped techniques for this region under the both perspective.');
    expect(buildTaraPanelModel(model, { ...state, selectedRegionId: null }, catalog).emptyMessage).toMatch(/Choose a region/);
  });
  it('deduplicates technique links and excludes stale and band-only mappings', () => {
    const links = linked[1];
    const panel = buildTaraPanelModel({ ...model, linksByRegion: new Map([[linked[0], [...links, ...links]]]) }, initial, catalog);
    const expected = [...new Set(links.filter(({ link }) => link.lit).map(({ technique }) => technique.id))];
    expect(panel.techniques.map((t) => t.id).sort()).toEqual(expected.sort());
  });
  it('preserves a searched technique and its selected region in shared state', () => {
    const selected = taraReducer(initial, { type: 'technique', id, regionId: linked[0] });
    expect(buildTaraPanelModel(model, selected, catalog).selectedTechnique?.id).toBe(id);
    expect(selected.selectedRegionId).toBe(linked[0]);
  });
});

describe('TTP perspective filter', () => {
  const threat: TaraTechnique = { id: 'threat', name: 'Threat', therapeuticAnalog: null, evidenceTier: null, sources: [], clinicalSources: [] };
  const analog = { ...threat, id: 'analog', therapeuticAnalog: 'Therapy' };
  it('retains threat catalog entries in Security and Both', () => {
    expect(filterTtpList([threat, analog], 'security')).toEqual([threat, analog]);
    expect(filterTtpList([threat, analog], 'both')).toEqual([threat, analog]);
  });
  it('requires a nonblank therapeutic analog in Clinical', () => {
    expect(filterTtpList([threat, analog, { ...threat, therapeuticAnalog: '  ' }], 'clinical')).toEqual([analog]);
  });
  it('handles an empty list', () => expect(filterTtpList([], 'clinical')).toEqual([]));
});

// Exercise the actual ownership and renderer path, including honest no-data and mixed marks.
import { buildFixtureModel, FIXTURE_IDS } from '@/lib/atlas-explorer/__tests__/explorer-fixtures';
import { describeFill } from '@/lib/atlas-explorer/scene-shapes';
import { createExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { toColourMode } from '@/lib/atlas-explorer/lens-state';

it('colours evidence from recorded tiers and keeps absent and mixed evidence neutral', () => {
  const fixture = buildFixtureModel();
  const key = fixture.regionsById.get('pfc')!.structure_keys[0];
  const tier = 'theoretical_proposed';
  const evidence = { kind: 'evidence' as const, tiersByTechnique: { [FIXTURE_IDS.linkedTechnique]: tier, [FIXTURE_IDS.secondLinkedTechnique]: tier } };
  expect(describeFill(fixture, key, evidence, 'dark')).toMatchObject({ fill: 'solid', step: tier, colour: '#fcd34d' });
  expect(describeFill(fixture, key, { kind: 'evidence' }, 'dark').fill).toBe('lines');
  expect(describeFill(fixture, key, { ...evidence, tiersByTechnique: { ...evidence.tiersByTechnique, [FIXTURE_IDS.secondLinkedTechnique]: 'demonstrated_lab' } }, 'dark').fill).toBe('translucent');
});
it('only reveals an available score after disclosure', () => {
  const fixture = buildFixtureModel();
  const entry = { ...catalog[0], id: FIXTURE_IDS.linkedTechnique };
  const state = { ...INITIAL_TARA_STATE, selectedRegionId: 'pfc' };
  expect(buildTaraPanelModel(fixture, state, [entry]).scores).toEqual([]);
  const disclosed = buildTaraPanelModel(fixture, taraReducer(state, { type: 'niss', open: true }), [entry]);
  expect(disclosed.scores).toEqual([{ id: entry.id, name: entry.name, score: fixture.techniquesById.get(entry.id)!.niss.score }]);
});
it('uses the same Clinical subset for brain NISS as for the panel', () => {
  const fixture = buildFixtureModel();
  const entry = { ...catalog[0], id: FIXTURE_IDS.linkedTechnique, therapeuticAnalog: 'Therapy' };
  const state = { ...INITIAL_TARA_STATE, lens: 'niss' as const, perspective: 'clinical' as const };
  const ids = filterTtpList([entry, { ...entry, id: FIXTURE_IDS.secondLinkedTechnique, therapeuticAnalog: null }], state.perspective).map((t) => t.id);
  const filtered = createExplorerModel({ ...fixture.index, techniques: fixture.index.techniques.filter((t) => ids.includes(t.id)) }, fixture.catalog);
  const key = fixture.regionsById.get('pfc')!.structure_keys[0];
  expect(describeFill(filtered, key, toColourMode(taraBrainLens(state, [entry])), 'dark').step).toBe('low');
});
import { REGION_FUNCTIONS } from './region-functions';
it('provides a plain-language function for every region in the public model', () => {
  expect(model.regions.filter((region) => !REGION_FUNCTIONS[region.id]).map((region) => region.id)).toEqual([]);
});
