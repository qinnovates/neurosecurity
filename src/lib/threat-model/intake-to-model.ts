import {
  MODEL_SCHEMA_VERSION,
  type ComponentKind, type DeviceModel, type InterfaceDirection, type Invasiveness,
  type ModelComponent, type ModelLink, type SubmissionType,
} from './device-model';
import type { DeviceArchetype } from './reference-data-types';

export interface IntakeAnswers {
  name: string;
  invasiveness: Invasiveness;
  direction: InterfaceDirection;
  targetRegionIds: string[];
  /** The system shows images or plays sounds to the patient as part of how it works. */
  presentsStimuli: boolean;
  /** Components from the preset that this device does not have. The neural interface cannot be removed. */
  removedComponentIds: string[];
  submissionType: SubmissionType;
}

/** Component kinds a person uses to send commands to, or read data from, the neural interface. */
const OPERATOR_KINDS: readonly ComponentKind[] = ['clinician_programmer', 'patient_app', 'wearable_processor'];

export function defaultAnswersFor(archetype: DeviceArchetype): IntakeAnswers {
  return {
    name: archetype.label,
    invasiveness: archetype.invasiveness,
    direction: archetype.direction,
    targetRegionIds: [...archetype.defaultRegionIds],
    presentsStimuli: archetype.presentsStimuli,
    removedComponentIds: [],
    // Nothing is assumed about the regulatory route; the checklist stays unevaluated until one is chosen.
    submissionType: 'none',
  };
}

function keepComponents(archetype: DeviceArchetype, removedIds: readonly string[]): ModelComponent[] {
  return archetype.components
    .filter((component) => component.isNeuralInterface || !removedIds.includes(component.id))
    .map((component) => ({ ...component }));
}

function linksOperatorToInterface(link: ModelLink, componentById: ReadonlyMap<string, ModelComponent>): boolean {
  const from = componentById.get(link.fromComponentId);
  const to = componentById.get(link.toComponentId);
  if (from === undefined || to === undefined) return false;
  const [neuralInterface, other] = from.isNeuralInterface ? [from, to] : [to, from];
  return neuralInterface.isNeuralInterface && OPERATOR_KINDS.includes(other.kind);
}

/**
 * Makes link payloads agree with the read/write answer when a preset is turned into a model,
 * so a read-only preset never carries stimulation commands and a write-only preset never
 * carries recordings. Later edits are not rewritten; a disagreement shows as a warning.
 */
function alignLinkWithDirection(link: ModelLink, direction: InterfaceDirection, isOperatorLink: boolean): ModelLink {
  const canWrite = direction !== 'read';
  const canRead = direction !== 'write';
  return {
    ...link,
    carriesStimulationCommands: canWrite && (link.carriesStimulationCommands || isOperatorLink),
    carriesNeuralData: canRead && (link.carriesNeuralData || isOperatorLink),
  };
}

/**
 * @param registrarVersion catalog version the model is evaluated against
 */
export function buildModelFromIntake(answers: IntakeAnswers, archetype: DeviceArchetype, registrarVersion: string): DeviceModel {
  const components = keepComponents(archetype, answers.removedComponentIds);
  const componentById = new Map(components.map((component) => [component.id, component]));
  const links = archetype.links
    .filter((link) => componentById.has(link.fromComponentId) && componentById.has(link.toComponentId))
    .map((link) => alignLinkWithDirection(link, answers.direction, linksOperatorToInterface(link, componentById)));

  return {
    schemaVersion: MODEL_SCHEMA_VERSION,
    registrarVersion,
    name: answers.name,
    deviceCategory: archetype.deviceCategory,
    invasiveness: answers.invasiveness,
    direction: answers.direction,
    targetRegionIds: [...answers.targetRegionIds],
    presentsStimuli: answers.presentsStimuli,
    components,
    links,
    submissionType: answers.submissionType,
    patientState: null,
    riskDecisions: [],
    controlsInPlace: [],
  };
}

/** A device preset as a model of its own. From here on it is edited like any other model. */
export function modelFromArchetype(archetype: DeviceArchetype, registrarVersion: string): DeviceModel {
  return buildModelFromIntake(defaultAnswersFor(archetype), archetype, registrarVersion);
}
