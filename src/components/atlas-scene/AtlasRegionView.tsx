import { useMemo } from 'react';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import { buildRegionViewNotes } from '@/lib/atlas-explorer/region-view-notes';
import { INITIAL_EXPLORER_STATE } from './atlas-state';
import AtlasViewport from './AtlasViewport';
import RegionViewNotes from './RegionViewNotes';

export interface AtlasRegionViewProps {
  model: ExplorerModel;
  /** The colour mode and its subject: a band view, one technique, NISS, one DSM cluster tag or one device. It alone decides every fill. */
  lens: Lens;
  /** The region picked in this view, whose detail is open. */
  selectedRegionId: string | null;
  /** The regions the visitor chose on the page. A selection: corner marks and no fill, worded as the visitor's choice. */
  selectedRegionIds?: readonly string[];
  /** The band the visitor chose on the page. A selection too; its regions are read from the index here, never passed in. */
  selectedBandId?: string | null;
  isIndexPinned: boolean;
  isOutOfStep?: boolean;
  /** The visitor already asked for the view with the page's own control, so it opens without a second button. */
  isAsked?: boolean;
  onRegionSelect: (regionId: string) => void;
}

const NO_REGIONS: readonly string[] = [];

/**
 * The 3D view for use on another page: give it a lens and it draws what that
 * lens shows, with the same caption, marks and checks as the explorer's, and
 * beside it the words that limit it.
 *
 * It takes no list of regions to fill, on purpose. What is filled is always
 * worked out by the style functions from the lens, so no caller can colour
 * every region of a band, or any region the data does not link. What a page
 * may add is the visitor's own selection, which is a different channel: corner
 * marks around a shape, no fill, and a sentence saying whose choice it is.
 */
export default function AtlasRegionView(props: AtlasRegionViewProps) {
  const { model, lens, selectedRegionId, selectedRegionIds = NO_REGIONS, selectedBandId = null, isIndexPinned, isOutOfStep = false, isAsked = false, onRegionSelect } = props;
  const notes = useMemo(() => buildRegionViewNotes(model, lens, { regionIds: selectedRegionIds, bandId: selectedBandId }), [model, lens, selectedRegionIds.join(' '), selectedBandId]);
  return (
    <div className="atlas-region-view" role="group" aria-label="3D view and what it shows">
      <AtlasViewport
        model={model} lens={lens} layers={INITIAL_EXPLORER_STATE.layers} selectedRegionId={selectedRegionId} selectedRegionGroups={notes.bracketGroups}
        isIndexPinned={isIndexPinned} isOutOfStep={isOutOfStep} isAsked={isAsked} onSelectRegion={onRegionSelect}
      />
      <RegionViewNotes model={model} notes={notes} pickedRegionId={selectedRegionId} onPickRegion={onRegionSelect} />
    </div>
  );
}
