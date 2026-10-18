import { useCallback, useEffect, useState } from 'react';
import { isAbort, toLoadFailure, type Loaded } from './explorer-data';

export interface LoadedResource<T> {
  state: Loaded<T>;
  /** Tries again after a failure. */
  retry: () => void;
}

/**
 * Runs `load` once `isWanted` is true and keeps its outcome. A load whose
 * component goes away is aborted and reports nothing.
 *
 * @param load must be stable between renders (wrap it in useCallback), or it runs again
 * @param file the name shown if the failure carries none
 */
export function useLoaded<T>(load: (signal: AbortSignal) => Promise<T>, isWanted: boolean, file: string): LoadedResource<T> {
  const [state, setState] = useState<Loaded<T>>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isWanted) return undefined;
    const controller = new AbortController();
    setState({ status: 'loading' });
    load(controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbort(error)) return;
        setState({ status: 'failed', failure: toLoadFailure(error, file) });
      });
    return () => controller.abort();
  }, [load, isWanted, file, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  return { state, retry };
}
