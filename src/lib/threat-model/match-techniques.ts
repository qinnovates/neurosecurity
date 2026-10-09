/**
 * Places catalog techniques on the elements of a device model, using the authored
 * placement table. Every placement and every exclusion carries a reason, so the
 * output can be traced back to a rule a reviewer can read and dispute.
 */

import type { CatalogTechnique, EngineData } from './catalog-types';
import type { DeviceModel, ModelComponent, ModelLink } from './device-model';
import type { LinkPayload, PlacementRules, TechniquePlacement } from './reference-data-types';
import type { ElementOutcome, MatchReason, TechniqueExclusion, TechniqueMatch } from './report-types';

const CORTICAL_DEPTH_CLASS = 'cortical';

export const PAYLOAD_LABELS: Readonly<Record<LinkPayload, string>> = {
  neuralData: 'neural data',
  stimulationCommands: 'stimulation commands',
  softwareUpdates: 'software updates',
};

interface ElementTally {
  matches: TechniqueMatch[];
  exclusions: MatchReason[];
  excluded: TechniqueExclusion[];
}

export function hasCorticalTarget(model: DeviceModel, data: EngineData): boolean {
  const depthByRegion = new Map(data.regions.map((region) => [region.id, region.depthClass]));
  return model.targetRegionIds.some((regionId) => depthByRegion.get(regionId) === CORTICAL_DEPTH_CLASS);
}

/** Null when the device meets the technique's preconditions; otherwise the reason it does not. */
export function findUnmetPrecondition(placement: TechniquePlacement, model: DeviceModel, isCorticalDevice: boolean): MatchReason | null {
  if (placement.requiresDirection !== null && !placement.requiresDirection.includes(model.direction)) {
    const needed = placement.requiresDirection.includes('write') ? 'stimulate' : 'record';
    return { ruleId: 'precondition.direction', detail: `Needs a device that can ${needed}; this device is ${model.direction}-only.` };
  }
  if (placement.entryPath === 'senses' && !model.presentsStimuli) {
    return { ruleId: 'precondition.stimuli', detail: 'Needs the system to show images or play sounds to the patient; this one does not.' };
  }
  if (placement.requiresCorticalTarget && !isCorticalDevice) {
    return { ruleId: 'precondition.cortical-target', detail: 'Needs a cortical target; none of this device\'s target regions is cortical.' };
  }
  return null;
}

function linkCarries(link: ModelLink, payload: LinkPayload): boolean {
  if (payload === 'neuralData') return link.carriesNeuralData;
  if (payload === 'stimulationCommands') return link.carriesStimulationCommands;
  return link.carriesSoftwareUpdates;
}

export function placeOnComponent(component: ModelComponent, placement: TechniquePlacement): MatchReason | null {
  if (placement.onNeuralInterface && component.isNeuralInterface) {
    return { ruleId: 'placement.neural-interface', detail: placement.basis };
  }
  return placement.componentKinds.includes(component.kind)
    ? { ruleId: 'placement.component-kind', detail: placement.basis }
    : null;
}

export function placeOnLink(link: ModelLink, placement: TechniquePlacement): MatchReason | null {
  const carriedPayload = placement.onLinksCarrying.find((payload) => linkCarries(link, payload));
  if (carriedPayload !== undefined) {
    return { ruleId: 'placement.link-payload', detail: `${placement.basis} This link carries ${PAYLOAD_LABELS[carriedPayload]}.` };
  }
  return placement.linkMedia.includes(link.medium)
    ? { ruleId: 'placement.link-medium', detail: `${placement.basis} This link is ${link.medium.replaceAll('_', ' ')}.` }
    : null;
}

function dedupeReasons(reasons: readonly MatchReason[]): MatchReason[] {
  const byKey = new Map(reasons.map((reason) => [`${reason.ruleId}|${reason.detail}`, reason]));
  return [...byKey.values()];
}

function summariseElement(elementId: string, tally: ElementTally, elementKindLabel: string): ElementOutcome {
  const { excluded } = tally;
  if (tally.matches.length > 0) return { elementId, kind: 'matched', matches: tally.matches, excluded };
  if (tally.exclusions.length > 0) return { elementId, kind: 'not_applicable', exclusions: dedupeReasons(tally.exclusions), excluded };
  return { elementId, kind: 'not_modelled', detail: `No placement decision covers ${elementKindLabel}.`, excluded };
}

function record(tally: ElementTally, technique: CatalogTechnique, elementId: string, placed: MatchReason | null, unmet: MatchReason | null): void {
  if (placed === null) return;
  if (unmet === null) {
    tally.matches.push({ techniqueId: technique.id, elementId, reasons: [placed] });
  } else {
    tally.exclusions.push({ ruleId: unmet.ruleId, detail: `${technique.name}: ${unmet.detail}` });
    tally.excluded.push({ techniqueId: technique.id, elementId, reason: unmet });
  }
}

/**
 * Returns one outcome per component and per link, in model order.
 * Pure: the same model and data always give the same result.
 */
export function matchTechniques(model: DeviceModel, data: EngineData, rules: PlacementRules): ElementOutcome[] {
  const isCorticalDevice = hasCorticalTarget(model, data);
  const componentTallies = model.components.map((): ElementTally => ({ matches: [], exclusions: [], excluded: [] }));
  const linkTallies = model.links.map((): ElementTally => ({ matches: [], exclusions: [], excluded: [] }));

  for (const technique of data.techniques) {
    const placement = rules.placements[technique.id];
    if (placement === undefined) continue;
    const unmet = findUnmetPrecondition(placement, model, isCorticalDevice);
    model.components.forEach((component, index) => {
      record(componentTallies[index], technique, component.id, placeOnComponent(component, placement), unmet);
    });
    model.links.forEach((link, index) => {
      record(linkTallies[index], technique, link.id, placeOnLink(link, placement), unmet);
    });
  }

  return [
    ...model.components.map((component, index) => summariseElement(component.id, componentTallies[index], `components of kind "${component.kind}"`)),
    ...model.links.map((link, index) => summariseElement(link.id, linkTallies[index], `"${link.medium}" links with this payload`)),
  ];
}

/** Every condition that kept a technique off an element it would otherwise be placed on. */
export function collectExclusions(outcomes: readonly ElementOutcome[]): TechniqueExclusion[] {
  return outcomes.flatMap((outcome) => outcome.excluded);
}

export function collectMatches(outcomes: readonly ElementOutcome[]): TechniqueMatch[] {
  return outcomes.flatMap((outcome) => (outcome.kind === 'matched' ? outcome.matches : []));
}
