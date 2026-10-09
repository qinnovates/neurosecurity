/**
 * The scope of a device's threat model, stated with reasons: every catalog technique under
 * exactly one of the Lab's four terms. Nothing is inferred here. A reason is either stored in
 * the placement table or is a condition the engine evaluates against the device model.
 */

import type { CatalogTechnique, EngineData } from './catalog-types';
import type { DeviceModel } from './device-model';
import { NOT_ASSESSED_REASON, type ScopeTerm } from './lab-terms';
import { PAYLOAD_LABELS, findUnmetPreconditions, hasCorticalTarget, placeOnComponent, placeOnLink } from './match-techniques';
import type { PlacementRules, ReferenceData, TechniquePlacement } from './reference-data-types';

export const NO_MATCHING_ELEMENT_RULE = 'placement.no-matching-element';

/** One condition the engine evaluated and the device did not meet. */
export interface ScopeCondition {
  ruleId: string;
  /** The unmet condition, in the engine's words. */
  detail: string;
  /** The state of the device model that would meet it. */
  restoringAnswer: string;
}

export interface ScopeEntry {
  techniqueId: string;
  name: string;
  term: ScopeTerm;
  /** Applies: the placement's rationale. Would apply if: the unmet conditions. Reviewed, outside: the stored reason. Not assessed: that no decision is recorded. */
  reason: string;
  /** Set only under "would apply if"; never empty there. */
  conditions: ScopeCondition[];
  /** Parts and connections the technique is placed on; set only under "applies". */
  elementIds: string[];
}

export interface ScopeStatement {
  applies: ScopeEntry[];
  wouldApplyIf: ScopeEntry[];
  reviewedOutside: ScopeEntry[];
  notAssessed: ScopeEntry[];
  /** The catalog's size. The four lists always sum to it. */
  total: number;
}

export const SCOPE_LIST_BY_TERM: Readonly<Record<ScopeTerm, keyof Omit<ScopeStatement, 'total'>>> = {
  applies: 'applies',
  would_apply_if: 'wouldApplyIf',
  reviewed_outside: 'reviewedOutside',
  not_assessed: 'notAssessed',
};

function spaced(code: string): string {
  return code.replaceAll('_', ' ');
}

const RESTORING_ANSWER_BY_RULE: Readonly<Record<string, (placement: TechniquePlacement) => string>> = {
  'precondition.direction': (placement) => `The device can ${placement.requiresDirection?.includes('write') === true ? 'stimulate' : 'record'}.`,
  'precondition.stimuli': () => 'The system shows images or plays sounds to the patient.',
  'precondition.cortical-target': () => 'At least one of the device\'s target regions is cortical.',
};

/** What the placement acts on, read from its own fields. */
function describeNeededElements(placement: TechniquePlacement): string {
  return [
    ...(placement.onNeuralInterface ? ['the neural interface'] : []),
    ...placement.componentKinds.map((kind) => `a part of kind ${spaced(kind)}`),
    ...placement.linkMedia.map((medium) => `a connection over ${spaced(medium)}`),
    ...placement.onLinksCarrying.map((payload) => `a connection carrying ${PAYLOAD_LABELS[payload]}`),
  ].join(', or ');
}

function listPlacedElementIds(placement: TechniquePlacement, model: DeviceModel): string[] {
  return [
    ...model.components.filter((component) => placeOnComponent(component, placement) !== null).map((component) => component.id),
    ...model.links.filter((link) => placeOnLink(link, placement) !== null).map((link) => link.id),
  ];
}

function listUnmetConditions(placement: TechniquePlacement, model: DeviceModel, isCorticalDevice: boolean, hasElement: boolean): ScopeCondition[] {
  const conditions: ScopeCondition[] = findUnmetPreconditions(placement, model, isCorticalDevice)
    .map((unmet) => ({ ...unmet, restoringAnswer: RESTORING_ANSWER_BY_RULE[unmet.ruleId]?.(placement) ?? unmet.detail }));
  if (!hasElement) {
    const needed = describeNeededElements(placement);
    conditions.push({ ruleId: NO_MATCHING_ELEMENT_RULE, detail: `Needs ${needed}; this device has none.`, restoringAnswer: `The device has ${needed}.` });
  }
  return conditions;
}

function toPlacedEntry(technique: CatalogTechnique, placement: TechniquePlacement, model: DeviceModel, isCorticalDevice: boolean): ScopeEntry {
  const elementIds = listPlacedElementIds(placement, model);
  const conditions = listUnmetConditions(placement, model, isCorticalDevice, elementIds.length > 0);
  const identity = { techniqueId: technique.id, name: technique.name };
  if (conditions.length === 0) return { ...identity, term: 'applies', reason: placement.basis, conditions, elementIds };
  return { ...identity, term: 'would_apply_if', reason: conditions.map((condition) => condition.detail).join(' '), conditions, elementIds: [] };
}

function toScopeEntry(technique: CatalogTechnique, rules: PlacementRules, model: DeviceModel, isCorticalDevice: boolean): ScopeEntry {
  const placement = rules.placements[technique.id];
  if (placement !== undefined) return toPlacedEntry(technique, placement, model, isCorticalDevice);
  const decision = rules.notPlaced[technique.id];
  const identity = { techniqueId: technique.id, name: technique.name, conditions: [], elementIds: [] };
  return decision === undefined
    ? { ...identity, term: 'not_assessed', reason: NOT_ASSESSED_REASON }
    : { ...identity, term: 'reviewed_outside', reason: decision.reason };
}

/** Every catalog technique under exactly one term, in catalog order within each list. */
export function summariseScope(model: DeviceModel, data: EngineData, referenceData: Pick<ReferenceData, 'placementRules'>): ScopeStatement {
  const isCorticalDevice = hasCorticalTarget(model, data);
  const statement: ScopeStatement = { applies: [], wouldApplyIf: [], reviewedOutside: [], notAssessed: [], total: data.techniques.length };
  for (const technique of data.techniques) {
    const entry = toScopeEntry(technique, referenceData.placementRules, model, isCorticalDevice);
    statement[SCOPE_LIST_BY_TERM[entry.term]].push(entry);
  }
  return statement;
}

export function listScopeEntries(statement: ScopeStatement): ScopeEntry[] {
  return [...statement.applies, ...statement.wouldApplyIf, ...statement.reviewedOutside, ...statement.notAssessed];
}

/** The term of each technique, for lookups by id. */
export function indexScopeTerms(statement: ScopeStatement): Map<string, ScopeTerm> {
  return new Map(listScopeEntries(statement).map((entry) => [entry.techniqueId, entry.term]));
}

export interface ScopeChange {
  techniqueId: string;
  name: string;
  /** `arrived`: applies now and did not before. `left`: applied before and does not now. */
  direction: 'arrived' | 'left';
  from: ScopeTerm;
  to: ScopeTerm;
  /** Arrived: the placement's rationale. Left: the reason it no longer applies. */
  reason: string;
  /** The conditions that changed: the ones now unmet for `left`, the ones that were unmet for `arrived`. */
  conditions: ScopeCondition[];
}

/** Techniques that started or stopped applying between two statements, in the order of `after`. */
export function diffScope(before: ScopeStatement, after: ScopeStatement): ScopeChange[] {
  const beforeById = new Map(listScopeEntries(before).map((entry) => [entry.techniqueId, entry]));
  return listScopeEntries(after).flatMap((entry): ScopeChange[] => {
    const earlier = beforeById.get(entry.techniqueId);
    if (earlier === undefined || (earlier.term === 'applies') === (entry.term === 'applies')) return [];
    const hasArrived = entry.term === 'applies';
    return [{
      techniqueId: entry.techniqueId, name: entry.name, direction: hasArrived ? 'arrived' : 'left',
      from: earlier.term, to: entry.term, reason: entry.reason, conditions: hasArrived ? earlier.conditions : entry.conditions,
    }];
  });
}
