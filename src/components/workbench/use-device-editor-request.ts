import { useCallback, useEffect, useRef } from 'react';
import type { Route } from './route';
import { EDIT_DEVICE_TARGET, VIEW_STATE_KEYS } from './shell-targets';
import type { ViewStateStore } from './view-state-store';

function isSameRoute(first: Route, second: Route): boolean {
  return first.modeId === second.modeId && first.viewId === second.viewId;
}

/**
 * Opening the device editor from the shell, and closing it when the reader moves to another
 * screen. The editor is a modal layer over one screen; left open across a change of screen it
 * would sit over a page it no longer describes. The one change of screen that keeps it is the
 * one made to open it.
 */
export function useDeviceEditorRequest(store: ViewStateStore, route: Route, navigate: (next: Route) => void): () => void {
  const isArrivingToEditRef = useRef(false);
  const previousRouteRef = useRef(route);

  useEffect(() => {
    if (isSameRoute(previousRouteRef.current, route)) return;
    previousRouteRef.current = route;
    if (isArrivingToEditRef.current) isArrivingToEditRef.current = false;
    else store.write(VIEW_STATE_KEYS.modelEditorOpen, false);
  }, [route, store]);

  return useCallback((): void => {
    isArrivingToEditRef.current = !isSameRoute(previousRouteRef.current, EDIT_DEVICE_TARGET);
    store.write(VIEW_STATE_KEYS.modelEditorOpen, true);
    navigate(EDIT_DEVICE_TARGET);
  }, [store, navigate]);
}
