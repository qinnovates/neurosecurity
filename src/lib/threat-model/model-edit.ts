/**
 * Edits to a device model. Every function is pure and returns either the edited model or the
 * reason the edit was refused, so no edit can produce a model the file parser would reject.
 * Ids are generated once, when a part or connection is added, and never change afterwards:
 * a decision's risk id embeds the id of the part or connection it was recorded on.
 */

import {
  INTERFACE_DIRECTIONS, INVASIVENESS_LEVELS, MODEL_LIMITS, SUBMISSION_TYPES,
  type DeviceModel, type ModelComponent, type ModelLink,
} from './device-model';
import { findDuplicate, isBoundedString, isOneOf, isStringArray } from './guards';
import { findStructureProblem } from './model-guards';
import { RISK_ID_SEPARATOR } from './risk-register';

/** The answers about the device as a whole that the editor can change. */
export type DeviceFacts = Pick<DeviceModel, 'name' | 'invasiveness' | 'direction' | 'targetRegionIds' | 'presentsStimuli' | 'submissionType'>;
export type PartFields = Omit<ModelComponent, 'id'>;
/** A new part is never the tissue-contact part: that mark is moved with `part-changed`. */
export type NewPartFields = Omit<PartFields, 'isNeuralInterface'>;
export type ConnectionFields = Omit<ModelLink, 'id'>;

export type ModelEdit =
  | { type: 'device-facts-changed'; changes: Partial<DeviceFacts>; knownRegionIds: ReadonlySet<string> }
  | { type: 'part-added'; part: NewPartFields }
  | { type: 'part-changed'; partId: string; changes: Partial<PartFields> }
  | { type: 'part-removed'; partId: string }
  | { type: 'connection-added'; connection: ConnectionFields }
  | { type: 'connection-changed'; connectionId: string; changes: Partial<ConnectionFields> }
  | { type: 'connection-removed'; connectionId: string };

export type ModelEditResult =
  | { isAccepted: true; model: DeviceModel }
  | { isAccepted: false; problem: string };

export const PART_ID_PREFIX = 'part';
export const CONNECTION_ID_PREFIX = 'connection';
export const BLANK_DEVICE_NAME = 'New device';
const UNKNOWN_PART_PROBLEM = 'the part to change is not in the model';
const UNKNOWN_CONNECTION_PROBLEM = 'the connection to change is not in the model';
const NO_TISSUE_CONTACT_PROBLEM = 'the model has no part marked as the neural interface to start from';

function refuse(problem: string): ModelEditResult {
  return { isAccepted: false, problem };
}

/** Ids a recorded decision still points at. A removed part's id stays taken, so its decisions never attach to a new part. */
function listDecidedElementIds(model: DeviceModel): string[] {
  return model.riskDecisions.map((decision) => decision.riskId.split(RISK_ID_SEPARATOR)[0]);
}

/** The first id of the form `prefix-N` that no part, connection or recorded decision uses. */
export function nextElementId(model: DeviceModel, prefix: string): string {
  const takenIds = new Set([
    ...model.components.map((component) => component.id),
    ...model.links.map((link) => link.id),
    ...listDecidedElementIds(model),
  ]);
  let serial = 1;
  while (takenIds.has(`${prefix}-${serial}`)) serial += 1;
  return `${prefix}-${serial}`;
}

function findRegionProblem(regionIds: unknown, knownRegionIds: ReadonlySet<string>): string | null {
  if (!isStringArray(regionIds) || regionIds.length === 0) return 'targetRegionIds must list at least one region';
  if (regionIds.length > MODEL_LIMITS.maxTargetRegions) return `at most ${MODEL_LIMITS.maxTargetRegions} target regions are supported`;
  if (findDuplicate(regionIds) !== null) return 'targetRegionIds lists a region twice';
  return regionIds.every((regionId) => knownRegionIds.has(regionId)) ? null : 'targetRegionIds names a region that is not in the atlas';
}

/** The same checks, in the same words, that the file parser applies to these fields. */
function findFactsProblem(model: DeviceModel, knownRegionIds: ReadonlySet<string>): string | null {
  if (!isBoundedString(model.name, MODEL_LIMITS.maxLabelLength)) return `name must be 1 to ${MODEL_LIMITS.maxLabelLength} characters`;
  if (!isOneOf(model.invasiveness, INVASIVENESS_LEVELS)) return 'invasiveness is not recognised';
  if (!isOneOf(model.direction, INTERFACE_DIRECTIONS)) return 'direction is not recognised';
  if (!isOneOf(model.submissionType, SUBMISSION_TYPES)) return 'submissionType is not recognised';
  if (typeof model.presentsStimuli !== 'boolean') return 'presentsStimuli must be true or false';
  return findRegionProblem(model.targetRegionIds, knownRegionIds);
}

function acceptStructure(candidate: DeviceModel): ModelEditResult {
  const problem = findStructureProblem(candidate.components, candidate.links);
  return problem === null ? { isAccepted: true, model: candidate } : refuse(problem);
}

function changeDeviceFacts(model: DeviceModel, changes: Partial<DeviceFacts>, knownRegionIds: ReadonlySet<string>): ModelEditResult {
  // Only the six answers are read from `changes`, so an edit can never reach the parts, connections or decisions.
  const candidate: DeviceModel = {
    ...model,
    name: changes.name ?? model.name,
    invasiveness: changes.invasiveness ?? model.invasiveness,
    direction: changes.direction ?? model.direction,
    presentsStimuli: changes.presentsStimuli ?? model.presentsStimuli,
    submissionType: changes.submissionType ?? model.submissionType,
    targetRegionIds: Array.isArray(changes.targetRegionIds) ? [...changes.targetRegionIds] : model.targetRegionIds,
  };
  const problem = findFactsProblem(candidate, knownRegionIds);
  return problem === null ? { isAccepted: true, model: candidate } : refuse(problem);
}

function addPart(model: DeviceModel, part: NewPartFields): ModelEditResult {
  const added: ModelComponent = {
    id: nextElementId(model, PART_ID_PREFIX), kind: part.kind, label: part.label, trustZone: part.trustZone,
    isSharedAcrossPatients: part.isSharedAcrossPatients, isNeuralInterface: false,
  };
  return acceptStructure({ ...model, components: [...model.components, added] });
}

/** Marking a part as the tissue-contact part takes the mark from the part that had it, since a model has exactly one. */
function changePart(model: DeviceModel, partId: string, changes: Partial<PartFields>): ModelEditResult {
  if (!model.components.some((component) => component.id === partId)) return refuse(UNKNOWN_PART_PROBLEM);
  const isTakingMark = changes.isNeuralInterface === true;
  const components = model.components.map((component): ModelComponent => {
    if (component.id === partId) return { ...component, ...changes, id: component.id };
    return isTakingMark ? { ...component, isNeuralInterface: false } : component;
  });
  return acceptStructure({ ...model, components });
}

/** A connection cannot outlive either of its ends, so the removed part's connections go with it. */
function removePart(model: DeviceModel, partId: string): ModelEditResult {
  if (!model.components.some((component) => component.id === partId)) return refuse(UNKNOWN_PART_PROBLEM);
  return acceptStructure({
    ...model,
    components: model.components.filter((component) => component.id !== partId),
    links: model.links.filter((link) => link.fromComponentId !== partId && link.toComponentId !== partId),
  });
}

function addConnection(model: DeviceModel, connection: ConnectionFields): ModelEditResult {
  const added: ModelLink = {
    id: nextElementId(model, CONNECTION_ID_PREFIX),
    fromComponentId: connection.fromComponentId, toComponentId: connection.toComponentId, medium: connection.medium,
    carriesNeuralData: connection.carriesNeuralData, carriesStimulationCommands: connection.carriesStimulationCommands,
    carriesSoftwareUpdates: connection.carriesSoftwareUpdates,
  };
  return acceptStructure({ ...model, links: [...model.links, added] });
}

function changeConnection(model: DeviceModel, connectionId: string, changes: Partial<ConnectionFields>): ModelEditResult {
  if (!model.links.some((link) => link.id === connectionId)) return refuse(UNKNOWN_CONNECTION_PROBLEM);
  const links = model.links.map((link): ModelLink => (link.id === connectionId ? { ...link, ...changes, id: link.id } : link));
  return acceptStructure({ ...model, links });
}

function removeConnection(model: DeviceModel, connectionId: string): ModelEditResult {
  if (!model.links.some((link) => link.id === connectionId)) return refuse(UNKNOWN_CONNECTION_PROBLEM);
  return acceptStructure({ ...model, links: model.links.filter((link) => link.id !== connectionId) });
}

/** Applies one edit. Recorded decisions are never touched, so each keeps its risk id. */
export function applyModelEdit(model: DeviceModel, edit: ModelEdit): ModelEditResult {
  switch (edit.type) {
    case 'device-facts-changed': return changeDeviceFacts(model, edit.changes, edit.knownRegionIds);
    case 'part-added': return addPart(model, edit.part);
    case 'part-changed': return changePart(model, edit.partId, edit.changes);
    case 'part-removed': return removePart(model, edit.partId);
    case 'connection-added': return addConnection(model, edit.connection);
    case 'connection-changed': return changeConnection(model, edit.connectionId, edit.changes);
    case 'connection-removed': return removeConnection(model, edit.connectionId);
  }
}

/**
 * A device to describe from nothing. A model must always have one tissue-contact part and one
 * target region, so the base model's tissue-contact part and device answers are kept as the
 * starting values; every other part, every connection and every decision is dropped.
 */
export function startBlankModel(base: DeviceModel): ModelEditResult {
  const tissueContactPart = base.components.find((component) => component.isNeuralInterface);
  if (tissueContactPart === undefined) return refuse(NO_TISSUE_CONTACT_PROBLEM);
  return acceptStructure({
    ...base,
    name: BLANK_DEVICE_NAME,
    // Nothing is assumed about the regulatory route.
    submissionType: 'none',
    components: [{ ...tissueContactPart }],
    links: [],
    riskDecisions: [],
    controlsInPlace: [],
  });
}
