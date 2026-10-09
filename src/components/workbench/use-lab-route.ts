/**
 * Where the reader is, and how they move. The address holds mode and view only; the view
 * each mode was left on and the scroll offset of each view are kept in view state, so a
 * mode reopens where it was and Back returns to the same place on the page.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useViewTransition } from '@/components/lab-kit/motion/use-view-transition';
import type { ModeId } from './mode-registry';
import { parseAddress, titleFor, toHash, type Address, type Route } from './route';
import { MODEL_KEY_PREFIX, lastViewKey, scrollKey, scrollKeyPrefix } from './shell-targets';
import { defaultViewId, findView } from './view-registry';
import type { ViewStateStore } from './view-state-store';

const DEVICE_MODE_ID: ModeId = 'model';

export interface NavigateOptions {
  /** Skip the transition, for a change that must be on the page at once (printing). */
  isInstant?: boolean;
}

export interface LabNavigation {
  route: Route;
  /** False when the address named no screen and the route is a fallback. */
  isAddressRecognised: boolean;
  navigate: (next: Route, options?: NavigateOptions) => void;
  /** Opens a mode at the view it was left on. */
  openMode: (modeId: ModeId) => void;
  selectView: (viewId: string) => void;
  /** Puts the page back at the offset the current view was left at. Call once the view is drawn. */
  restoreScroll: () => void;
}

/** A replaced device starts fresh: what the reader had open on the old one no longer describes anything. */
export function forgetDeviceViews(store: ViewStateStore): void {
  store.clearPrefix(MODEL_KEY_PREFIX);
  store.clearPrefix(scrollKeyPrefix(DEVICE_MODE_ID));
  store.write(lastViewKey(DEVICE_MODE_ID), undefined);
}

function readLastView(store: ViewStateStore, modeId: ModeId): string {
  const remembered = store.read(lastViewKey(modeId));
  return typeof remembered === 'string' && findView(modeId, remembered) !== null ? remembered : defaultViewId(modeId);
}

export function useLabRoute(store: ViewStateStore, scrollerRef: RefObject<HTMLElement | null>): LabNavigation {
  const [address, setAddress] = useState<Address>(() => parseAddress(window.location.hash));
  const routeRef = useRef(address.route);
  const isNextInstantRef = useRef(false);
  // One cross-fade per change of screen; none where the browser cannot, or the viewer asked for less motion.
  const runTransition = useViewTransition();
  const { route } = address;

  const saveScroll = useCallback((): void => {
    const scroller = scrollerRef.current;
    if (scroller !== null) store.write(scrollKey(routeRef.current), Math.round(scroller.scrollTop));
  }, [store, scrollerRef]);

  const restoreScroll = useCallback((): void => {
    const scroller = scrollerRef.current;
    const offset = store.read(scrollKey(routeRef.current));
    if (scroller !== null) scroller.scrollTop = typeof offset === 'number' && offset > 0 ? offset : 0;
  }, [store, scrollerRef]);

  // Every change of address arrives here, whether from a tab, a mode button or the browser's Back.
  useEffect(() => {
    const syncFromAddress = (): void => {
      saveScroll();
      const next = parseAddress(window.location.hash);
      const apply = (): void => {
        routeRef.current = next.route;
        setAddress(next);
      };
      const isInstant = isNextInstantRef.current;
      isNextInstantRef.current = false;
      if (isInstant) apply();
      else runTransition(apply);
    };
    window.addEventListener('hashchange', syncFromAddress);
    window.addEventListener('pagehide', saveScroll);
    return () => {
      window.removeEventListener('hashchange', syncFromAddress);
      window.removeEventListener('pagehide', saveScroll);
    };
  }, [saveScroll, runTransition]);

  useEffect(() => {
    store.write(lastViewKey(address.route.modeId), address.route.viewId);
    document.title = titleFor(address.route);
    // An address that named no screen, or carried something after the screen, is corrected in place, so it is not kept in history or copied onward.
    if (!address.isRecognised || !address.isCanonical) window.history.replaceState(window.history.state, '', toHash(address.route));
  }, [address, store]);

  /** Changing the address adds a history entry, so the browser's Back button moves within the Lab. */
  const navigate = useCallback((next: Route, options?: NavigateOptions): void => {
    const hash = toHash(next);
    if (window.location.hash === hash) {
      // Already there: nothing to add to history, but a fallback notice no longer applies.
      const current = parseAddress(hash);
      routeRef.current = current.route;
      setAddress(current);
      return;
    }
    isNextInstantRef.current = options?.isInstant === true;
    window.location.hash = hash;
  }, []);

  const openMode = useCallback((modeId: ModeId): void => navigate({ modeId, viewId: readLastView(store, modeId) }), [navigate, store]);
  const selectView = useCallback((viewId: string): void => navigate({ modeId: routeRef.current.modeId, viewId }), [navigate]);

  return { route, isAddressRecognised: address.isRecognised, navigate, openMode, selectView, restoreScroll };
}
