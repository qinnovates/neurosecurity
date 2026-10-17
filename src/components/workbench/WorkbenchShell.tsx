import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import ModeErrorBoundary from './ModeErrorBoundary';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { FocusProvider, useFocus } from './FocusContext';
import { DEFAULT_MODE_ID, WORKBENCH_MODES, isModeId, type ModeId } from './mode-registry';
import ModeViews from './ModeViews';
import { defaultViewId, findView } from './view-registry';
import '@/components/lab-kit/lab-kit.css';
import './workbench.css';

interface Props {
  engineData: EngineData;
  referenceData: ReferenceData;
}

interface Route {
  modeId: ModeId;
  viewId: string;
}

/**
 * The address holds only where you are: "#model" or "#explore/catalog". Device details
 * never go in it. Anything unrecognised falls back to a default instead of failing.
 */
function readRoute(): Route {
  const [modeCandidate = '', viewCandidate] = window.location.hash.replace('#', '').split('/');
  const modeId = isModeId(modeCandidate) ? modeCandidate : DEFAULT_MODE_ID;
  const hasKnownView = viewCandidate !== undefined && findView(modeId, viewCandidate) !== null;
  return { modeId, viewId: hasKnownView ? viewCandidate : defaultViewId(modeId) };
}

function toHash(route: Route): string {
  return route.viewId === defaultViewId(route.modeId) ? `#${route.modeId}` : `#${route.modeId}/${route.viewId}`;
}

/** The device every mode is looking at, always visible so switching mode never loses the thread. */
function FocusBar() {
  const { state, report, isRemembered, setRemembered, storageNotice } = useFocus();
  const { model } = state;
  const placedCount = new Set(report.riskRows.filter((row) => row.source === 'catalog').map((row) => row.techniqueId)).size;
  return (
    <div className="workbench-focus tm-no-print">
      <p className="workbench-focus-facts" aria-live="polite">
        <span className="workbench-focus-label">Device in focus</span>
        <strong>{model.name}</strong>
        <span>{model.direction === 'read' ? 'records' : model.direction === 'write' ? 'stimulates' : 'records and stimulates'}</span>
        <span>{model.components.length} parts</span>
        <span>{placedCount} techniques placed</span>
        <span>{report.chainResult.chains.length} chain hypotheses</span>
      </p>
      <label className="workbench-remember">
        <input id="workbench-remember" type="checkbox" checked={isRemembered} onChange={(event) => setRemembered(event.target.checked)} />
        <span>{isRemembered ? 'Saved in this browser' : 'Remember in this browser'}</span>
      </label>
      {!isRemembered && <span className="workbench-unsaved">Not saved. A reload starts over.</span>}
      {storageNotice !== null && <span className="workbench-unsaved" role="alert">{storageNotice}</span>}
    </div>
  );
}

export default function WorkbenchShell({ engineData, referenceData }: Props) {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const syncFromAddress = (): void => setRoute(readRoute());
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
      <div className="workbench-shell">
        <nav className="workbench-modes tm-no-print" aria-label="TARA Lab modes">
          {WORKBENCH_MODES.map((mode) => (
            <button
              key={mode.id} type="button" className="workbench-mode"
              aria-current={mode.id === route.modeId ? 'page' : undefined}
              onClick={() => openMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </nav>
        <FocusBar />
        {activeMode !== undefined && <p className="workbench-question tm-no-print">{activeMode.question}</p>}
        <ModeViews modeId={route.modeId} activeViewId={route.viewId} onSelectView={selectView}>
          <ModeErrorBoundary key={route.modeId} modeLabel={activeMode?.label ?? 'This mode'}>
            <Suspense fallback={<p className="workbench-question" role="status">Loading…</p>}>
              {ActiveComponent !== undefined && <ActiveComponent onOpenMode={openMode} />}
            </Suspense>
          </ModeErrorBoundary>
        </ModeViews>
      </div>
    </FocusProvider>
  );
}
