/**
 * Structural checks for components and links. Used for both imported model files
 * and bundled archetypes, so each function returns a problem description and lets
 * the caller raise its own error type.
 */

import {
  COMPONENT_KINDS, LINK_MEDIA, MODEL_LIMITS, TRUST_ZONES,
  type ModelComponent, type ModelLink,
} from './device-model';
import { findDuplicate, findUnexpectedKey, isBoundedString, isOneOf, isRecord } from './guards';

const COMPONENT_KEYS = ['id', 'kind', 'label', 'trustZone', 'isSharedAcrossPatients', 'isNeuralInterface'] as const;
const LINK_KEYS = [
  'id', 'fromComponentId', 'toComponentId', 'medium',
  'carriesNeuralData', 'carriesStimulationCommands', 'carriesSoftwareUpdates',
] as const;

/** Ids are used as map keys and in risk ids, so they are restricted to a safe alphabet. */
const ELEMENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function isElementId(value: unknown): value is string {
  return isBoundedString(value, MODEL_LIMITS.maxIdLength) && ELEMENT_ID_PATTERN.test(value);
}

export function findComponentProblem(value: unknown, index: number): string | null {
  const where = `components[${index}]`;
  if (!isRecord(value)) return `${where} must be an object`;
  if (findUnexpectedKey(value, COMPONENT_KEYS) !== null) return `${where} has an unexpected field`;
  if (!isElementId(value.id)) return `${where}.id must be lowercase letters, digits, and hyphens`;
  if (!isOneOf(value.kind, COMPONENT_KINDS)) return `${where}.kind is not a known component kind`;
  if (!isBoundedString(value.label, MODEL_LIMITS.maxLabelLength)) return `${where}.label must be 1 to ${MODEL_LIMITS.maxLabelLength} characters`;
  if (!isOneOf(value.trustZone, TRUST_ZONES)) return `${where}.trustZone is not a known trust zone`;
  if (typeof value.isSharedAcrossPatients !== 'boolean') return `${where}.isSharedAcrossPatients must be true or false`;
  if (typeof value.isNeuralInterface !== 'boolean') return `${where}.isNeuralInterface must be true or false`;
  return null;
}

export function findLinkProblem(value: unknown, index: number, componentIds: ReadonlySet<string>): string | null {
  const where = `links[${index}]`;
  if (!isRecord(value)) return `${where} must be an object`;
  if (findUnexpectedKey(value, LINK_KEYS) !== null) return `${where} has an unexpected field`;
  if (!isElementId(value.id)) return `${where}.id must be lowercase letters, digits, and hyphens`;
  if (typeof value.fromComponentId !== 'string' || !componentIds.has(value.fromComponentId)) return `${where}.fromComponentId does not name a component`;
  if (typeof value.toComponentId !== 'string' || !componentIds.has(value.toComponentId)) return `${where}.toComponentId does not name a component`;
  if (value.fromComponentId === value.toComponentId) return `${where} connects a component to itself`;
  if (!isOneOf(value.medium, LINK_MEDIA)) return `${where}.medium is not a known link type`;
  const hasBooleanFlags = typeof value.carriesNeuralData === 'boolean'
    && typeof value.carriesStimulationCommands === 'boolean'
    && typeof value.carriesSoftwareUpdates === 'boolean';
  return hasBooleanFlags ? null : `${where} must state true or false for each "carries" field`;
}

function findComponentListProblem(components: unknown): string | null {
  if (!Array.isArray(components) || components.length === 0) return 'components must be a non-empty list';
  if (components.length > MODEL_LIMITS.maxComponents) return `at most ${MODEL_LIMITS.maxComponents} components are supported`;
  for (const [index, component] of components.entries()) {
    const problem = findComponentProblem(component, index);
    if (problem !== null) return problem;
  }
  const validComponents = components as ModelComponent[];
  if (validComponents.filter((component) => component.isNeuralInterface).length !== 1) {
    return 'exactly one component must be marked as the neural interface';
  }
  return null;
}

function findLinkListProblem(links: unknown, componentIds: ReadonlySet<string>): string | null {
  if (!Array.isArray(links)) return 'links must be a list';
  if (links.length > MODEL_LIMITS.maxLinks) return `at most ${MODEL_LIMITS.maxLinks} links are supported`;
  for (const [index, link] of links.entries()) {
    const problem = findLinkProblem(link, index, componentIds);
    if (problem !== null) return problem;
  }
  return null;
}

/** Validates the component and link lists together, including cross-references and id uniqueness. */
export function findStructureProblem(components: unknown, links: unknown): string | null {
  const componentProblem = findComponentListProblem(components);
  if (componentProblem !== null) return componentProblem;
  const validComponents = components as ModelComponent[];
  const componentIds = new Set(validComponents.map((component) => component.id));

  const linkProblem = findLinkListProblem(links, componentIds);
  if (linkProblem !== null) return linkProblem;
  const validLinks = links as ModelLink[];

  const duplicateId = findDuplicate([...validComponents.map((component) => component.id), ...validLinks.map((link) => link.id)]);
  return duplicateId === null ? null : `the id "${duplicateId}" is used more than once`;
}
