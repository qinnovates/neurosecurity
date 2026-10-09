import { describe, it, expect } from 'vitest';
import { parseSavedState, serialiseState } from '../threat-model/saved-state';
import { createInitialState, hasUserWork, isUntouchedPreset, studioReducer, type StudioAction, type StudioState } from '../threat-model/studio-state';
import type { DeviceModel } from '../../lib/threat-model/device-model';
import { DeviceModelFormatError } from '../../lib/threat-model/errors';
import { BLANK_DEVICE_NAME } from '../../lib/threat-model/model-edit';
import { parseDeviceModelText } from '../../lib/threat-model/parse-device-model';
import { loadEngineBundle, loadReferenceData } from '../../lib/threat-model/__tests__/load-test-data';

const bundle = loadEngineBundle();
const { archetypes } = loadReferenceData(bundle);
const registrarVersion = bundle.engineData.registrarVersion;
const regionIds = new Set(bundle.engineData.regions.map((region) => region.id));
const stimulator = archetypes[2];
const RISK_ID = 'implant::QIF-T0001';

function freshState(): StudioState {
  return createInitialState(stimulator, registrarVersion);
}

function reduce(state: StudioState, ...actions: StudioAction[]): StudioState {
  return actions.reduce(studioReducer, state);
}

/** A model as it comes out of a file: parsed text, with no memory of a preset. */
function loadedState(): StudioState {
  const model = parseDeviceModelText(JSON.stringify(freshState().model), regionIds);
  return studioReducer(freshState(), { type: 'model-imported', model });
}

function otherPartOf(model: DeviceModel) {
  return model.components.find((component) => !component.isNeuralInterface)!;
}

describe('studioReducer: edits act on the model', () => {
  it('starts a preset as a model of its own, with no decision and no submission type assumed', () => {
    const state = freshState();
    expect(state.archetypeId).toBe(stimulator.id);
    expect(state.editProblem).toBeNull();
    expect(state.model.submissionType).toBe('none');
    expect(state.model.components.map((component) => component.id)).toEqual(stimulator.components.map((component) => component.id));
  });

  it('keeps the preset action as it was: the same name and payload replace the device', () => {
    const decided = reduce(freshState(), { type: 'risk-decided', riskId: RISK_ID, status: 'accepted', note: '' });
    const replaced = studioReducer(decided, { type: 'preset-selected', archetype: archetypes[0], registrarVersion });
    expect(replaced).toEqual(createInitialState(archetypes[0], registrarVersion));
  });

  it('changes device facts, and the model is then no longer the preset', () => {
    const state = reduce(freshState(), { type: 'device-facts-changed', changes: { name: 'Our stimulator', direction: 'bidirectional' }, knownRegionIds: regionIds });
    expect(state.model.name).toBe('Our stimulator');
    expect(state.model.direction).toBe('bidirectional');
    expect(state.archetypeId).toBeNull();
  });

  it('adds, changes and removes a part; removing it removes its connections', () => {
    const added = reduce(freshState(), { type: 'part-added', part: { label: 'Relay', kind: 'wearable_processor', trustZone: 'on_body', isSharedAcrossPatients: false } });
    const relay = added.model.components[added.model.components.length - 1];
    const renamed = reduce(added, { type: 'part-changed', partId: relay.id, changes: { label: 'Relay wand' } });
    expect(renamed.model.components.find((component) => component.id === relay.id)?.label).toBe('Relay wand');

    const connected = otherPartOf(freshState().model);
    const removed = reduce(renamed, { type: 'part-removed', partId: connected.id });
    expect(removed.model.components.some((component) => component.id === connected.id)).toBe(false);
    expect(removed.model.links.some((link) => link.fromComponentId === connected.id || link.toComponentId === connected.id)).toBe(false);
    expect(removed.model.links.length).toBeLessThan(renamed.model.links.length);
  });

  it('adds, changes and removes a connection', () => {
    const base = freshState();
    const [first, second] = base.model.components;
    const added = reduce(base, {
      type: 'connection-added',
      connection: { fromComponentId: first.id, toComponentId: second.id, medium: 'nfc', carriesNeuralData: false, carriesStimulationCommands: false, carriesSoftwareUpdates: true },
    });
    const connection = added.model.links[added.model.links.length - 1];
    const changed = reduce(added, { type: 'connection-changed', connectionId: connection.id, changes: { medium: 'usb' } });
    expect(changed.model.links.find((link) => link.id === connection.id)?.medium).toBe('usb');
    expect(reduce(changed, { type: 'connection-removed', connectionId: connection.id }).model.links).toEqual(base.model.links);
  });

  it('refuses an invalid edit with the guard\'s message, keeps the model, and clears the message at the next good edit', () => {
    const base = freshState();
    const tissuePart = base.model.components.find((component) => component.isNeuralInterface)!;
    const refused = reduce(base, { type: 'part-removed', partId: tissuePart.id });
    expect(refused.model).toBe(base.model);
    expect(refused.archetypeId).toBe(stimulator.id);
    expect(refused.editProblem).toBe('exactly one component must be marked as the neural interface');

    const noRegion = reduce(base, { type: 'device-facts-changed', changes: { targetRegionIds: [] }, knownRegionIds: regionIds });
    expect(noRegion.model).toBe(base.model);
    expect(noRegion.editProblem).toBe('targetRegionIds must list at least one region');

    const recovered = reduce(refused, { type: 'device-facts-changed', changes: { name: 'Ours' }, knownRegionIds: regionIds });
    expect(recovered.editProblem).toBeNull();
  });

  it('keeps every recorded decision, under the same risk id, through edits of every kind', () => {
    const base = reduce(freshState(), { type: 'risk-decided', riskId: RISK_ID, status: 'accepted', note: 'Reviewed.' });
    const part = otherPartOf(base.model);
    const edited = reduce(
      base,
      { type: 'device-facts-changed', changes: { name: 'Ours', presentsStimuli: true }, knownRegionIds: regionIds },
      { type: 'part-changed', partId: 'implant', changes: { label: 'Pulse generator' } },
      { type: 'part-added', part: { label: 'Relay', kind: 'wearable_processor', trustZone: 'on_body', isSharedAcrossPatients: false } },
      { type: 'part-removed', partId: part.id },
    );
    expect(edited.model.riskDecisions).toEqual([{ riskId: RISK_ID, status: 'accepted', note: 'Reviewed.' }]);
    expect(edited.model.components.find((component) => component.label === 'Pulse generator')?.id).toBe('implant');
  });

  it('edits a model read from a file exactly like any other', () => {
    const loaded = loadedState();
    expect(loaded.archetypeId).toBeNull();
    const part = otherPartOf(loaded.model);
    const edited = reduce(
      loaded,
      { type: 'part-changed', partId: part.id, changes: { label: 'Relay wand' } },
      { type: 'device-facts-changed', changes: { direction: 'bidirectional' }, knownRegionIds: regionIds },
    );
    expect(edited.editProblem).toBeNull();
    expect(edited.model.components.find((component) => component.id === part.id)?.label).toBe('Relay wand');
    // Import, edit, export, parse: the edited model is still a valid file.
    expect(parseDeviceModelText(JSON.stringify(edited.model), regionIds)).toEqual(edited.model);
  });

  it('starts blank as a new device: one tissue-contact part, no connection, no decision, no preset', () => {
    const decided = reduce(freshState(), { type: 'risk-decided', riskId: RISK_ID, status: 'accepted', note: '' });
    const blank = reduce(decided, { type: 'blank-started' });
    expect(blank.archetypeId).toBeNull();
    expect(blank.model.name).toBe(BLANK_DEVICE_NAME);
    expect(blank.model.components).toHaveLength(1);
    expect(blank.model.components[0].isNeuralInterface).toBe(true);
    expect(blank.model.links).toEqual([]);
    expect(blank.model.riskDecisions).toEqual([]);
  });

  it('replaces the whole state on restore', () => {
    const saved = freshState();
    const other = createInitialState(archetypes[0], registrarVersion);
    expect(studioReducer(other, { type: 'state-restored', state: saved })).toBe(saved);
  });
});

describe('hasUserWork', () => {
  it('is false for an untouched preset and for an untouched blank start', () => {
    expect(hasUserWork(freshState(), archetypes)).toBe(false);
    expect(hasUserWork(reduce(freshState(), { type: 'blank-started' }), archetypes)).toBe(false);
  });

  it('is true once a risk is decided, the device is edited, or a blank start gains a part', () => {
    const decided = reduce(freshState(), { type: 'risk-decided', riskId: RISK_ID, status: 'mitigated', note: '' });
    const renamed = reduce(freshState(), { type: 'device-facts-changed', changes: { name: 'Our stimulator' }, knownRegionIds: regionIds });
    const built = reduce(freshState(), { type: 'blank-started' }, { type: 'part-added', part: { label: 'App', kind: 'patient_app', trustZone: 'patient_controlled', isSharedAcrossPatients: false } });
    expect(hasUserWork(decided, archetypes)).toBe(true);
    expect(hasUserWork(renamed, archetypes)).toBe(true);
    expect(hasUserWork(built, archetypes)).toBe(true);
  });

  it('is true for a model read from a file', () => {
    expect(hasUserWork(loadedState(), archetypes)).toBe(true);
  });

  it('does not believe a preset name on a model that is not that preset', () => {
    const edited = reduce(freshState(), { type: 'device-facts-changed', changes: { name: 'Ours' }, knownRegionIds: regionIds });
    expect(hasUserWork({ ...edited, archetypeId: stimulator.id }, archetypes)).toBe(true);
    expect(isUntouchedPreset(edited.model, stimulator)).toBe(false);
  });
});

describe('saved device', () => {
  it('restores the same state it saved, including decisions, edits and removed parts', () => {
    const base = freshState();
    const edited = reduce(
      base,
      { type: 'device-facts-changed', changes: { name: 'Our stimulator' }, knownRegionIds: regionIds },
      { type: 'part-removed', partId: 'cloud' },
      { type: 'risk-decided', riskId: RISK_ID, status: 'accepted', note: 'Reviewed.' },
    );
    expect(edited.model.components.some((component) => component.id === 'cloud')).toBe(false);
    expect(parseSavedState(serialiseState(edited), archetypes, regionIds)).toEqual(edited);
  });

  it('restores an untouched preset as that preset, with or without decisions on it', () => {
    const decided = reduce(freshState(), { type: 'risk-decided', riskId: RISK_ID, status: 'accepted', note: '' });
    expect(parseSavedState(serialiseState(freshState()), archetypes, regionIds)).toEqual(freshState());
    expect(parseSavedState(serialiseState(decided), archetypes, regionIds).archetypeId).toBe(stimulator.id);
  });

  it('keeps a model whose preset no longer exists, or no longer matches, as a plain model', () => {
    const retired = parseSavedState(serialiseState({ ...freshState(), archetypeId: 'retired-preset' }), archetypes, regionIds);
    expect(retired.archetypeId).toBeNull();
    expect(retired.model).toEqual(freshState().model);
    const mislabelled = parseSavedState(serialiseState({ ...freshState(), archetypeId: archetypes[0].id }), archetypes, regionIds);
    expect(mislabelled.archetypeId).toBeNull();
  });

  it('does not write the refusal message to storage', () => {
    const refused = reduce(freshState(), { type: 'part-removed', partId: 'implant' });
    expect(refused.editProblem).not.toBeNull();
    expect(serialiseState(refused)).not.toContain('editProblem');
  });

  it('rejects saved text that is not JSON, not an object, or holds a tampered model', () => {
    expect(() => parseSavedState('not json', archetypes, regionIds)).toThrow(DeviceModelFormatError);
    expect(() => parseSavedState('[]', archetypes, regionIds)).toThrow(DeviceModelFormatError);
    const tampered = JSON.parse(serialiseState(freshState())) as { model: Record<string, unknown> };
    tampered.model.isAdmin = true;
    expect(() => parseSavedState(JSON.stringify(tampered), archetypes, regionIds)).toThrow(DeviceModelFormatError);
  });
});
