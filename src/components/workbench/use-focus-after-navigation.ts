import { useCallback, useRef } from 'react';

/** The convention every screen follows: its results region carries this id, and "Skip to results" lands on it. */
export const RESULTS_ID = 'lab-results';
export const SCREEN_ID = 'lab-screen';

/** Moves focus to a region without scrolling it or changing the address. */
function focusRegion(element: HTMLElement | null): void {
  if (element === null) return;
  if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
}

/** Focus goes to the screen's results, or to the screen itself where it has no results region. */
export function focusResults(): void {
  focusRegion(document.getElementById(RESULTS_ID) ?? document.getElementById(SCREEN_ID));
}

/** True when focus is nowhere useful: on the document, on something no longer on the page, or on the screen's own container. */
function hasLostFocus(): boolean {
  const active = document.activeElement;
  return active === null || active === document.body || !active.isConnected || active.id === SCREEN_ID;
}

/**
 * Where focus goes after the screen changes. A tab or mode button keeps focus, since it is
 * still on the page. A control inside the old screen ("Start from this class", a part in the
 * diagram) is gone, and focus would fall to the top of the document: it is moved to the new
 * screen's results instead. The first screen of a visit is left alone, so the skip link stays first.
 * Returns the function to call each time a view has been drawn.
 */
export function useFocusAfterNavigation(): () => void {
  const hasShownFirstViewRef = useRef(false);
  return useCallback((): void => {
    const isFirstView = !hasShownFirstViewRef.current;
    hasShownFirstViewRef.current = true;
    if (!isFirstView && hasLostFocus()) focusResults();
  }, []);
}
