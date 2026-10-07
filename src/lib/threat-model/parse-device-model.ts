/**
 * Turns the text of an imported model file into a DeviceModel, or throws
 * DeviceModelFormatError. The file is untrusted: size is checked before parsing,
 * unknown fields are rejected, and every list and string is bounded.
 */

import {
  DEVICE_CATEGORIES, INTERFACE_DIRECTIONS, INVASIVENESS_LEVELS, MODEL_LIMITS, MODEL_SCHEMA_VERSION,
  RISK_STATUSES, SUBMISSION_TYPES,
  type DeviceModel, type RiskDecision,
} from './device-model';
import { DeviceModelFormatError } from './errors';
import { findDuplicate, findUnexpectedKey, isBoundedString, isOneOf, isRecord, isStringArray } from './guards';
import { findStructureProblem } from './model-guards';

const MODEL_KEYS = [
  'schemaVersion', 'registrarVersion', 'name', 'deviceCategory', 'invasiveness', 'direction',
  'targetRegionIds', 'presentsStimuli', 'components', 'links', 'submissionType', 'patientState', 'riskDecisions', 'controlsInPlace',
] as const;
const RISK_DECISION_KEYS = ['riskId', 'status', 'note'] as const;
const US_STATE_PATTERN = /^[A-Z]{2}$/;
const MAX_VERSION_LENGTH = 32;
const MAX_RISK_ID_LENGTH = 160;

function parseJson(text: string): unknown {
  if (text.length > MODEL_LIMITS.maxFileBytes) {
    throw new DeviceModelFormatError(`it is larger than ${MODEL_LIMITS.maxFileBytes / 1_000_000} MB`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    // The parser's own message can echo file content, so it is replaced with a fixed one.
    throw new DeviceModelFormatError('it is not valid JSON');
  }
}

function findHeaderProblem(model: Record<string, unknown>): string | null {
  if (model.schemaVersion !== MODEL_SCHEMA_VERSION) {
    const foundVersion = typeof model.schemaVersion === 'number' ? String(model.schemaVersion) : 'an unrecognised value';
    return `it uses schema version ${foundVersion}, and this tool reads version ${MODEL_SCHEMA_VERSION}`;
  }
  if (!isBoundedString(model.registrarVersion, MAX_VERSION_LENGTH)) return 'registrarVersion is missing';
  if (!isBoundedString(model.name, MODEL_LIMITS.maxLabelLength)) return `name must be 1 to ${MODEL_LIMITS.maxLabelLength} characters`;
  if (!isOneOf(model.deviceCategory, DEVICE_CATEGORIES)) return 'deviceCategory is not recognised';
  if (!isOneOf(model.invasiveness, INVASIVENESS_LEVELS)) return 'invasiveness is not recognised';
  if (!isOneOf(model.direction, INTERFACE_DIRECTIONS)) return 'direction is not recognised';
  if (!isOneOf(model.submissionType, SUBMISSION_TYPES)) return 'submissionType is not recognised';
  if (typeof model.presentsStimuli !== 'boolean') return 'presentsStimuli must be true or false';
  const isValidState = model.patientState === null
    || (typeof model.patientState === 'string' && US_STATE_PATTERN.test(model.patientState));
  return isValidState ? null : 'patientState must be a two-letter state code or null';
}

function findRegionProblem(regionIds: unknown, knownRegionIds: ReadonlySet<string>): string | null {
  if (!isStringArray(regionIds) || regionIds.length === 0) return 'targetRegionIds must list at least one region';
  if (regionIds.length > MODEL_LIMITS.maxTargetRegions) return `at most ${MODEL_LIMITS.maxTargetRegions} target regions are supported`;
  if (findDuplicate(regionIds) !== null) return 'targetRegionIds lists a region twice';
  // The offending value is not echoed back: it is attacker-controlled text.
  return regionIds.every((regionId) => knownRegionIds.has(regionId)) ? null : 'targetRegionIds names a region that is not in the atlas';
}

function findRiskDecisionProblem(decision: unknown, index: number): string | null {
  const where = `riskDecisions[${index}]`;
  if (!isRecord(decision)) return `${where} must be an object`;
  if (findUnexpectedKey(decision, RISK_DECISION_KEYS) !== null) return `${where} has an unexpected field`;
  if (!isBoundedString(decision.riskId, MAX_RISK_ID_LENGTH)) return `${where}.riskId is missing or too long`;
  if (!isOneOf(decision.status, RISK_STATUSES)) return `${where}.status is not recognised`;
  const isValidNote = typeof decision.note === 'string' && decision.note.length <= MODEL_LIMITS.maxNoteLength;
  return isValidNote ? null : `${where}.note must be at most ${MODEL_LIMITS.maxNoteLength} characters`;
}

function findDecisionListProblem(model: Record<string, unknown>): string | null {
  const { riskDecisions, controlsInPlace } = model;
  if (!Array.isArray(riskDecisions) || riskDecisions.length > MODEL_LIMITS.maxRiskDecisions) return 'riskDecisions must be a list within the size limit';
  for (const [index, decision] of riskDecisions.entries()) {
    const problem = findRiskDecisionProblem(decision, index);
    if (problem !== null) return problem;
  }
  if (findDuplicate((riskDecisions as RiskDecision[]).map((decision) => decision.riskId)) !== null) return 'riskDecisions lists a risk twice';
  const areControlsValid = isStringArray(controlsInPlace)
    && controlsInPlace.length <= MODEL_LIMITS.maxControlsInPlace
    && controlsInPlace.every((control) => isBoundedString(control, MODEL_LIMITS.maxNoteLength));
  return areControlsValid ? null : 'controlsInPlace must be a list of short strings within the size limit';
}

/**
 * @param text the raw contents of the imported file
 * @param knownRegionIds region ids from the brain atlas; unknown regions are rejected
 */
export function parseDeviceModelText(text: string, knownRegionIds: ReadonlySet<string>): DeviceModel {
  const parsed = parseJson(text);
  if (!isRecord(parsed)) throw new DeviceModelFormatError('the top level must be an object');
  if (findUnexpectedKey(parsed, MODEL_KEYS) !== null) throw new DeviceModelFormatError('it contains a field this tool does not recognise');

  const problem = findHeaderProblem(parsed)
    ?? findRegionProblem(parsed.targetRegionIds, knownRegionIds)
    ?? findStructureProblem(parsed.components, parsed.links)
    ?? findDecisionListProblem(parsed);
  if (problem !== null) throw new DeviceModelFormatError(problem);

  return parsed as unknown as DeviceModel;
}
