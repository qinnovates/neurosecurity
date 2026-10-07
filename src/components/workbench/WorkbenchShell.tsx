import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import ModeErrorBoundary from './ModeErrorBoundary';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { FocusProvider } from './FocusContext';
import ModeNav from './ModeNav';
import { WORKBENCH_MODES, type ModeId } from './mode-registry';
import ModeViews from './ModeViews';
import { parseRoute, toHash, type Route } from './route';
import StandingLine from './StandingLine';
import TopBar from './TopBar';
import { defaultViewId } from './view-registry';
import ViewTabs from './ViewTabs';
import '@/components/lab-kit/lab-kit.css';
import './lab-shell.css';

interface Props {
  engineData: EngineData;
  referenceData: ReferenceData;
}

/**
 * The frame every Lab screen sits in: one bar with the modes and the device in focus, the
 * views of the current mode, the screen itself, and the statements that never leave.
 */
export default function WorkbenchShell({ engineData, referenceData }: Props) {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const syncFromAddress = (): void => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', syncFromAddress);
    return () => window.removeEventListener('hashchange', syncFromAddress);
  }, []);

  // One lazy component per mode, created once, so switching back does not reload it.
  const lazyComponents = useMemo(() => new Map(WORKBENCH_MODES.map((mode) => [mode.id, lazy(mode.load)])), []);
  const activeMode = WORKBENCH_MODES.find((mode) => mode.id === route.modeId);
  const ActiveComponent = lazyComponents.get(route.modeId);

  /** Changing the address adds a history entry, so the browser's Back button moves within the Lab. */
  const navigate = (next: Route): void => {
    const hash = toHash(next);
    if (window.location.hash === hash) setRoute(next);
    else window.location.hash = hash;
  };
  // Arriving at a mode lands on its own screen, where the device in focus is shown.
  const openMode = (modeId: ModeId): void => navigate({ modeId, viewId: defaultViewId(modeId) });
  const selectView = (viewId: string): void => navigate({ modeId: route.modeId, viewId });

  return (
    <FocusProvider engineData={engineData} referenceData={referenceData}>
      <div className="lab lab-shell">
        <TopBar activeModeId={route.modeId} onOpenMode={openMode} />
        <ViewTabs modeId={route.modeId} activeViewId={route.viewId} onSelectView={selectView} />
        <div className="lab-shell-body">
          <ModeViews modeId={route.modeId} activeViewId={route.viewId}>
            <ModeErrorBoundary key={route.modeId} modeLabel={activeMode?.label ?? 'This mode'}>
              <Suspense fallback={<p className="lab-soft" role="status">Loading…</p>}>
                {ActiveComponent !== undefined && <ActiveComponent onOpenMode={openMode} />}
              </Suspense>
            </ModeErrorBoundary>
          </ModeViews>
        </div>
        <footer className="lab-foot tm-no-print">
          <StandingLine catalogVersion={engineData.registrarVersion} techniqueCount={engineData.techniques.length} />
          <ModeNav activeModeId={route.modeId} onOpenMode={openMode} placement="bottom" />
        </footer>
      </div>
    </FocusProvider>
  );
}
