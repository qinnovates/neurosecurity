/**
 * The brain regions a device model targets, resolved against the atlas. This restates
 * what the user chose at intake; it attaches no technique, score, or finding to a region,
 * because the catalog ties techniques to bands, not to regions.
 */

import type { BrainRegion } from './catalog-types';
import type { DeviceModel } from './device-model';

export interface TargetRegionSummary {
  /** In the order the model lists them. */
  regions: BrainRegion[];
  /** Ids the model names that the atlas does not have. Reported, never dropped silently. */
  unknownRegionIds: string[];
}

export function listTargetRegions(model: DeviceModel, atlasRegions: readonly BrainRegion[]): TargetRegionSummary {
  const regionById = new Map(atlasRegions.map((region) => [region.id, region]));
  const regions: BrainRegion[] = [];
  const unknownRegionIds: string[] = [];
  for (const regionId of new Set(model.targetRegionIds)) {
    const region = regionById.get(regionId);
    if (region === undefined) unknownRegionIds.push(regionId);
    else regions.push(region);
  }
  return { regions, unknownRegionIds };
}

/** True when the element is the component that touches neural tissue or records from it. */
export function isNeuralInterfaceElement(model: DeviceModel, elementId: string | null): boolean {
  return elementId !== null && model.components.some((component) => component.id === elementId && component.isNeuralInterface);
}
