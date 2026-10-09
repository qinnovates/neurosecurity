/**
 * State for the device in focus. The device model is the single source of truth and is the
 * thing every edit acts on, so a preset, a blank start and a model read from a file are all
 * edited the same way. An edit the model guards refuse leaves the model as it was.
 */

import type { DeviceModel, RiskStatus } from '@/lib/threat-model/device-model';
import { isRecord } from '@/lib/threat-model/guards';
import { modelFromArchetype } from '@/lib/threat-model/intake-to-model';
import { applyModelEdit, startBlankModel, type ModelEdit, type ModelEditResult } from '@/lib/threat-model/model-edit';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';

export interface StudioState {
  /** The preset the model still equals. Null once the model is edited, started blank or read from a file. */
  archetypeId: string | null;
  model: DeviceModel;
  /** Why the last edit was refused, in the model guard's words. Null when the last edit was applied. */
  editProblem: string | null;
}

export type StudioAction =
  | { type: 'preset-selected'; archetype: DeviceArchetype; registrarVersion: string }
  | { type: 'blank-started' }
  | ModelEdit
  | { type: 'risk-decided'; riskId: string; status: RiskStatus; note: string }
  | { type: 'model-imported'; model: DeviceModel }
  | { type: 'state-restored'; state: StudioState };

export function createInitialState(archetype: DeviceArchetype, registrarVersion: string): StudioState {
  return { archetypeId: archetype.id, model: modelFromArchetype(archetype, registrarVersion), editProblem: null };
}

/** The model's description of the device, without the decisions recorded on it and whatever the key order. */
function fingerprintDevice(model: DeviceModel): string {
  const device: DeviceModel = { ...model, riskDecisions: [], controlsInPlace: [] };
  return JSON.stringify(device, (_key, value: unknown) => (
    isRecord(value) ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))) : value
  ));
}

/** True when the model still describes exactly the device the preset starts from. */
export function isUntouchedPreset(model: DeviceModel, archetype: DeviceArchetype): boolean {
  return fingerprintDevice(model) === fingerprintDevice(modelFromArchetype(archetype, model.registrarVersion));
}

function isUntouchedBlankStart(model: DeviceModel): boolean {
  const blank = startBlankModel(model);
  return blank.isAccepted && fingerprintDevice(model) === fingerprintDevice(blank.model);
}

function decideRisk(model: DeviceModel, riskId: string, status: RiskStatus, note: string): DeviceModel {
  const otherDecisions = model.riskDecisions.filter((decision) => decision.riskId !== riskId);
  const isDefault = status === 'open' && note === '';
  return { ...model, riskDecisions: isDefault ? otherDecisions : [...otherDecisions, { riskId, status, note }] };
}

/** Takes the edited model, or keeps the model and records why the edit was refused. */
function settleEdit(state: StudioState, result: ModelEditResult): StudioState {
  if (!result.isAccepted) return { ...state, editProblem: result.problem };
  const hasChangedDevice = fingerprintDevice(result.model) !== fingerprintDevice(state.model);
  return { archetypeId: hasChangedDevice ? null : state.archetypeId, model: result.model, editProblem: null };
}

/** A blank start replaces the device, so it is no preset and carries no decisions. */
function startBlank(state: StudioState): StudioState {
  const result = startBlankModel(state.model);
  return result.isAccepted ? { archetypeId: null, model: result.model, editProblem: null } : { ...state, editProblem: result.problem };
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'preset-selected':
      return createInitialState(action.archetype, action.registrarVersion);
    case 'blank-started':
      return startBlank(state);
    case 'device-facts-changed':
    case 'part-added':
    case 'part-changed':
    case 'part-removed':
    case 'connection-added':
    case 'connection-changed':
    case 'connection-removed':
      return settleEdit(state, applyModelEdit(state.model, action));
    case 'risk-decided':
      return { ...state, model: decideRisk(state.model, action.riskId, action.status, action.note) };
    case 'model-imported':
      return { archetypeId: null, model: action.model, editProblem: null };
    case 'state-restored':
      return action.state;
  }
}

/**
 * True when replacing the device would throw away something the user did: recorded decisions,
 * an edit, or a model read from a file. A file's older list of controls in place counts too,
 * since it is only kept while the file's model is.
 */
export function hasUserWork(state: StudioState, archetypes: readonly DeviceArchetype[]): boolean {
  const { model, archetypeId } = state;
  if (model.riskDecisions.length > 0 || model.controlsInPlace.length > 0) return true;
  const archetype = archetypes.find((candidate) => candidate.id === archetypeId);
  return archetype === undefined ? !isUntouchedBlankStart(model) : !isUntouchedPreset(model, archetype);
}
