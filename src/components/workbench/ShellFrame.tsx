import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useMediaQuery } from '@/components/lab-kit/use-media-query';
import CommandPalette from './CommandPalette';
import { useFocus } from './FocusContext';
import ModeErrorBoundary from './ModeErrorBoundary';
import ModeNav from './ModeNav';
import { WORKBENCH_MODES } from './mode-registry';
import type { PaletteCommand } from './palette-commands';
import { describeRoute, type Route } from './route';
import { DEVICE_PART_TARGET, REPORT_TARGET, TECHNIQUE_TARGET, VIEW_STATE_KEYS } from './shell-targets';
import StandingLine from './StandingLine';
import TopBar from './TopBar';
import { useElementHeight } from './use-element-height';
import { useLabRoute } from './use-lab-route';
import ViewTabs from './ViewTabs';
import type { ViewStateStore } from './view-state-store';

/** Under this width the modes move to the bottom edge and the views become one menu. */
const NARROW_QUERY = '(max-width: 720px)';
/** Under this height there is no room for a fixed bar of statements, so they open the scrolling page instead. */
const SHORT_QUERY = '(max-height: 499px)';
/** The convention every screen follows: its results region carries this id, and "Skip to results" lands on it. */
export const RESULTS_ID = 'lab-results';
const SCREEN_ID = 'lab-screen';

function isSameRoute(first: Route, second: Route): boolean {
  return first.modeId === second.modeId && first.viewId === second.viewId;
}

function focusWithoutLinking(element: HTMLElement | null): void {
  if (element === null) return;
  if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
  element.focus();
}

/** Tells the shell that the view for a route has been drawn. It sits inside the loading boundary, so it waits for the mode's code. */
function ViewReady({ route, onReady }: { route: Route; onReady: (route: Route) => void }) {
  const { modeId, viewId } = route;
  useLayoutEffect(() => onReady({ modeId, viewId }), [modeId, viewId, onReady]);
  return null;
}

/**
 * The frame every Lab screen sits in: the bars, the screen scrolling beneath them, and the
 * statements that never leave. It must be rendered inside the focus and view-state providers.
 */
export default function ShellFrame({ store }: { store: ViewStateStore }) {
  const { engineData } = useFocus();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLElement>(null);
  const isPrintPendingRef = useRef(false);
  const { route, isAddressRecognised, navigate, openMode, selectView, restoreScroll } = useLabRoute(store, scrollerRef);
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const isShort = useMediaQuery(SHORT_QUERY);
  const barsHeight = useElementHeight(barsRef);
  const footHeight = useElementHeight(footRef);
  const [isPaletteOpen, setPaletteOpen] = useState(false);

  // One lazy component per mode, created once, so switching back does not reload it.
  const lazyComponents = useMemo(() => new Map(WORKBENCH_MODES.map((mode) => [mode.id, lazy(mode.load)])), []);
  const activeMode = WORKBENCH_MODES.find((mode) => mode.id === route.modeId);
  const ActiveComponent = lazyComponents.get(route.modeId);

  useEffect(() => {
    const togglePalette = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      setPaletteOpen((wasOpen) => !wasOpen);
    };
    window.addEventListener('keydown', togglePalette);
    return () => window.removeEventListener('keydown', togglePalette);
  }, []);

  const handleViewReady = useCallback((readyRoute: Route): void => {
    restoreScroll();
    const shouldPrint = isPrintPendingRef.current && isSameRoute(readyRoute, REPORT_TARGET);
    isPrintPendingRef.current = false;
    // Printing waits one turn so the report is on the page before the browser reads it.
    if (shouldPrint) window.setTimeout(() => window.print(), 0);
  }, [restoreScroll]);

  const printReport = (): void => {
    if (isSameRoute(route, REPORT_TARGET)) {
      window.print();
      return;
    }
    isPrintPendingRef.current = true;
    navigate(REPORT_TARGET, { isInstant: true });
  };

  const runCommand = (command: PaletteCommand): void => {
    setPaletteOpen(false);
    if (command.kind === 'view') navigate(command.route);
    if (command.kind === 'technique') {
      store.write(VIEW_STATE_KEYS.catalogOpenedTechniqueId, command.techniqueId);
      navigate(TECHNIQUE_TARGET);
    }
    if (command.kind === 'part') {
      store.write(VIEW_STATE_KEYS.modelSelectedElementId, command.elementId);
      navigate(DEVICE_PART_TARGET);
    }
    focusWithoutLinking(document.getElementById(SCREEN_ID));
  };

  /** Moves focus without touching the address, which holds only mode and view. */
  const skipToResults = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    focusWithoutLinking(document.getElementById(RESULTS_ID) ?? document.getElementById(SCREEN_ID));
  };

  const standing = <StandingLine catalogVersion={engineData.registrarVersion} techniqueCount={engineData.techniques.length} hasSiteLink={isNarrow} />;
  // Measured, so whatever a screen pins under the bars or floats beside the work clears both exactly.
  const frameStyle = {
    ...(barsHeight === null ? {} : { '--lab-topbar-height': `${barsHeight}px` }),
    ...(footHeight === null ? {} : { '--lab-foot-height': `${footHeight}px` }),
  } as CSSProperties;

  return (
    <div className="lab lab-shell" style={frameStyle}>
      <a className="lab-skip" href={`#${RESULTS_ID}`} onClick={skipToResults}>Skip to results</a>
      <div className="lab-shell-scroll" ref={scrollerRef}>
        <div className="lab-bars" ref={barsRef}>
          <TopBar
            activeModeId={route.modeId} onOpenMode={openMode} onNavigate={navigate} onPrintReport={printReport}
            onOpenPalette={() => setPaletteOpen(true)} isNarrow={isNarrow}
          />
          <ViewTabs modeId={route.modeId} activeViewId={route.viewId} onSelectView={selectView} isNarrow={isNarrow} />
        </div>
        {isShort && <div className="lab-standing-inline">{standing}</div>}
        {!isAddressRecognised && (
          <p className="lab-address-notice" role="status">That address is not a screen in TARA Lab. Showing {describeRoute(route)}.</p>
        )}
        <div className="lab-shell-body" id={SCREEN_ID} tabIndex={-1}>
          <ModeErrorBoundary key={route.modeId} modeLabel={activeMode?.label ?? 'This mode'}>
            <Suspense fallback={<p className="lab-soft" role="status">Loading…</p>}>
              {ActiveComponent !== undefined && <ActiveComponent viewId={route.viewId} onSelectView={selectView} onOpenMode={openMode} />}
              <ViewReady route={route} onReady={handleViewReady} />
            </Suspense>
          </ModeErrorBoundary>
        </div>
      </div>
      <footer className="lab-foot" ref={footRef}>
        {!isShort && standing}
        {isNarrow && <ModeNav activeModeId={route.modeId} onOpenMode={openMode} placement="bottom" />}
      </footer>
      {isPaletteOpen && <CommandPalette onRun={runCommand} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
