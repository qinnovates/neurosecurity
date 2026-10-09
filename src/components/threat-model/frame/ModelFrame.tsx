import { useCallback, useRef } from 'react';
import Drawer from '@/components/lab-kit/Drawer';
import { useSequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import { useIsOffscreen } from '@/components/lab-kit/use-is-offscreen';
import { useFocus } from '@/components/workbench/FocusContext';
import type { ModeProps } from '@/components/workbench/mode-registry';
import { VIEW_STATE_KEYS } from '@/components/workbench/shell-targets';
import { useOpenTechnique } from '@/components/workbench/use-open-technique';
import { useViewState } from '@/components/workbench/ViewStateContext';
import { EMPTY_LENS, type Lens } from '@/lib/threat-model/lens';
import { countRowsByElement } from '@/lib/threat-model/register-counts';
import { describeLegacyControls } from '@/lib/threat-model/risk-register';
import { describeElement } from '@/lib/threat-model/stride';
import { isNeuralInterfaceElement, listTargetRegions } from '@/lib/threat-model/target-regions';
import DeviceCanvas from '../DeviceCanvas';
import DeviceEditor from '../editor/DeviceEditor';
import ElementPanel from '../ElementPanel';
import PartStrip from '../PartStrip';
import TargetRegionsPanel from '../TargetRegionsPanel';
import ModelFacets, { type ModelFacetId } from './ModelFacets';
import ModelHeader from './ModelHeader';
import ModelViews, { type ModelViewActions } from './ModelViews';
import { DIAGRAM_VIEW_IDS, FACET_VIEW_IDS, MODEL_STATE_KEYS, MODEL_VIEWS, isNullableChainId } from './model-view-keys';
import RiskDrawer from './RiskDrawer';
import { useModelData } from './use-model-data';
import { useModelLens } from './use-model-lens';
import { useRiskDrawer } from './use-risk-drawer';

/** Chains are generated along parts, so only the part narrows them. */
const CHAIN_FACET_IDS: readonly ModelFacetId[] = ['part'];
/** Views where a row's detail opens in place. From any other view the register is opened first. */
const DRAWER_VIEW_IDS: readonly string[] = [MODEL_VIEWS.risks, MODEL_VIEWS.techniquesByPart];
export const EDITOR_TITLE = 'Device editor';

/**
 * The Model mode's frame: the device's identity, the diagram and the filters on the views
 * they act on, the view the address names, and the two drawers (the device editor and the
 * detail of one risk). Everything a reader set is kept in view state under "model/".
 */
export default function ModelFrame({ viewId, onSelectView }: ModeProps) {
  const { state, report, engineData, techniqueById, isExampleDevice } = useFocus();
  const { model } = state;
  const { lens: heldLens, setLens } = useModelLens();
  const [isOpenOnly, setOpenOnly] = useViewState(MODEL_STATE_KEYS.isOpenOnly, false);
  const [isEditorOpen, setEditorOpen] = useViewState(VIEW_STATE_KEYS.modelEditorOpen, false);
  const [selectedChainId, setSelectedChainId] = useViewState<string | null>(MODEL_STATE_KEYS.selectedChainId, null, isNullableChainId);
  const data = useModelData(heldLens, isOpenOnly);
  const riskDrawer = useRiskDrawer(data.currentRows);
  const openTechnique = useOpenTechnique();
  const canvasRef = useRef<HTMLDivElement>(null);
  const isCanvasOffscreen = useIsOffscreen(canvasRef);

  const { lens } = data;
  const isOverview = viewId === MODEL_VIEWS.overview;
  const hasDiagram = DIAGRAM_VIEW_IDS.includes(viewId);
  const hasFacets = FACET_VIEW_IDS.includes(viewId);
  // A chain belongs to the Chains view: it is drawn on the diagram only there, and is still chosen on return.
  const selectedChain = viewId === MODEL_VIEWS.chains ? report.chainResult.chains.find((chain) => chain.chain_id === selectedChainId) ?? null : null;
  const chainPlayback = useSequencePlayback(selectedChain?.steps.length ?? 0);
  const selectedElementLabel = lens.elementId === null ? null : describeElement(model, lens.elementId);
  const selectedOutcome = report.elementOutcomes.find((outcome) => outcome.elementId === lens.elementId);
  const legacyControlsNotice = describeLegacyControls(model);

  const selectElement = useCallback((elementId: string): void => {
    setLens({ ...lens, elementId });
    onSelectView(MODEL_VIEWS.risks);
  }, [lens, setLens, onSelectView]);
  /** On the Overview the diagram shows the whole device; choosing a part there opens its rows. */
  const changeLensFromOverview = (next: Lens): void => {
    if (next.elementId !== null) selectElement(next.elementId);
  };
  const openRisk = useCallback((riskId: string): void => {
    riskDrawer.openRisk(riskId);
    if (!DRAWER_VIEW_IDS.includes(viewId)) onSelectView(MODEL_VIEWS.risks);
  }, [riskDrawer, viewId, onSelectView]);
  const actions: ModelViewActions = {
    onSelectElement: selectElement, onOpenRisk: openRisk, onDecideOnRow: riskDrawer.decideOnRow,
    onOpenTechnique: openTechnique, onSelectView, onSelectChain: setSelectedChainId,
  };

  const shownRisk = !isEditorOpen && DRAWER_VIEW_IDS.includes(viewId) ? riskDrawer.openedRisk : null;

  const diagram = hasDiagram && (
    <div ref={canvasRef} className="model-canvas-slot model-no-print" data-chain={selectedChain !== null}>
      <DeviceCanvas
        report={report} lens={isOverview ? EMPTY_LENS : lens} onLensChange={isOverview ? changeLensFromOverview : setLens}
        selectedChain={selectedChain} chainPlayback={chainPlayback} onClearChain={() => setSelectedChainId(null)}
        elementCounts={isOverview ? countRowsByElement(model, data.currentRows) : data.elementCounts}
      />
    </div>
  );

  return (
    <div className="model-frame" data-view={viewId} data-drawer={shownRisk !== null}>
      <ModelHeader model={model} report={report} isExampleDevice={isExampleDevice} isEditorOpen={isEditorOpen} onEditDevice={() => setEditorOpen(true)} />
      {legacyControlsNotice !== null && <p className="lab-notice">{legacyControlsNotice}</p>}
      {!isOverview && diagram}
      {hasFacets && isCanvasOffscreen && (
        <PartStrip model={model} lens={lens} openRiskCounts={data.openRiskCounts} onLensChange={setLens} />
      )}
      {hasFacets && (
        <ModelFacets
          lens={lens} onLensChange={setLens} isOpenOnly={isOpenOnly} onOpenOnlyChange={setOpenOnly} counts={data.facetCounts} gaps={data.gaps}
          elements={data.elements} techniqueName={lens.techniqueId === null ? null : techniqueById.get(lens.techniqueId)?.name ?? null}
          facetIds={viewId === MODEL_VIEWS.chains ? CHAIN_FACET_IDS : undefined}
        />
      )}
      {hasFacets && selectedElementLabel !== null && isNeuralInterfaceElement(model, lens.elementId) && (
        <div className="model-no-print">
          <TargetRegionsPanel summary={listTargetRegions(model, engineData.regions)} interfaceLabel={selectedElementLabel} />
        </div>
      )}
      {hasFacets && selectedElementLabel !== null && selectedOutcome !== undefined && (
        <ElementPanel elementLabel={selectedElementLabel} outcome={selectedOutcome} />
      )}
      <ModelViews
        viewId={viewId} data={data} actions={actions} diagram={diagram} openedRiskId={riskDrawer.openedRisk?.riskId ?? null}
        tableRef={riskDrawer.tableRef} selectedChain={selectedChain} chainPlayback={chainPlayback}
      />

      <Drawer isOpen={isEditorOpen} title={EDITOR_TITLE} onClose={() => setEditorOpen(false)}>
        <DeviceEditor />
      </Drawer>
      <RiskDrawer
        row={shownRisk} report={report} techniqueById={techniqueById}
        pendingStatus={riskDrawer.pendingStatus} onDecide={riskDrawer.decide} onOpenTechnique={openTechnique} onClose={riskDrawer.closeRisk}
      />
    </div>
  );
}
