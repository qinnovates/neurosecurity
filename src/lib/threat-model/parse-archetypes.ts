import { DEVICE_CATEGORIES, INTERFACE_DIRECTIONS, INVASIVENESS_LEVELS, MODEL_LIMITS } from './device-model';
import { ThreatModelDataError } from './errors';
import { findDuplicate, isBoundedString, isOneOf, isRecord, isStringArray } from './guards';
import { findStructureProblem, isElementId } from './model-guards';
import type { DeviceArchetype } from './reference-data-types';

const DATA_FILE = 'datalake/threat-model/archetypes.json';
const MAX_DESCRIPTION_LENGTH = 300;

function findArchetypeProblem(value: unknown, knownRegionIds: ReadonlySet<string>): string | null {
  if (!isRecord(value)) return 'must be an object';
  if (!isElementId(value.id)) return 'needs an id of lowercase letters, digits, and hyphens';
  if (!isBoundedString(value.label, MODEL_LIMITS.maxLabelLength)) return 'needs a label';
  if (!isBoundedString(value.description, MAX_DESCRIPTION_LENGTH)) return 'needs a description';
  if (!isOneOf(value.deviceCategory, DEVICE_CATEGORIES)) return 'has an unknown deviceCategory';
  if (!isOneOf(value.invasiveness, INVASIVENESS_LEVELS)) return 'has an unknown invasiveness';
  if (!isOneOf(value.direction, INTERFACE_DIRECTIONS)) return 'has an unknown direction';
  if (typeof value.presentsStimuli !== 'boolean') return 'must state presentsStimuli as true or false';
  if (!isStringArray(value.defaultRegionIds) || value.defaultRegionIds.length === 0) return 'needs at least one default region';
  const unknownRegion = value.defaultRegionIds.find((regionId) => !knownRegionIds.has(regionId));
  if (unknownRegion !== undefined) return `names region "${unknownRegion}", which is not in the brain atlas`;
  return findStructureProblem(value.components, value.links);
}

/**
 * @param raw the parsed contents of archetypes.json
 * @param knownRegionIds region ids from the brain atlas
 */
export function parseArchetypes(raw: unknown, knownRegionIds: ReadonlySet<string>): DeviceArchetype[] {
  if (!isRecord(raw) || !Array.isArray(raw.archetypes) || raw.archetypes.length === 0) {
    throw new ThreatModelDataError(DATA_FILE, 'the top level must be an object with a non-empty "archetypes" list');
  }
  for (const [index, archetype] of raw.archetypes.entries()) {
    const problem = findArchetypeProblem(archetype, knownRegionIds);
    if (problem !== null) throw new ThreatModelDataError(DATA_FILE, `archetypes[${index}] ${problem}`);
  }
  const archetypes = raw.archetypes as DeviceArchetype[];
  const duplicateId = findDuplicate(archetypes.map((archetype) => archetype.id));
  if (duplicateId !== null) throw new ThreatModelDataError(DATA_FILE, `the archetype id "${duplicateId}" is used more than once`);
  return archetypes;
}
