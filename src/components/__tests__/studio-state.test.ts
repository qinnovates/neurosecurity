import { describe, it, expect } from 'vitest';
import { parseSavedState, serialiseState } from '../threat-model/saved-state';
import { createInitialState, hasUserWork, studioReducer, type StudioState } from '../threat-model/studio-state';
import { DeviceModelFormatError } from '../../lib/threat-model/errors';
import { loadEngineBundle, loadReferenceData } from '../../lib/threat-model/__tests__/load-test-data';

const bundle = loadEngineBundle();
const { archetypes } = loadReferenceData(bundle);
const registrarVersion = bundle.engineData.registrarVersion;
const regionIds = new Set(bundle.engineData.regions.map((region) => region.id));
const stimulator = archetypes[2];

function freshState(): StudioState {
  return createInitialState(stimulator, registrarVersion);
}

describe('hasUserWork', () => {
  it('is false for an untouched preset', () => {
    expect(hasUserWork(freshState(), archetypes)).toBe(false);
  });

  it('is true once a risk is decided or an answer changes', () => {
    const decided = studioReducer(freshState(), { type: 'risk-decided', riskId: 'implant::QIF-T0001', status: 'mitigated', note: '' });
    const state = freshState();
    const renamed = studioReducer(state, {
      type: 'answers-changed', archetype: stimulator, registrarVersion, answers: { ...state.answers!, name: 'Our stimulator' },
    });
    expect(hasUserWork(decided, archetypes)).toBe(true);
    expect(hasUserWork(renamed, archetypes)).toBe(true);
  });

  it('is true for an imported model', () => {
    const imported = studioReducer(freshState(), { type: 'model-imported', model: freshState().model });
    expect(hasUserWork(imported, archetypes)).toBe(true);
  });
});

describe('saved device', () => {
  it('restores the same state it saved, including decisions and removed parts', () => {
    const base = freshState();
    const edited = studioReducer(
      studioReducer(base, {
        type: 'answers-changed', archetype: stimulator, registrarVersion,
        answers: { ...base.answers!, name: 'Our stimulator', removedComponentIds: ['cloud'] },
      }),
      { type: 'risk-decided', riskId: 'implant::QIF-T0001', status: 'accepted', note: 'Reviewed.' },
    );
    expect(parseSavedState(serialiseState(edited), archetypes, regionIds)).toEqual(edited);
  });

  it('keeps a model whose preset no longer exists, as an imported model', () => {
    const saved = serialiseState({ ...freshState(), archetypeId: 'retired-preset' });
    const restored = parseSavedState(saved, archetypes, regionIds);
    expect(restored.archetypeId).toBeNull();
    expect(restored.answers).toBeNull();
  });

  it('rejects saved text that is not JSON, not an object, or holds a tampered model', () => {
    expect(() => parseSavedState('not json', archetypes, regionIds)).toThrow(DeviceModelFormatError);
    expect(() => parseSavedState('[]', archetypes, regionIds)).toThrow(DeviceModelFormatError);
    const tampered = JSON.parse(serialiseState(freshState())) as { model: Record<string, unknown> };
    tampered.model.isAdmin = true;
    expect(() => parseSavedState(JSON.stringify(tampered), archetypes, regionIds)).toThrow(DeviceModelFormatError);
  });

  it('replaces the whole state on restore', () => {
    const saved = freshState();
    const other = createInitialState(archetypes[0], registrarVersion);
    expect(studioReducer(other, { type: 'state-restored', state: saved })).toBe(saved);
  });
});
