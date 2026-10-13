/**
 * The device-stage rail: the four stages on the device side of the hourglass,
 * each listing the techniques the catalog tags with its band. A technique with
 * several device bands is listed under each. These techniques act on the
 * device, so the rail lights no region.
 */

import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { DEVICE_STAGE_BAND_IDS, type CatalogBand, type DeviceStageTechnique } from './explorer-catalog';
import { isNeuralBand, weakestReviewState, type ExplorerModel } from './explorer-model';

export interface RailTechnique {
  id: string;
  name: string;
  /** The brain bands the technique also carries. Empty for a device-only technique. */
  neuralBandIds: string[];
  /** AI-drafted region links the index holds for it. Zero for a device-only technique. */
  draftedLinkCount: number;
  /** The review state of those links, for the mark beside the count. Null when there are none. */
  reviewState: IndexReviewState | null;
}

export interface RailStage {
  band: CatalogBand;
  techniques: RailTechnique[];
}

export interface DeviceRail {
  stages: RailStage[];
  deviceOnlyCount: number;
  /** Techniques that carry a brain band as well as a device band. */
  mixedCount: number;
}

function toRailTechnique(model: ExplorerModel, technique: DeviceStageTechnique): RailTechnique {
  const links = model.techniquesById.get(technique.id)?.links ?? [];
  return {
    id: technique.id,
    name: technique.name,
    neuralBandIds: technique.band_ids.filter(isNeuralBand),
    draftedLinkCount: links.length,
    reviewState: weakestReviewState(links.map((link) => link.review_state)),
  };
}

/** @param includeMixed also list the techniques that carry a brain band; off, the rail holds device-only techniques */
export function buildDeviceRail(model: ExplorerModel, includeMixed: boolean): DeviceRail {
  const all = model.catalog.device_stage_techniques;
  const isDeviceOnly = (technique: DeviceStageTechnique): boolean => !technique.band_ids.some(isNeuralBand);
  const listed = includeMixed ? all : all.filter(isDeviceOnly);
  const stages = DEVICE_STAGE_BAND_IDS.flatMap((bandId) => {
    const band = model.bandsById.get(bandId);
    if (band === undefined) return [];
    return [{ band, techniques: listed.filter((technique) => technique.band_ids.includes(bandId)).map((technique) => toRailTechnique(model, technique)) }];
  });
  const deviceOnlyCount = all.filter(isDeviceOnly).length;
  return { stages, deviceOnlyCount, mixedCount: all.length - deviceOnlyCount };
}
