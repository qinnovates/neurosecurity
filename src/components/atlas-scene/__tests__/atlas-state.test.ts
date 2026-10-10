import { describe, expect, it } from 'vitest';
import { INITIAL_EXPLORER_STATE, explorerReducer, type ExplorerAction, type ExplorerState } from '../atlas-state';

const apply = (actions: readonly ExplorerAction[], from: ExplorerState = INITIAL_EXPLORER_STATE): ExplorerState => actions.reduce(explorerReducer, from);
const REGION = { kind: 'region', id: 'pfc' } as const;

describe('explorerReducer', () => {
  it('starts on the band lens with nothing selected and no filter', () => {
    expect(INITIAL_EXPLORER_STATE).toMatchObject({ selection: null, lens: { kind: 'band' }, railStageId: null, railIncludesMixed: false });
    expect(INITIAL_EXPLORER_STATE.layers).toEqual({ outline: true, cortical: true, deep: true, tracts: false, networks: false, devices: false });
  });

  it('keeps the selection through every lens, layer, filter and rail change', () => {
    const state = apply([
      { type: 'target_selected', target: REGION },
      { type: 'lens_kind_chosen', kind: 'technique' },
      { type: 'lens_subject_chosen', kind: 'technique', subjectId: 'QIF-T0001' },
      { type: 'lens_kind_chosen', kind: 'niss' },
      { type: 'layer_toggled', layerId: 'deep' },
      { type: 'filter_changed', filter: { query: 'cortex' } },
      { type: 'rail_stage_toggled', stageId: 'S2' },
      { type: 'rail_mixed_toggled' },
    ]);
    expect(state.selection).toEqual(REGION);
    expect(state).toMatchObject({ lens: { kind: 'niss' }, railStageId: 'S2', railIncludesMixed: true, filter: { query: 'cortex', geometry: 'all', onlyWithData: false } });
    expect(state.layers.deep).toBe(false);
  });

  it('clears a lens subject when the kind changes, and keeps it when the same kind is chosen again', () => {
    const onTechnique = apply([{ type: 'lens_subject_chosen', kind: 'technique', subjectId: 'QIF-T0001' }]);
    expect(explorerReducer(onTechnique, { type: 'lens_kind_chosen', kind: 'technique' })).toBe(onTechnique);
    expect(explorerReducer(onTechnique, { type: 'lens_kind_chosen', kind: 'dsm' }).lens).toEqual({ kind: 'dsm', cluster: null });
    expect(apply([{ type: 'lens_subject_chosen', kind: 'stated_targets', subjectId: 'device-a' }]).lens).toEqual({ kind: 'stated_targets', deviceId: 'device-a' });
  });

  it('clears the selection and the filter only when asked, and closes a rail stage toggled twice', () => {
    const state = apply([{ type: 'target_selected', target: REGION }, { type: 'filter_changed', filter: { onlyWithData: true } }, { type: 'rail_stage_toggled', stageId: 'I0' }]);
    expect(explorerReducer(state, { type: 'selection_cleared' }).selection).toBeNull();
    expect(explorerReducer(state, { type: 'filter_cleared' }).filter).toEqual(INITIAL_EXPLORER_STATE.filter);
    expect(explorerReducer(state, { type: 'rail_stage_toggled', stageId: 'I0' }).railStageId).toBeNull();
  });

  it('never mutates the state it is given and stays plain data that survives a round trip through JSON', () => {
    const before = JSON.stringify(INITIAL_EXPLORER_STATE);
    const state = apply([{ type: 'target_selected', target: REGION }, { type: 'lens_subject_chosen', kind: 'dsm', subjectId: 'mood_trauma' }, { type: 'layer_toggled', layerId: 'outline' }]);
    expect(JSON.stringify(INITIAL_EXPLORER_STATE)).toBe(before);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
