import { useCallback, useMemo } from 'react';
import { ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import type { AtlasViewportProps } from './AtlasViewport';
import BrainHeroView from './BrainHeroView';
import { loadExplorerModel } from './explorer-data';
import LoadNotice from './LoadNotice';
import { readIndexPin } from './read-index-pin';
import { useLoaded } from './use-loaded';
import { useViewStylesheets } from './use-view-stylesheets';
// As addresses, not as imports of the styles: see RegionViewPanel.tsx. They are added to the page only when the hero is.
import heroStylesUrl from './brain-hero.css?url';
import sceneStylesUrl from './atlas-scene.css?url';

const STYLESHEET_URLS: readonly string[] = [sceneStylesUrl, heroStylesUrl];

export interface BrainHeroPanelProps {
  /** Replaceable in tests. In the page they are the real WebGL probe and the real 3D view, fetched only once the gate opens. */
  probe?: AtlasViewportProps['probe'];
  loadOpenView?: AtlasViewportProps['loadOpenView'];
  /** False for a teaser placement: orbit/zoom stay on, region pick-to-summary is disabled. Defaults to true. */
  interactive?: boolean;
}

/**
 * Everything of the homepage brain that needs the atlas data. It reads the
 * page's index pin, fetches the index and the catalog from this site, checks
 * and parses them, and hands the model to the hero view. If any of that fails
 * it says which; the page's link to the full atlas is unchanged.
 */
export default function BrainHeroPanel({ probe, loadOpenView, interactive = true }: BrainHeroPanelProps) {
  useViewStylesheets(STYLESHEET_URLS);
  const pin = useMemo(() => readIndexPin(), []);
  const load = useCallback((signal: AbortSignal) => loadExplorerModel(signal, pin), [pin]);
  const { state, retry } = useLoaded(load, true, ANATOMY_INDEX_PATH);
  if (state.status !== 'ready') {
    return (
      <div className="atlas-root brain-hero" data-brain-hero={state.status}>
        <LoadNotice what="the atlas data for the 3D brain" state={state.status === 'idle' ? { status: 'loading' } : state} onRetry={retry} />
      </div>
    );
  }
  return <BrainHeroView model={state.data.model} isIndexPinned={state.data.indexPinState === 'pinned'} isOutOfStep={state.data.indexPinState === 'mismatched'} probe={probe} loadOpenView={loadOpenView} interactive={interactive} />;
}
