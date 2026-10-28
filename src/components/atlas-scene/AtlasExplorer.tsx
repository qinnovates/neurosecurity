import { useCallback, useMemo } from 'react';
import { ANATOMY_INDEX_PATH, type PinnedFile } from '@/lib/anatomy/anatomy-index-types';
import { readRegionDeepLink } from './atlas-deep-link';
import ExplorerWorkspace from './ExplorerWorkspace';
import { loadExplorerModel } from './explorer-data';
import LoadNotice from './LoadNotice';
import { useLoaded } from './use-loaded';
import './atlas-scene.css';
import './atlas-chain-devices.css';
import './atlas-workspace.css';

/**
 * The atlas explorer. It is built with no anatomy at all: everything it shows
 * is fetched from this site's own static files when it starts, and each file
 * is parsed before any of it reaches the screen. The page tells it which index
 * it was built with, and an index from any other build is refused. If the
 * index cannot be loaded or fails its checks, the page says which and shows
 * nothing else.
 */
interface Props {
  /** The index's path, length and digest, and nothing else of it: the page is built with these three values. */
  indexPin?: PinnedFile;
  /** The page's query string. Read from the address in the page; given in tests. */
  search?: string;
}

/** The island renders in the browser only, so the address is there to read; a render without one asks for nothing. */
const readSearch = (): string => (typeof window === 'undefined' ? '' : window.location.search);

export default function AtlasExplorer({ indexPin, search }: Props) {
  const pin = indexPin ?? null;
  const load = useCallback((signal: AbortSignal) => loadExplorerModel(signal, pin), [pin?.sha256, pin?.bytes, pin?.path]);
  const { state, retry } = useLoaded(load, true, ANATOMY_INDEX_PATH);
  const model = state.status === 'ready' ? state.data.model : null;
  // Decided once per model, against the regions it holds: an id the index does not name selects nothing.
  const initialSelection = useMemo(() => (model === null ? null : readRegionDeepLink(search ?? readSearch(), model.regionsById)), [model, search]);
  if (state.status === 'ready') {
    return (
      <>
        {state.data.indexPinState === 'mismatched' && (
          <p className="atlas-failure" role="alert" data-index-pin="mismatched">
            <strong>The 3D view is not available.</strong> This page and the data files the site now serves are out of step with each other, so no shape can be matched to this page.
            The list below is read from the data now served. Reload the page to get a matching copy.
          </p>
        )}
        <ExplorerWorkspace model={state.data.model} isIndexPinned={state.data.indexPinState === 'pinned'} isOutOfStep={state.data.indexPinState === 'mismatched'} initialSelection={initialSelection} />
      </>
    );
  }
  return (
    <div className="atlas-root" data-status={state.status}>
      <LoadNotice what="the atlas data" state={state.status === 'idle' ? { status: 'loading' } : state} onRetry={retry} />
    </div>
  );
}
