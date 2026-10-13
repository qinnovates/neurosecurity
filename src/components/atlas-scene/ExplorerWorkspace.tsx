import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ANATOMY_EVIDENCE_PATH } from '@/lib/anatomy/anatomy-index-types';
import { REGION_EVIDENCE_PATH } from '@/lib/anatomy/region-evidence-types';
import { announceLens, announceSelection } from '@/lib/atlas-explorer/announcements';
import type { ExplorerModel } from '@/lib/atlas-explorer/explorer-model';
import { LENS_LABELS, type LensKind } from '@/lib/atlas-explorer/lens-state';
import { INITIAL_EXPLORER_STATE, explorerReducer } from './atlas-state';
import { loadAnatomyEvidence, loadRegionEvidence } from './explorer-data';
import H01Card from './H01Card';
import LayerPanel from './LayerPanel';
import LensPanel from './LensPanel';
import LimitsPanel from './LimitsPanel';
import NetworkNames from './NetworkNames';
import RegionInspector from './RegionInspector';
import SignalChainRail from './SignalChainRail';
import StructureList from './StructureList';
import { useExplorerViews } from './use-explorer-views';
import { useLoaded } from './use-loaded';

interface Props {
  model: ExplorerModel;
}

const TECHNIQUE_LENS = 'technique';
/** The width at which the list and the inspector stop sitting side by side. Matches atlas-scene.css. */
const STACKED_LAYOUT_QUERY = '(max-width: 960px)';

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
 * The explorer once its data has loaded. What people come for is first: the
 * lens and the region list, with the selected region's details beside them.
 * Then the layers of the 3D view, the device stages, network names and the
 * notes on limits. Tab order follows that reading order. One reducer holds the state, and the
 * selection survives every lens, layer and filter change.
 */
export default function ExplorerWorkspace({ model }: Props) {
  const [state, dispatch] = useReducer(explorerReducer, INITIAL_EXPLORER_STATE);
  const inspectorHeadingRef = useRef<HTMLHeadingElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const selectedRegionId = state.selection?.kind === 'region' ? state.selection.id : null;

  const { groups, tally, detail, rail } = useExplorerViews(model, state);

  const loadQuotes = useCallback((signal: AbortSignal) => loadAnatomyEvidence(model, signal), [model]);
  const loadStatements = useCallback((signal: AbortSignal) => loadRegionEvidence(model, signal), [model]);
  const anatomyEvidence = useLoaded(loadQuotes, selectedRegionId !== null, ANATOMY_EVIDENCE_PATH);
  const regionEvidence = useLoaded(loadStatements, selectedRegionId !== null, REGION_EVIDENCE_PATH);

  const selectionAnnouncement = useAnnouncement(selectedRegionId === null ? '' : announceSelection(model, selectedRegionId));
  const lensAnnouncement = useAnnouncement(announceLens(model, state.lens, tally));

  /**
   * Focus moves to the inspector when a region is chosen from the keyboard, and also on a narrow screen, where the
   * inspector lies below the whole list and a tap would otherwise change nothing the visitor can see. The move waits
   * for the inspector to show the chosen region, so it lands on that region's heading and not on the one it replaces.
   */
  const [focusRequest, setFocusRequest] = useState<{ isStacked: boolean } | null>(null);
  const selectRegion = (regionId: string, byKeyboard: boolean): void => {
    dispatch({ type: 'target_selected', target: { kind: 'region', id: regionId } });
    const isStacked = typeof window.matchMedia === 'function' && window.matchMedia(STACKED_LAYOUT_QUERY).matches;
    if (byKeyboard || isStacked) setFocusRequest({ isStacked });
  };
  useEffect(() => {
    if (focusRequest === null) return;
    inspectorHeadingRef.current?.focus({ preventScroll: focusRequest.isStacked });
    // Stacked, the inspector is brought to the top of the screen, so the tap visibly lands on the region's details.
    if (focusRequest.isStacked) inspectorHeadingRef.current?.scrollIntoView?.({ block: 'start' });
  }, [focusRequest]);
  const chooseSubject = (kind: LensKind, subjectId: string): void => dispatch({ type: 'lens_subject_chosen', kind, subjectId });
  const focusSelectedRow = (): void => {
    const rows = [...(mainRef.current?.querySelectorAll<HTMLButtonElement>('[data-region-id]') ?? [])];
    (rows.find((row) => row.dataset.regionId === selectedRegionId) ?? rows[0])?.focus();
  };

  return (
    <div className="atlas-root" data-lens={state.lens.kind}>
      <div className="atlas-main" ref={mainRef}>
        <div className="atlas-main-list">
          <LensPanel
            model={model} lens={state.lens} tally={tally} onChooseKind={(kind) => dispatch({ type: 'lens_kind_chosen', kind })}
            onChooseSubject={chooseSubject} onSelectRegion={(regionId) => selectRegion(regionId, true)}
          />
          <StructureList
            groups={groups} regionCount={model.regions.length} filter={state.filter} lensLabel={LENS_LABELS[state.lens.kind]} selectedRegionId={selectedRegionId}
            onFilter={(filter) => dispatch({ type: 'filter_changed', filter })} onClearFilter={() => dispatch({ type: 'filter_cleared' })} onSelect={selectRegion}
          />
        </div>
        <RegionInspector
          detail={detail} headingRef={inspectorHeadingRef} anatomyEvidence={anatomyEvidence.state} regionEvidence={regionEvidence.state}
          onRetryAnatomyEvidence={anatomyEvidence.retry} onRetryRegionEvidence={regionEvidence.retry}
          onChooseTechnique={(techniqueId) => chooseSubject(TECHNIQUE_LENS, techniqueId)} onChooseDevice={(deviceId) => chooseSubject('stated_targets', deviceId)}
          onBackToList={focusSelectedRow}
        />
      </div>
      <LayerPanel layers={model.index.layers} sources={model.index.sources} requested={state.layers} onToggle={(layerId) => dispatch({ type: 'layer_toggled', layerId })} />
      <SignalChainRail
        rail={rail} includesMixed={state.railIncludesMixed} activeStageId={state.railStageId}
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
    </div>
  );
}
