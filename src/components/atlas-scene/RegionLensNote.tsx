import { createContext } from 'react';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { toColourMode, type Lens } from '@/lib/atlas-explorer/lens-state';
import { limitForRegionUnderLens } from '@/lib/atlas-explorer/limit-selection';
import { describeRegionUnderLens } from '@/lib/atlas-explorer/region-lens';
import LimitNote from './LimitNote';

/** The lens the picture beside the inspector is coloured by. The inspector's own sections read it from here, so they follow the lens without it being handed down through each of them. */
export const InspectorLensContext = createContext<Lens | null>(null);

interface Props {
  model: ExplorerModel;
  regionId: string;
  lens: Lens;
}

/**
 * Says, where a region's details stand, that the lens the picture is on holds
 * no value for that region. A change of lens leaves the selection and the
 * details as they are, so this is what tells a visitor why the region went pale.
 */
export default function RegionLensNote({ model, regionId, lens }: Props) {
  const region = model.regionsById.get(regionId);
  const limit = region === undefined ? null : limitForRegionUnderLens(lens, describeRegionUnderLens(model, region, toColourMode(lens)));
  return limit === null ? null : <div data-inspector-lens={lens.kind}><LimitNote limit={limit} /></div>;
}
