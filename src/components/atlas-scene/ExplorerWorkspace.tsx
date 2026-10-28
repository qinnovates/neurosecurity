import { Suspense, lazy, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ANATOMY_EVIDENCE_PATH } from '@/lib/anatomy/anatomy-index-types';
import { REGION_EVIDENCE_PATH } from '@/lib/anatomy/region-evidence-types';
import { announceLens, announceSelection } from '@/lib/atlas-explorer/announcements';
import { stageStepNumbers } from '@/lib/atlas-explorer/chain-steps';
import { isDevicesLayerShown, layersAtStart } from '@/lib/atlas-explorer/devices-layer';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { LENS_LABELS, type LensKind } from '@/lib/atlas-explorer/lens-state';
import { INITIAL_EXPLORER_STATE, explorerReducer } from './atlas-state';
import AtlasViewport, { VIEWPORT_HEADING_ID } from './AtlasViewport';
import ChainView from './ChainView';
import { loadAnatomyEvidence, loadRegionEvidence } from './explorer-companions';
import H01Card from './H01Card';
import LayerPanel from './LayerPanel';
import LensPanel from './LensPanel';
import LimitsPanel from './LimitsPanel';
import NetworkNames from './NetworkNames';
import { buildAtlasCoverage, buildRegionCoverage, describeCoverage } from './region-coverage';
import RegionInspector from './RegionInspector';
import SignalChainRail from './SignalChainRail';
import StructureList from './StructureList';
import { useChainView } from './use-chain-view';
import { useExplorerViews } from './use-explorer-views';
import { useLoaded } from './use-loaded';
import { readPrefersLessMotion } from './viewport-gate';

interface Props {
  model: ExplorerModel;
  /** Whether the index was checked against the digest the page was built with. The 3D view draws only then. */
  isIndexPinned: boolean;
  /** The page is pinned to an index the site no longer serves. */
  isOutOfStep?: boolean;
}

const TECHNIQUE_LENS = 'technique';
/** The electrode layout panel and the lead drawings: fetched when the visitor turns the layer on, so they add nothing to the first load. */
const DeviceGeometry = lazy(() => import('./DeviceGeometry'));
/** The width at which the list and the inspector stop sitting side by side. Matches atlas-scene.css. */
const STACKED_LAYOUT_QUERY = '(max-width: 960px)';
/** Where a selection came from: the list by keyboard, the list by pointer, or the picture. */
type SelectionSource = 'keyboard' | 'pointer' | 'picture';

/** Says a change out loud once it has happened. The first render announces nothing. */
function useAnnouncement(message: string): string {
  const [announcement, setAnnouncement] = useState('');
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setAnnouncement(message);
  }, [message]);
  return announcement;
}

/**
 * The explorer once its data has loaded, laid out around the picture.
 *
 * The brain is the subject of this page, so the picture stands inside the main
 * grid with the chosen region's details beside it: picking a region in the
 * picture no longer scrolls the answer off the screen. The lens bar spans both
 * columns above them, because it governs both. Under the picture is the region
 * list, which is the whole of this page for anyone the 3D view is gated for.
 * Then the layers of the 3D view, the device stages, network names and the
 * notes on limits. Tab order follows that reading order. One reducer holds the
 * state, and the selection survives every lens, layer and filter change.
 */
export default function ExplorerWorkspace({ model, isIndexPinned, isOutOfStep = false }: Props) {
  // The layers that start on follow the data: the electrode layout is off unless the index says it is shown by default.
  const [state, dispatch] = useReducer(explorerReducer, model.index, (index) => ({ ...INITIAL_EXPLORER_STATE, layers: layersAtStart(index, INITIAL_EXPLORER_STATE.layers) }));
  const [electrodeId, setElectrodeId] = useState<string | null>(null);
  const chainView = useChainView(model, useMemo(() => readPrefersLessMotion(), []));
  const stepNumbersByStage = useMemo(() => stageStepNumbers(chainView.frame), [chainView.frame]);
  // Stepping through a threat model puts the technique lens on the step's technique, so the list shows the same marks as the picture.
  const stepTechniqueId = chainView.frame === null || chainView.frame.isWhole ? null : chainView.frame.steps[0]?.techniqueId ?? null;
  useEffect(() => { if (stepTechniqueId !== null) dispatch({ type: 'lens_subject_chosen', kind: TECHNIQUE_LENS, subjectId: stepTechniqueId }); }, [stepTechniqueId, chainView.frame?.chainId]);
  const inspectorHeadingRef = useRef<HTMLHeadingElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const selectedRegionId = state.selection?.kind === 'region' ? state.selection.id : null;

  const { groups, allGroups, tally, detail, rail } = useExplorerViews(model, state);
  // Counted once over the whole index: the pane states it before a region is chosen, and scales its bars by it.
  const atlasCoverage = useMemo(() => buildAtlasCoverage(model), [model]);

  const loadQuotes = useCallback((signal: AbortSignal) => loadAnatomyEvidence(model, signal), [model]);
  const loadStatements = useCallback((signal: AbortSignal) => loadRegionEvidence(model, signal), [model]);
  const anatomyEvidence = useLoaded(loadQuotes, selectedRegionId !== null, ANATOMY_EVIDENCE_PATH);
  const regionEvidence = useLoaded(loadStatements, selectedRegionId !== null, REGION_EVIDENCE_PATH);

  const selectionAnnouncement = useAnnouncement(selectedRegionId === null ? '' : announceSelection(model, selectedRegionId));
  const lensAnnouncement = useAnnouncement(announceLens(model, state.lens, tally));
  // Said apart from the name, so what is heard on a selection is how much the atlas holds and not only which region it is.
  const coverageAnnouncement = useAnnouncement(detail === null ? '' : describeCoverage(buildRegionCoverage(model, detail, atlasCoverage)));

  /**
   * Focus moves to the inspector when a region is chosen from the keyboard, and also when a row is tapped on a narrow
   * screen, where the inspector lies below the whole list and the tap would otherwise change nothing the visitor can
   * see. A pick in the picture moves nothing: the picture names what it selected and offers the way to the details, so
   * the visitor is not carried away from the view they were using. The move waits for the inspector to show the chosen
   * region, so it lands on that region's heading and not on the one it replaces.
   */
  const [focusRequest, setFocusRequest] = useState<{ shouldScroll: boolean } | null>(null);
  const selectRegion = (regionId: string, source: SelectionSource): void => {
    dispatch({ type: 'target_selected', target: { kind: 'region', id: regionId } });
    if (source === 'picture') return;
    const isStacked = typeof window.matchMedia === 'function' && window.matchMedia(STACKED_LAYOUT_QUERY).matches;
    if (source === 'keyboard' || isStacked) setFocusRequest({ shouldScroll: isStacked });
  };
  const showDetails = (): void => setFocusRequest({ shouldScroll: true });
  useEffect(() => {
    if (focusRequest === null) return;
    inspectorHeadingRef.current?.focus({ preventScroll: focusRequest.shouldScroll });
    // Brought to the top of the screen, so the choice visibly lands on the region's details.
    if (focusRequest.shouldScroll) inspectorHeadingRef.current?.scrollIntoView?.({ block: 'start' });
  }, [focusRequest]);
  /** The way back from the details to the picture: the 3D view's heading, brought to the top of the screen. */
  const showViewport = (): void => {
    const heading = mainRef.current?.closest<HTMLElement>('.atlas-root')?.querySelector<HTMLElement>(`#${VIEWPORT_HEADING_ID}`) ?? null;
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView?.({ block: 'start' });
  };
  const chooseSubject = (kind: LensKind, subjectId: string): void => dispatch({ type: 'lens_subject_chosen', kind, subjectId });
  const focusSelectedRow = (): void => {
    const rows = [...(mainRef.current?.querySelectorAll<HTMLButtonElement>('[data-region-id]') ?? [])];
    (rows.find((row) => row.dataset.regionId === selectedRegionId) ?? rows[0])?.focus();
  };

  return (
    <div className="atlas-root atlas-workspace" data-lens={state.lens.kind}>
      <LensPanel
        model={model} lens={state.lens} tally={tally} onChooseKind={(kind) => dispatch({ type: 'lens_kind_chosen', kind })}
        onChooseSubject={chooseSubject} onSelectRegion={(regionId) => selectRegion(regionId, 'keyboard')}
      />
      <div className="atlas-main" ref={mainRef}>
        <div className="atlas-main-list">
          <AtlasViewport
            model={model} lens={state.lens} layers={state.layers} selectedRegionId={selectedRegionId} isIndexPinned={isIndexPinned} isOutOfStep={isOutOfStep}
            chain={chainView.frame} electrodeId={electrodeId} onPickElectrode={setElectrodeId} onSelectRegion={(regionId) => selectRegion(regionId, 'picture')} onShowDetails={showDetails}
          />
          {isDevicesLayerShown(model.index, state.layers) && (
            <Suspense fallback={<p className="atlas-loading" role="status">Loading the electrode layout…</p>}>
              <DeviceGeometry index={model.index} electrodeId={electrodeId} onPickElectrode={setElectrodeId} />
            </Suspense>
          )}
          <StructureList
            groups={groups} unfilteredGroups={allGroups} regionCount={model.regions.length} filter={state.filter} lensLabel={LENS_LABELS[state.lens.kind]} selectedRegionId={selectedRegionId}
            onFilter={(filter) => dispatch({ type: 'filter_changed', filter })} onClearFilter={() => dispatch({ type: 'filter_cleared' })} onSelect={(regionId, byKeyboard) => selectRegion(regionId, byKeyboard ? 'keyboard' : 'pointer')}
          />
        </div>
        <RegionInspector
          model={model} detail={detail} atlasCoverage={atlasCoverage} headingRef={inspectorHeadingRef} anatomyEvidence={anatomyEvidence.state} regionEvidence={regionEvidence.state}
          onRetryAnatomyEvidence={anatomyEvidence.retry} onRetryRegionEvidence={regionEvidence.retry}
          onChooseTechnique={(techniqueId) => chooseSubject(TECHNIQUE_LENS, techniqueId)} onChooseDevice={(deviceId) => chooseSubject('stated_targets', deviceId)}
          onSelectRegion={(regionId) => selectRegion(regionId, 'keyboard')} onBackToList={focusSelectedRow} onBackToView={showViewport}
        />
      </div>
      <LayerPanel layers={model.index.layers} sources={model.index.sources} requested={state.layers} onToggle={(layerId) => dispatch({ type: 'layer_toggled', layerId })} />
      <ChainView model={model} view={chainView} />
      <SignalChainRail
        rail={rail} includesMixed={state.railIncludesMixed} activeStageId={state.railStageId} stepNumbersByStage={stepNumbersByStage}
        chosenTechniqueId={state.lens.kind === 'technique' ? state.lens.techniqueId : null}
        onToggleStage={(stageId) => dispatch({ type: 'rail_stage_toggled', stageId })} onToggleMixed={() => dispatch({ type: 'rail_mixed_toggled' })}
        onChooseTechnique={(techniqueId) => chooseSubject(TECHNIQUE_LENS, techniqueId)}
      />
      <div className="atlas-footer-panels">
        <NetworkNames networks={model.networks} />
        <H01Card model={model} />
        <LimitsPanel model={model} />
      </div>
      <p className="sr-only" role="status" aria-live="polite" data-announce="selection">{selectionAnnouncement}</p>
      <p className="sr-only" role="status" aria-live="polite" data-announce="lens">{lensAnnouncement}</p>
      <p className="sr-only" role="status" aria-live="polite" data-announce="coverage">{coverageAnnouncement}</p>
    </div>
  );
}
