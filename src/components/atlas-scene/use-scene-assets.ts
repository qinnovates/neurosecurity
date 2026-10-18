import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnatomyIndex } from '@/lib/anatomy/anatomy-index-types';
import { isAbort } from './explorer-data';
import { loadSceneAsset, type SceneAssetState } from './scene-assets';

export type SceneAssetStates = Readonly<Record<string, SceneAssetState>>;

/**
 * Loads the geometry files for the asset ids wanted, one at a time in the order
 * given, and keeps each file's state. A file is asked for once: a layer turned
 * off and on again does not fetch it twice. `retry` asks again for the failed.
 */
export function useSceneAssets(index: AnatomyIndex, wantedAssetIds: readonly string[]): { states: SceneAssetStates; retry: () => void } {
  const [states, setStates] = useState<SceneAssetStates>({});
  const [attempt, setAttempt] = useState(0);
  const started = useRef(new Set<string>());
  const wantedKey = wantedAssetIds.join(' ');

  useEffect(() => {
    const controller = new AbortController();
    const pending = index.assets.filter((asset) => wantedKey.split(' ').includes(asset.id) && !started.current.has(asset.id));
    const loadInTurn = async (): Promise<void> => {
      for (const asset of pending) {
        started.current.add(asset.id);
        setStates((current) => ({ ...current, [asset.id]: { status: 'loading' } }));
        try {
          const state = await loadSceneAsset(index, asset, controller.signal);
          setStates((current) => ({ ...current, [asset.id]: state }));
        } catch (error) {
          // A load abandoned because the view closed is asked for again next time; anything else is shown as a failure.
          if (controller.signal.aborted || isAbort(error)) {
            started.current.delete(asset.id);
            return;
          }
          setStates((current) => ({ ...current, [asset.id]: { status: 'failed', reason: 'unavailable', detail: error instanceof Error ? error.message : String(error) } }));
        }
      }
    };
    void loadInTurn();
    return () => controller.abort();
  }, [index, wantedKey, attempt]);

  const latest = useRef(states);
  latest.current = states;
  // Stable between renders, so what is derived from the states is rebuilt only when a file's state changes.
  const retry = useCallback((): void => {
    for (const [assetId, state] of Object.entries(latest.current)) if (state.status === 'failed') started.current.delete(assetId);
    setAttempt((count) => count + 1);
  }, []);
  return { states, retry };
}
