import { useEffect, useRef, useState, type ComponentType } from 'react';
import type { LimitId, LimitSentence } from '@/lib/anatomy/limits-copy';
import { MOUNT_COPY } from '@/lib/anatomy/mount-copy';
import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import type { Lens } from '@/lib/atlas-explorer/lens-state';
import type { RegionViewPanelProps } from './RegionViewPanel';
import ReviewMark from './ReviewMark';
import './region-view-mount.css';

type PanelModule = { default: ComponentType<RegionViewPanelProps> };
type PanelState = { status: 'closed' } | { status: 'loading' } | { status: 'failed' } | { status: 'ready'; Panel: ComponentType<RegionViewPanelProps> };

export interface RegionViewMountProps extends RegionViewPanelProps {
  /**
   * For a technique lens whose links colour no shape: the sentence saying so, as the page was built with it
   * (build-technique-colouring.ts). It is shown beside the button and nothing more: the view works out its own fills
   * and its own caption from the data, and is not handed this.
   */
  nothingColoured?: LimitSentence | null;
  /**
   * For a technique lens the index holds: the review state of its drafted region links, as the page was built with it.
   * Shown with the technique's links in every state of this button (closed, loading, failed), so the links are never
   * mentioned here without their mark. Null for a technique with no drafted links to mark.
   */
  linksReview?: IndexReviewState | null;
  /** Replaceable in tests. In a page it is the real panel, fetched only when the visitor asks. */
  loadPanel?: () => Promise<PanelModule>;
}

/** The lens for a page that shows no technique, score or device of its own: every region coloured by its band. */
export const BAND_LENS: Lens = { kind: 'band' };

const loadRealPanel = (): Promise<PanelModule> => import('./RegionViewPanel');

/** The sentences for a technique that names no region at all. Only then does a technique's view list no region to pick. */
const NONE_NAMED_LIMIT_IDS: readonly LimitId[] = ['view_nothing_coloured_none_named', 'view_nothing_coloured_no_neural_band'];

/**
 * The way in to the 3D view from any page that lists regions or bands. Until
 * the visitor presses the button it is the button and one sentence: no atlas
 * data, no three.js, no geometry and no WebGL context are fetched or made, so
 * the page's own list is the whole of what loads. The list stays where it is
 * afterwards too, and is all there is if the view cannot load.
 *
 * `lens` decides every fill, from the data. `selectedRegionIds` and
 * `selectedBandId` are the visitor's own choice on the page: marked, never filled.
 * A page that passes `onRegionPick` keeps that choice in its own list, so with
 * nothing chosen yet the visitor is told to choose there.
 */
export default function RegionViewMount({ loadPanel = loadRealPanel, nothingColoured = null, linksReview = null, ...panelProps }: RegionViewMountProps) {
  const [panel, setPanel] = useState<PanelState>({ status: 'closed' });
  // The view lists a region to pick only for a selection or for a technique whose links name one.
  const listsNamedRegions = panelProps.lens.kind === 'technique' && !NONE_NAMED_LIMIT_IDS.includes(nothingColoured?.id as LimitId);
  const isNothingListed = (panelProps.selectedRegionIds ?? []).length === 0 && (panelProps.selectedBandId ?? null) === null && !listsNamedRegions;
  const showsChooseHint = isNothingListed && panelProps.onRegionPick !== undefined;
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const ask = (): void => {
    setPanel({ status: 'loading' });
    loadPanel()
      .then((module) => { if (isMounted.current) setPanel({ status: 'ready', Panel: module.default }); })
      // The script for the view did not arrive. The page says so beside the button and keeps its list.
      .catch(() => { if (isMounted.current) setPanel({ status: 'failed' }); });
  };

  if (panel.status === 'ready') return <panel.Panel {...panelProps} />;
  return (
    <div className="region-view-ask" data-region-mount={panel.status}>
      <button type="button" className="region-view-ask-button" onClick={ask} disabled={panel.status === 'loading'}>
        {panel.status === 'failed' ? 'Try the 3D view again' : 'Show the 3D view'}
      </button>
      {nothingColoured !== null && <span data-mount-note="nothing-coloured" data-limit-id={nothingColoured.id}>{nothingColoured.text}</span>}
      {linksReview !== null && <span data-mount-note="links-review">{MOUNT_COPY.links_review} <ReviewMark state={linksReview} /></span>}
      {panel.status === 'closed' && <span>{MOUNT_COPY.ask}</span>}
      {panel.status === 'closed' && showsChooseHint && <span data-mount-note="choose-in-list">{MOUNT_COPY.choose_in_list}</span>}
      {panel.status === 'loading' && <span role="status">{MOUNT_COPY.loading}</span>}
      {panel.status === 'failed' && <span role="alert">{MOUNT_COPY.failed}</span>}
    </div>
  );
}
