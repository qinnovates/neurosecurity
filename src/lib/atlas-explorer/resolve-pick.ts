/**
 * What a pick in the 3D view means. The thing picked is always an atlas shape.
 * It selects a region only when exactly one QIF region owns the shape outright;
 * a shape that holds several regions, or holds one only somewhere inside it,
 * selects the shape and lists what it holds.
 */

import type { ExplorerModel } from './explorer-model';

export interface PickedShape {
  structureKey: string;
  /** The atlas's own name for the label, or its id. */
  label: string;
  sourceName: string;
  /** Every QIF region with a record on this shape. */
  regions: Array<{ id: string; name: string }>;
  /** The region the pick selects, or null when the shape is not one region's alone. */
  selectedRegionId: string | null;
}

/** @returns null for a key the index does not hold */
export function resolvePick(model: ExplorerModel, structureKey: string): PickedShape | null {
  const structure = model.structuresByKey.get(structureKey);
  if (structure === undefined) return null;
  const regionOwners = structure.owners.filter((owner) => owner.subject_kind === 'region');
  const regionIds = [...new Set(regionOwners.map((owner) => owner.subject_id))];
  const [onlyOwner] = regionOwners;
  const isOneRegionsOwn = regionIds.length === 1 && onlyOwner.via === 'row' && onlyOwner.extent_match !== 'contained' && onlyOwner.extent_match !== 'none';
  return {
    structureKey,
    label: structure.name ?? structure.label_id,
    sourceName: model.index.sources.find((source) => source.id === structure.atlas)?.name ?? structure.atlas,
    regions: regionIds.map((regionId) => ({ id: regionId, name: model.regionsById.get(regionId)?.name ?? regionId })),
    selectedRegionId: isOneRegionsOwn ? regionIds[0] : null,
  };
}
