import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import AtlasRegionView from './AtlasRegionView';
import { loadExplorerModel } from './explorer-data';
import LoadNotice from './LoadNotice';
import { readIndexPin } from './read-index-pin';
import { useLoaded } from './use-loaded';
// As addresses, not as imports of the styles: a stylesheet imported here would be linked from every page that can reach
// this chunk and so load on its first visit. These two are added to the page only when the view is.
import mountStylesUrl from './atlas-region-mount.css?url';
import sceneStylesUrl from './atlas-scene.css?url';

const STYLESHEET_URLS: readonly string[] = [sceneStylesUrl, mountStylesUrl];
const STYLESHEET_ATTRIBUTE = 'data-atlas-view-styles';

/** Links the view's two stylesheets from this site, once per page however many views it holds. */
function useViewStylesheets(): void {
  useEffect(() => {
    for (const url of STYLESHEET_URLS) {
      const isLinked = [...document.head.querySelectorAll(`link[${STYLESHEET_ATTRIBUTE}]`)].some((link) => link.getAttribute('href') === url);
      if (isLinked) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute(STYLESHEET_ATTRIBUTE, 'true');
      document.head.append(link);
    }
  }, []);
}

/** A region picked in the view, as the page hears of it. */
export interface RegionPick {
  regionId: string;
  /** The bands the index places the region in. */
  bandIds: readonly string[];
}

export interface RegionViewPanelProps {
  lens: Lens;
  selectedRegionIds?: readonly string[];
  selectedBandId?: string | null;
  /** Given by a page that keeps the visitor's choice in its own list. With nothing chosen, the view then says to choose there. */
  onRegionPick?: (pick: RegionPick) => void;
}

/**
 * Everything of an embedded 3D view that needs the atlas data. It is fetched
 * only after the visitor asks for the view: it then reads the page's index
 * pin, fetches the index and the catalog from this site, checks and parses
 * them, and hands the model to the one region view. If any of that fails it
 * says which, and the page's own list stays as it was.
 */
export default function RegionViewPanel({ lens: givenLens, selectedRegionIds, selectedBandId, onRegionPick }: RegionViewPanelProps) {
  // A page passes the lens as a fresh object on every render; the scene is rebuilt only when its content changes.
  const lensKey = JSON.stringify(givenLens);
  const lens = useMemo(() => givenLens, [lensKey]);
  useViewStylesheets();
  const pin = useMemo(() => readIndexPin(), []);
  const load = useCallback((signal: AbortSignal) => loadExplorerModel(signal, pin), [pin]);
  const { state, retry } = useLoaded(load, true, ANATOMY_INDEX_PATH);
  const [pickedRegionId, setPickedRegionId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // The button that asked for the view is gone once this is on screen, so focus moves here and is not lost.
  useEffect(() => rootRef.current?.focus({ preventScroll: true }), []);

  const pick = (regionId: string): void => {
    setPickedRegionId(regionId);
    const bandIds = state.status === 'ready' ? state.data.model.regionsById.get(regionId)?.band_ids ?? [] : [];
    onRegionPick?.({ regionId, bandIds });
  };

  return (
    <div className="atlas-root atlas-region-mount" data-region-mount={state.status} tabIndex={-1} ref={rootRef}>
      {state.status === 'ready' ? (
        <AtlasRegionView
          model={state.data.model} lens={lens} selectedRegionId={pickedRegionId} selectedRegionIds={selectedRegionIds} selectedBandId={selectedBandId}
          isIndexPinned={state.data.indexPinState === 'pinned'} isOutOfStep={state.data.indexPinState === 'mismatched'} isAsked canChooseInList={onRegionPick !== undefined} onRegionSelect={pick}
        />
      ) : (
        <LoadNotice what="the atlas data for the 3D view; the list on this page is unchanged" state={state.status === 'idle' ? { status: 'loading' } : state} onRetry={retry} />
      )}
    </div>
  );
}
