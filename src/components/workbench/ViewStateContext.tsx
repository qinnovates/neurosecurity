/**
 * The reader's place in each view, held above the modes. `FocusContext` is the device;
 * this is where the reader was looking, and the two are reset by different events.
 */

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { matchesShape, type ViewStateStore } from './view-state-store';

const ViewStateContext = createContext<ViewStateStore | null>(null);

interface ProviderProps {
  store: ViewStateStore;
  children: ReactNode;
}

export function ViewStateProvider({ store, children }: ProviderProps) {
  return <ViewStateContext.Provider value={store}>{children}</ViewStateContext.Provider>;
}

/** The store itself, for code that writes a key it does not render: the shell, the device menu, the command palette. */
export function useViewStateStore(): ViewStateStore | null {
  return useContext(ViewStateContext);
}

export type SetViewState<T> = (next: T | ((previous: T) => T)) => void;

const subscribeToNothing = (): (() => void) => () => undefined;

/**
 * `useState` for anything a view should still have when the reader comes back: filters,
 * sort, layout, the opened item. Values must be plain JSON, never a function.
 *
 * The key is a path such as "explore/catalog/filters"; keys under "model/" are cleared when
 * the device is replaced. A held value is used only if `isValid` accepts it; without a
 * validator it must have the same shape as `initial`. Pass a validator defined outside the
 * component for anything stricter, for example an id that must exist. Outside the shell
 * (a test, the kit page) there is no provider and this behaves as plain `useState`.
 */
export function useViewState<T>(key: string, initial: T, isValid?: (value: unknown) => value is T): [T, SetViewState<T>] {
  const store = useContext(ViewStateContext);
  const [firstInitial] = useState(initial);
  const [localValue, setLocalValue] = useState(initial);
  const accepts = useMemo(
    () => isValid ?? ((value: unknown): value is T => matchesShape(value, firstInitial)),
    [isValid, firstInitial],
  );

  const subscribe = useMemo(() => (store === null ? subscribeToNothing : store.subscribe), [store]);
  const held = useSyncExternalStore(subscribe, () => store?.read(key));
  const sharedValue = held !== undefined && accepts(held) ? held : firstInitial;

  const setSharedValue = useCallback<SetViewState<T>>((next) => {
    if (store === null) return;
    const current = store.read(key);
    const previous = current !== undefined && accepts(current) ? current : firstInitial;
    store.write(key, next instanceof Function ? next(previous) : next);
  }, [store, key, accepts, firstInitial]);

  return store === null ? [localValue, setLocalValue] : [sharedValue, setSharedValue];
}
