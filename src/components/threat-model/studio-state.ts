/**
 * State for the threat model page. The device model is the single source of truth;
 * the questionnaire answers are kept only so the form can be edited, and are dropped
 * when a model file is imported.
 */

import type { DeviceModel, RiskStatus } from '@/lib/threat-model/device-model';
import { buildModelFromIntake, defaultAnswersFor, type IntakeAnswers } from '@/lib/threat-model/intake-to-model';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';

export interface StudioState {
  /** Null after a model file is imported: the model no longer comes from a preset. */
  archetypeId: string | null;
  answers: IntakeAnswers | null;
  model: DeviceModel;
}

export type StudioAction =
  | { type: 'preset-selected'; archetype: DeviceArchetype; registrarVersion: string }
  | { type: 'answers-changed'; archetype: DeviceArchetype; answers: IntakeAnswers; registrarVersion: string }
  | { type: 'risk-decided'; riskId: string; status: RiskStatus; note: string }
  | { type: 'model-imported'; model: DeviceModel }
  | { type: 'state-restored'; state: StudioState };

export function createInitialState(archetype: DeviceArchetype, registrarVersion: string): StudioState {
  const answers = defaultAnswersFor(archetype);
  return { archetypeId: archetype.id, answers, model: buildModelFromIntake(answers, archetype, registrarVersion) };
}

/** Rebuilds the model from new answers while keeping the decisions the user already recorded. */
function rebuildModel(previous: DeviceModel, answers: IntakeAnswers, archetype: DeviceArchetype, registrarVersion: string): DeviceModel {
  return {
    ...buildModelFromIntake(answers, archetype, registrarVersion),
    riskDecisions: previous.riskDecisions,
    controlsInPlace: previous.controlsInPlace,
  };
}

function decideRisk(model: DeviceModel, riskId: string, status: RiskStatus, note: string): DeviceModel {
  const otherDecisions = model.riskDecisions.filter((decision) => decision.riskId !== riskId);
  const isDefault = status === 'open' && note === '';
  return { ...model, riskDecisions: isDefault ? otherDecisions : [...otherDecisions, { riskId, status, note }] };
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'preset-selected':
      return createInitialState(action.archetype, action.registrarVersion);
    case 'answers-changed':
      return {
        archetypeId: action.archetype.id,
        answers: action.answers,
        model: rebuildModel(state.model, action.answers, action.archetype, action.registrarVersion),
      };
    case 'risk-decided':
      return { ...state, model: decideRisk(state.model, action.riskId, action.status, action.note) };
    case 'model-imported':
      return { archetypeId: null, answers: null, model: action.model };
    case 'state-restored':
      return action.state;
  }
}

/**
 * True when replacing the device would throw away something the user did: recorded
 * decisions, changed answers, or an imported model. A file's older list of controls in place
 * counts too, since it is only kept while the file's model is.
 */
export function hasUserWork(state: StudioState, archetypes: readonly DeviceArchetype[]): boolean {
  const { model, answers, archetypeId } = state;
  if (model.riskDecisions.length > 0 || model.controlsInPlace.length > 0) return true;
  const archetype = archetypes.find((candidate) => candidate.id === archetypeId);
  if (archetype === undefined || answers === null) return true;
  return JSON.stringify(answers) !== JSON.stringify(defaultAnswersFor(archetype));
}
