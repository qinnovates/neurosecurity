import { useCallback } from 'react';
import { ANATOMY_INDEX_PATH, type PinnedFile } from '@/lib/anatomy/anatomy-index-types';
import ExplorerWorkspace from './ExplorerWorkspace';
import { loadExplorerModel } from './explorer-data';
import LoadNotice from './LoadNotice';
import { useLoaded } from './use-loaded';
import './atlas-scene.css';

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
}

export default function AtlasExplorer({ indexPin }: Props) {
  const pin = indexPin ?? null;
  const load = useCallback((signal: AbortSignal) => loadExplorerModel(signal, pin), [pin?.sha256, pin?.bytes, pin?.path]);
  const { state, retry } = useLoaded(load, true, ANATOMY_INDEX_PATH);
  if (state.status === 'ready') return <ExplorerWorkspace model={state.data} isIndexPinned={pin !== null} />;
  return (
    <div className="atlas-root" data-status={state.status}>
      <LoadNotice what="the atlas data" state={state.status === 'idle' ? { status: 'loading' } : state} onRetry={retry} />
    </div>
  );
}
