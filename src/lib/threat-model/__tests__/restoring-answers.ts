/**
 * Test-only: makes a restoring answer true of a device model, reading each answer the way a
 * person would act on it. A test then checks the technique applies, so an answer that leaves
 * a condition out is caught.
 */

import type { EngineData } from '../catalog-types';
import type { DeviceModel, ModelComponent, ModelLink } from '../device-model';
import type { LinkPayload, TechniquePlacement } from '../reference-data-types';
import { NO_MATCHING_ELEMENT_RULE, type ScopeCondition } from '../scope-statement';

const CARRIES_FIELD_BY_PAYLOAD: Readonly<Record<LinkPayload, keyof Pick<ModelLink, 'carriesNeuralData' | 'carriesStimulationCommands' | 'carriesSoftwareUpdates'>>> = {
  neuralData: 'carriesNeuralData',
  stimulationCommands: 'carriesStimulationCommands',
  softwareUpdates: 'carriesSoftwareUpdates',
};

/** "The device can record" or "can stimulate": the device gains the ability and keeps the one it has. */
function restoreDirection(model: DeviceModel, answer: string): DeviceModel {
  const needsWrite = answer.includes('stimulate');
  const hasIt = model.direction === 'bidirectional' || model.direction === (needsWrite ? 'write' : 'read');
  return hasIt ? model : { ...model, direction: 'bidirectional' };
}

function restoreCorticalTarget(model: DeviceModel, data: EngineData): DeviceModel {
  const cortical = data.regions.find((region) => region.depthClass === 'cortical');
  if (cortical === undefined) throw new Error('test setup: the atlas has no cortical region');
  return { ...model, targetRegionIds: [...model.targetRegionIds, cortical.id] };
}

/** "The device has A, or B": the first alternative the answer names is added. */
function restoreElement(model: DeviceModel, placement: TechniquePlacement): DeviceModel {
  const [kind] = placement.componentKinds;
  if (kind !== undefined) {
    const part: ModelComponent = { id: 'restored-part', kind, label: 'Restored part', trustZone: 'patient_controlled', isSharedAcrossPatients: false, isNeuralInterface: false };
    return { ...model, components: [...model.components, part] };
  }
  const [first, second] = model.components;
  const link: ModelLink = {
    id: 'restored-connection', fromComponentId: first.id, toComponentId: second.id, medium: placement.linkMedia[0] ?? 'usb',
    carriesNeuralData: false, carriesStimulationCommands: false, carriesSoftwareUpdates: false,
  };
  const [payload] = placement.onLinksCarrying;
  const carrying = placement.linkMedia.length === 0 && payload !== undefined ? { ...link, [CARRIES_FIELD_BY_PAYLOAD[payload]]: true } : link;
  return { ...model, links: [...model.links, carrying] };
}

function applyOne(model: DeviceModel, condition: ScopeCondition, placement: TechniquePlacement, data: EngineData): DeviceModel {
  if (condition.ruleId === 'precondition.direction') return restoreDirection(model, condition.restoringAnswer);
  if (condition.ruleId === 'precondition.stimuli') return { ...model, presentsStimuli: true };
  if (condition.ruleId === 'precondition.cortical-target') return restoreCorticalTarget(model, data);
  if (condition.ruleId === NO_MATCHING_ELEMENT_RULE) return restoreElement(model, placement);
  throw new Error(`test setup: no way to apply the restoring answer for ${condition.ruleId}`);
}

export function applyRestoringAnswers(model: DeviceModel, conditions: readonly ScopeCondition[], placement: TechniquePlacement, data: EngineData): DeviceModel {
  return conditions.reduce((current, condition) => applyOne(current, condition, placement, data), model);
}
