/**
 * Parsers for the authored mapping files. The placement table is checked against the
 * catalog: every technique with confirmed or demonstrated evidence must have a decision,
 * so an evidenced technique added to the catalog fails the build until someone decides
 * where it belongs.
 */

import { DEFAULT_EVIDENCE_STATUSES, type CatalogTechnique } from './catalog-types';
import { CHAIN_ROLES } from './chain-types';
import { COMPONENT_KINDS, INTERFACE_DIRECTIONS, LINK_MEDIA } from './device-model';
import { ThreatModelDataError } from './errors';
import { isArrayOf, isBoundedString, isOneOf, isRecord } from './guards';
import {
  LINK_PAYLOADS, NOT_PLACED_CATEGORIES, PLACED_ENTRY_PATHS,
  type NotPlacedDecision, type PlacementRules, type PlacementTableInfo, type StrideMap, type TechniquePlacement, type ThreatTheme,
} from './reference-data-types';
import { STRIDE_CATEGORIES } from './report-types';

const PLACEMENT_FILE = 'datalake/threat-model/technique-placement.json';
const STRIDE_MAP_FILE = 'datalake/threat-model/stride-map.json';
const THEMES_FILE = 'datalake/threat-model/threat-themes.json';
const TECHNIQUE_MODES = ['R', 'M', 'D'] as const;
const MAX_REASON_LENGTH = 300;

function isTechniquePlacement(value: unknown): value is TechniquePlacement {
  if (!isRecord(value)) return false;
  const hasValidDirection = value.requiresDirection === null || isArrayOf(value.requiresDirection, INTERFACE_DIRECTIONS);
  return isOneOf(value.entryPath, PLACED_ENTRY_PATHS)
    && typeof value.onNeuralInterface === 'boolean'
    && isArrayOf(value.componentKinds, COMPONENT_KINDS)
    && isArrayOf(value.linkMedia, LINK_MEDIA)
    && isArrayOf(value.onLinksCarrying, LINK_PAYLOADS)
    && hasValidDirection
    && typeof value.requiresCorticalTarget === 'boolean'
    && isOneOf(value.chainRole, CHAIN_ROLES)
    && isBoundedString(value.basis, MAX_REASON_LENGTH);
}

function placesOnSomething(placement: TechniquePlacement): boolean {
  return placement.onNeuralInterface
    || placement.componentKinds.length > 0
    || placement.linkMedia.length > 0
    || placement.onLinksCarrying.length > 0;
}

function isNotPlacedDecision(value: unknown): value is NotPlacedDecision {
  return isRecord(value) && isOneOf(value.category, NOT_PLACED_CATEGORIES) && isBoundedString(value.reason, MAX_REASON_LENGTH);
}

function findPlacementShapeProblem(raw: unknown): string | null {
  if (!isRecord(raw) || !isRecord(raw.placements) || !isRecord(raw.notPlaced)) {
    return 'the top level must be an object with "placements" and "notPlaced" objects';
  }
  const badPlacement = Object.entries(raw.placements).find(([, placement]) => !isTechniquePlacement(placement));
  if (badPlacement !== undefined) return `placements["${badPlacement[0]}"] is malformed`;
  const emptyPlacement = Object.entries(raw.placements as Record<string, TechniquePlacement>).find(([, placement]) => !placesOnSomething(placement));
  if (emptyPlacement !== undefined) return `placements["${emptyPlacement[0]}"] names no component or link to act on`;
  const badDecision = Object.entries(raw.notPlaced).find(([, decision]) => !isNotPlacedDecision(decision));
  return badDecision === undefined ? null : `notPlaced["${badDecision[0]}"] needs a known category and a reason`;
}

function findPlacementCoverageProblem(rules: PlacementRules, techniques: readonly CatalogTechnique[]): string | null {
  const placedIds = Object.keys(rules.placements);
  const notPlacedIds = Object.keys(rules.notPlaced);
  const knownIds = new Set(techniques.map((technique) => technique.id));
  const unknownId = [...placedIds, ...notPlacedIds].find((techniqueId) => !knownIds.has(techniqueId));
  if (unknownId !== undefined) return `"${unknownId}" is not a technique in the catalog`;
  const decidedTwice = placedIds.find((techniqueId) => techniqueId in rules.notPlaced);
  if (decidedTwice !== undefined) return `"${decidedTwice}" is both placed and not placed`;
  const undecided = techniques.find((technique) =>
    (DEFAULT_EVIDENCE_STATUSES as readonly string[]).includes(technique.evidenceStatus)
    && !(technique.id in rules.placements) && !(technique.id in rules.notPlaced));
  return undecided === undefined
    ? null
    : `catalog technique "${undecided.id}" (${undecided.evidenceStatus}) has no placement decision`;
}

/**
 * @param techniques the catalog, used to check ids and to require a decision for every evidenced technique
 */
export function parsePlacementRules(raw: unknown, techniques: readonly CatalogTechnique[]): PlacementRules {
  const shapeProblem = findPlacementShapeProblem(raw);
  if (shapeProblem !== null) throw new ThreatModelDataError(PLACEMENT_FILE, shapeProblem);
  const { placements, notPlaced } = raw as PlacementRules;
  const rules: PlacementRules = { placements, notPlaced };
  const coverageProblem = findPlacementCoverageProblem(rules, techniques);
  if (coverageProblem !== null) throw new ThreatModelDataError(PLACEMENT_FILE, coverageProblem);
  return rules;
}

/**
 * The field a placement record would carry once a person has reviewed it. The placement file
 * defines no such field today; until it does, no placement counts as reviewed.
 */
export const PLACEMENT_REVIEW_FIELD = 'reviewedBy';

function isReviewed(placement: unknown): boolean {
  const review = isRecord(placement) ? placement[PLACEMENT_REVIEW_FIELD] : undefined;
  return typeof review === 'string' && review.trim() !== '';
}

/** The placement file's version and status as written, with counts taken from its records. */
export function readPlacementTableInfo(raw: unknown): PlacementTableInfo {
  if (!isRecord(raw) || !isBoundedString(raw.version, MAX_REASON_LENGTH) || typeof raw.status !== 'string' || raw.status === '') {
    throw new ThreatModelDataError(PLACEMENT_FILE, 'the top level needs a "version" and a "status" string');
  }
  const placements = isRecord(raw.placements) ? Object.values(raw.placements) : [];
  return {
    version: raw.version,
    status: raw.status,
    placementCount: placements.length,
    reviewedPlacementCount: placements.filter(isReviewed).length,
    notPlacedCount: isRecord(raw.notPlaced) ? Object.keys(raw.notPlaced).length : 0,
  };
}

function isStrideRecord(value: unknown, requiredKeys: readonly string[]): boolean {
  return isRecord(value)
    && requiredKeys.every((key) => key in value)
    && Object.values(value).every((categories) => isArrayOf(categories, STRIDE_CATEGORIES));
}

export function parseStrideMap(raw: unknown, knownTacticIds: ReadonlySet<string>): StrideMap {
  const fail = (message: string): never => { throw new ThreatModelDataError(STRIDE_MAP_FILE, message); };
  if (!isRecord(raw)) return fail('the top level must be an object');
  if (!isStrideRecord(raw.strideByComponentKind, COMPONENT_KINDS)) return fail('"strideByComponentKind" must cover every component kind with known STRIDE categories');
  if (!isArrayOf(raw.strideForLink, STRIDE_CATEGORIES)) return fail('"strideForLink" must list known STRIDE categories');
  if (!isStrideRecord(raw.strideByMode, TECHNIQUE_MODES)) return fail('"strideByMode" must cover modes R, M, and D');
  if (!isStrideRecord(raw.strideByTactic, [])) return fail('"strideByTactic" must map tactic ids to known STRIDE categories');
  const unknownTactic = Object.keys(raw.strideByTactic as object).find((tacticId) => !knownTacticIds.has(tacticId));
  if (unknownTactic !== undefined) return fail(`"${unknownTactic}" is not a tactic in the catalog`);
  return raw as unknown as StrideMap;
}

function findThemeProblem(value: unknown, knownTechniqueIds: ReadonlySet<string>): string | null {
  if (!isRecord(value)) return 'must be an object';
  if (!isBoundedString(value.id, MAX_REASON_LENGTH) || !isBoundedString(value.label, MAX_REASON_LENGTH)) return 'needs an id and a label';
  if (!isBoundedString(value.description, MAX_REASON_LENGTH)) return 'needs a description';
  if (!Array.isArray(value.techniqueIds)) return 'needs a techniqueIds list';
  const unknownId = value.techniqueIds.find((techniqueId) => typeof techniqueId !== 'string' || !knownTechniqueIds.has(techniqueId));
  if (unknownId !== undefined) return `names "${String(unknownId)}", which is not a technique in the catalog`;
  const hasValidGap = value.catalogGap === null || isBoundedString(value.catalogGap, MAX_REASON_LENGTH);
  return hasValidGap ? null : 'needs catalogGap as text or null';
}

/** Every technique a theme names must exist in the catalog, so a theme can never cite an invented entry. */
export function parseThreatThemes(raw: unknown, techniques: readonly CatalogTechnique[]): ThreatTheme[] {
  if (!isRecord(raw) || !Array.isArray(raw.themes)) {
    throw new ThreatModelDataError(THEMES_FILE, 'the top level must be an object with a "themes" list');
  }
  const knownTechniqueIds = new Set(techniques.map((technique) => technique.id));
  for (const [index, theme] of raw.themes.entries()) {
    const problem = findThemeProblem(theme, knownTechniqueIds);
    if (problem !== null) throw new ThreatModelDataError(THEMES_FILE, `themes[${index}] ${problem}`);
  }
  return raw.themes as ThreatTheme[];
}
