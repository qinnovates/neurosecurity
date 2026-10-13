import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import { INITIAL_EXPLORER_STATE } from './atlas-state';
import AtlasViewport from './AtlasViewport';

export interface AtlasRegionViewProps {
  model: ExplorerModel;
  /** The colour mode and its subject: a band view, one technique, NISS, one DSM cluster tag or one device. */
  lens: Lens;
  selectedRegionId: string | null;
  isIndexPinned: boolean;
  onRegionSelect: (regionId: string) => void;
}

/**
 * The 3D view for use on another page: give it a lens and it draws what that
 * lens shows, with the same caption, marks and checks as the explorer's.
 *
 * It takes no list of regions to highlight, on purpose. What is filled is
 * always worked out by the style functions from the lens, so no caller can
 * colour every region of a band, or any region the data does not link.
 */
export default function AtlasRegionView({ model, lens, selectedRegionId, isIndexPinned, onRegionSelect }: AtlasRegionViewProps) {
  return (
    <AtlasViewport
      model={model} lens={lens} layers={INITIAL_EXPLORER_STATE.layers} selectedRegionId={selectedRegionId}
      isIndexPinned={isIndexPinned} onSelectRegion={onRegionSelect}
    />
  );
}
