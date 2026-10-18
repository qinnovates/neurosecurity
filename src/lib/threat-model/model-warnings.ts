/**
 * Answers in a device model that do not agree with each other. A warning states the two
 * recorded facts and nothing more; it never blocks an edit and never changes the model.
 */

import type { BrainRegion } from './catalog-types';
import type { DeviceModel } from './device-model';
import { describeLink } from './stride';

export const MODEL_WARNING_KINDS = ['part_without_connection', 'noninvasive_deep_site', 'records_only_stimulation_connection'] as const;
export type ModelWarningKind = typeof MODEL_WARNING_KINDS[number];

export interface ModelWarning {
  kind: ModelWarningKind;
  /** The part, target region or connection the warning is about. */
  subjectId: string;
  message: string;
}

/** Depth classes of the atlas that are not below the cortex. A region the atlas gives no depth for is not warned about. */
const NOT_DEEP_DEPTH_CLASSES: readonly string[] = ['cortical', 'unspecified'];

function findPartsWithoutConnection(model: DeviceModel): ModelWarning[] {
  const connectedIds = new Set(model.links.flatMap((link) => [link.fromComponentId, link.toComponentId]));
  return model.components
    .filter((component) => !connectedIds.has(component.id))
    .map((component): ModelWarning => ({
      kind: 'part_without_connection', subjectId: component.id, message: `"${component.label}" has no connection to another part.`,
    }));
}

function findDeepSitesOnNoninvasiveDevice(model: DeviceModel, regions: readonly BrainRegion[]): ModelWarning[] {
  if (model.invasiveness !== 'noninvasive') return [];
  const regionById = new Map(regions.map((region) => [region.id, region]));
  return model.targetRegionIds.flatMap((regionId): ModelWarning[] => {
    const region = regionById.get(regionId);
    if (region === undefined || NOT_DEEP_DEPTH_CLASSES.includes(region.depthClass)) return [];
    return [{
      kind: 'noninvasive_deep_site', subjectId: region.id,
      message: `The device is recorded as non-invasive, and its target region "${region.name}" is recorded in the atlas as ${region.depthClass}.`,
    }];
  });
}

function findStimulationConnectionsOnRecordingDevice(model: DeviceModel): ModelWarning[] {
  if (model.direction !== 'read') return [];
  return model.links
    .filter((link) => link.carriesStimulationCommands)
    .map((link): ModelWarning => ({
      kind: 'records_only_stimulation_connection', subjectId: link.id,
      message: `The device is recorded as records only, and the connection ${describeLink(model, link.id)} is marked as carrying stimulation commands.`,
    }));
}

/**
 * @param regions the atlas regions, for each target region's name and depth
 */
export function findModelWarnings(model: DeviceModel, regions: readonly BrainRegion[]): ModelWarning[] {
  return [
    ...findPartsWithoutConnection(model),
    ...findDeepSitesOnNoninvasiveDevice(model, regions),
    ...findStimulationConnectionsOnRecordingDevice(model),
  ];
}
