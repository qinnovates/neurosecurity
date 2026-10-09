import { useCallback } from 'react';
import { ANATOMY_INDEX_PATH } from '@/lib/anatomy/anatomy-index-types';
import ExplorerWorkspace from './ExplorerWorkspace';
import { loadExplorerModel } from './explorer-data';
import LoadNotice from './LoadNotice';
import { useLoaded } from './use-loaded';
import './atlas-scene.css';

/**
 * The atlas explorer. It is built with no anatomy at all: everything it shows
 * is fetched from this site's own static files when it starts, and each file
 * is parsed before any of it reaches the screen. If the index cannot be loaded
 * or fails its checks, the page says which and shows nothing else.
 */
export default function AtlasExplorer() {
  const load = useCallback((signal: AbortSignal) => loadExplorerModel(signal), []);
  const { state, retry } = useLoaded(load, true, ANATOMY_INDEX_PATH);
  if (state.status === 'ready') return <ExplorerWorkspace model={state.data} />;
  return (
    <div className="atlas-root" data-status={state.status}>
      <LoadNotice what="the atlas data" state={state.status === 'idle' ? { status: 'loading' } : state} onRetry={retry} />
    </div>
  );
}
