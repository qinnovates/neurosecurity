import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useIsOffscreen } from '@/components/lab-kit/use-is-offscreen';
import { useMediaQuery } from '@/components/lab-kit/use-media-query';
import { useFocus } from '@/components/workbench/FocusContext';
import type { DeviceModel, RiskStatus } from '@/lib/threat-model/device-model';
import { DeviceModelFormatError } from '@/lib/threat-model/errors';
import type { IntakeAnswers } from '@/lib/threat-model/intake-to-model';
import { EMPTY_LENS, applyLens, countOpenRisks, type Lens } from '@/lib/threat-model/lens';
import { summarisePlacementCoverage } from '@/lib/threat-model/placement-coverage';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS } from '@/lib/threat-model/report-types';
import { buildRegisterCsv } from '@/lib/threat-model/register-csv';
import { countOpenRisksByElement } from '@/lib/threat-model/risk-register';
import { describeElement } from '@/lib/threat-model/stride';
import { isNeuralInterfaceElement, listTargetRegions } from '@/lib/threat-model/target-regions';
import BeyondDevice from './BeyondDevice';
import ChainList from './ChainList';
import ComplianceChecklist from './ComplianceChecklist';
import DeviceCanvas from './DeviceCanvas';
import IntakeForm from './IntakeForm';
import LensBar, { isGoalNotAssessed } from './LensBar';
import ModelInspector from './ModelInspector';
import { downloadModelFile, downloadRegisterCsv, readModelFile } from './model-file-io';
import PartStrip from './PartStrip';
import ReplaceDeviceConfirm from './ReplaceDeviceConfirm';
import ReportView from './ReportView';
import RiskDetail from './RiskDetail';
import RisksSection from './RisksSection';
import Tabs, { tabPanelProps, type TabItem } from './Tabs';
import TargetRegionsPanel from './TargetRegionsPanel';
import ThreatMatrix from './ThreatMatrix';
import './threat-model.css';
import './model-layout.css';

type SectionId = 'register' | 'map' | 'chains' | 'beyond' | 'requirements' | 'report';

const SECTION_TABS: readonly TabItem<SectionId>[] = [
  { id: 'register', label: 'Risks' },
  { id: 'map', label: 'Attack map' },
  { id: 'chains', label: 'Attack chains' },
  { id: 'beyond', label: 'Around the device' },
  { id: 'requirements', label: 'US requirements' },
  { id: 'report', label: 'Full report' },
];
const SECTIONS_ID = 'tm-sections';
/** At this width and above the diagram is always shown; below it, the diagram folds behind the row of parts. */
const WIDE_SCREEN_QUERY = '(min-width: 721px)';
const UNEXPECTED_IMPORT_ERROR = 'The model file could not be loaded: an unexpected problem occurred while reading it.';

/** A device change that is waiting for the user to confirm, because it would discard their work. */
type PendingReplacement =
  | { kind: 'preset'; archetype: DeviceArchetype }
  | { kind: 'import'; model: DeviceModel };

/** The Model mode: describe the device in focus, then read what applies to it. */
export default function ThreatModelStudio() {
  const { state, dispatch, report, engineData, referenceData, techniqueById, hasWork } = useFocus();
  const { archetypes } = referenceData;
  const { registrarVersion } = engineData;
  const [activeSection, setActiveSection] = useState<SectionId>('register');
  const [lens, setLens] = useState<Lens>(EMPTY_LENS);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [openedRiskId, setOpenedRiskId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingReplacement, setPendingReplacement] = useState<PendingReplacement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // The form opens as a panel beside the work and closes again, so the diagram and risks start at the top.
  const [isEditorOpen, setEditorOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isWideScreen = useMediaQuery(WIDE_SCREEN_QUERY);
  const isCanvasOffscreen = useIsOffscreen(canvasRef);

  const regionById = useMemo(() => new Map(engineData.regions.map((region) => [region.id, region])), [engineData]);
  const archetype = archetypes.find((candidate) => candidate.id === state.archetypeId) ?? null;
  const { model } = state;

  // A part that no longer exists, after the device changed, stops narrowing the view.
  const hasSelectedElement = lens.elementId !== null
    && (model.components.some((component) => component.id === lens.elementId) || model.links.some((link) => link.id === lens.elementId));
  const activeLens = useMemo<Lens>(() => (hasSelectedElement ? lens : { ...lens, elementId: null }), [lens, hasSelectedElement]);

  const rowsInView = useMemo(() => applyLens(report.riskRows, activeLens), [report.riskRows, activeLens]);
  const lensCounts = useMemo(() => countOpenRisks(report.riskRows, activeLens, model.controlsInPlace), [report.riskRows, activeLens, model.controlsInPlace]);
  const chainsInView = useMemo(() => {
    const { elementId } = activeLens;
    if (elementId === null) return report.chainResult;
    return { ...report.chainResult, chains: report.chainResult.chains.filter((chain) => chain.steps.some((step) => step.elementId === elementId)) };
  }, [report.chainResult, activeLens]);
  const selectedChain = report.chainResult.chains.find((chain) => chain.chain_id === selectedChainId) ?? null;
  const targetRegions = useMemo(() => listTargetRegions(model, engineData.regions), [model, engineData.regions]);
  const isInterfaceSelected = isNeuralInterfaceElement(model, activeLens.elementId);
  const regionNames = model.targetRegionIds.map((regionId) => regionById.get(regionId)?.name ?? regionId);
  // Counts per part follow the other lenses, on the diagram and on the row of parts alike.
  const openRiskCounts = useMemo(
    () => countOpenRisksByElement(applyLens(report.riskRows, { ...activeLens, elementId: null }), model.controlsInPlace),
    [report.riskRows, activeLens, model.controlsInPlace],
  );
  const coverage = useMemo(() => {
    const techniqueIdsOnDevice = new Set(report.riskRows.flatMap((row) => (row.source === 'catalog' && row.techniqueId !== null ? [row.techniqueId] : [])));
    return summarisePlacementCoverage(engineData.techniques, referenceData.placementRules, techniqueIdsOnDevice);
  }, [report.riskRows, engineData.techniques, referenceData.placementRules]);
  const notAssessedGoals = THREAT_GOALS.filter((goal) => isGoalNotAssessed(goal, activeLens, lensCounts, report.goalCoverage));
  const selectedOutcome = report.elementOutcomes.find((outcome) => outcome.elementId === activeLens.elementId);
  const selectedElementLabel = activeLens.elementId === null ? null : describeElement(model, activeLens.elementId);
  const toggleEditor = (): void => setEditorOpen((isOpen) => !isOpen);
  // A risk that no longer exists, after the device changed, closes its own panel.
  const openedRisk = report.riskRows.find((row) => row.riskId === openedRiskId) ?? null;
  const openedRiskOutcome = report.elementOutcomes.find((outcome) => outcome.elementId === openedRisk?.elementId);
  const openedRiskReasons = openedRiskOutcome?.kind === 'matched'
    ? openedRiskOutcome.matches.find((match) => match.techniqueId === openedRisk?.techniqueId)?.reasons.map((reason) => reason.detail) ?? []
    : [];
  /** Closing returns to the row the panel was opened from, so a keyboard reader keeps their place. */
  const closeRisk = (): void => {
    const rowSelector = openedRiskId === null ? null : `[data-reflow-key="${CSS.escape(openedRiskId)}"]`;
    setOpenedRiskId(null);
    if (rowSelector !== null) document.querySelector<HTMLElement>(rowSelector)?.focus();
  };

  const applyReplacement = (replacement: PendingReplacement): void => {
    setSelectedChainId(null);
    setPendingReplacement(null);
    setLens(EMPTY_LENS);
    if (replacement.kind === 'preset') dispatch({ type: 'preset-selected', archetype: replacement.archetype, registrarVersion });
    else dispatch({ type: 'model-imported', model: replacement.model });
  };
  /** Replaces the device at once when nothing would be lost; otherwise asks first. */
  const requestReplacement = (replacement: PendingReplacement): void => {
    if (hasWork) setPendingReplacement(replacement);
    else applyReplacement(replacement);
  };
  const changeAnswers = (answers: IntakeAnswers): void => {
    if (archetype !== null) dispatch({ type: 'answers-changed', archetype, answers, registrarVersion });
  };
  const decideRisk = (riskId: string, status: RiskStatus, note: string): void => dispatch({ type: 'risk-decided', riskId, status, note });
  const toggleControl = (control: string): void => dispatch({ type: 'control-toggled', control });

  const importModel = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) return;
    try {
      const imported = await readModelFile(file, new Set(regionById.keys()));
      setImportError(null);
      requestReplacement({ kind: 'import', model: imported });
    } catch (error) {
      // Only the parser's own messages are shown; they never echo file content.
      setImportError(error instanceof DeviceModelFormatError ? error.message : UNEXPECTED_IMPORT_ERROR);
    }
  };

  const canvas = (
    <DeviceCanvas
      report={report} lens={activeLens} onLensChange={setLens}
      selectedChain={selectedChain} onClearChain={() => setSelectedChainId(null)}
      isEditorOpen={isEditorOpen} onToggleEditor={toggleEditor}
    />
  );

  return (
    <div className="tm-root model-layout" data-editor={isEditorOpen}>
      {isEditorOpen && (
        <aside className="tm-no-print" aria-label="Device editor">
          {pendingReplacement !== null && (
            <ReplaceDeviceConfirm
              currentName={model.name} decisionCount={model.riskDecisions.length}
              replacementLabel={pendingReplacement.kind === 'preset' ? pendingReplacement.archetype.label : 'the model from your file'}
              onReplace={() => applyReplacement(pendingReplacement)} onKeep={() => setPendingReplacement(null)}
            />
          )}
          <IntakeForm
            archetypes={archetypes} regions={engineData.regions} archetype={archetype} answers={state.answers}
            onSelectPreset={(selected) => requestReplacement({ kind: 'preset', archetype: selected })} onChangeAnswers={changeAnswers}
          />
          <section className="tm-card" aria-labelledby="tm-files-heading">
            <h2 className="tm-heading" id="tm-files-heading">Save and load</h2>
            <div className="tm-actions">
              <button type="button" className="tm-button" onClick={() => downloadModelFile(model)}>Save model file</button>
              <button type="button" className="tm-button" onClick={() => fileInputRef.current?.click()}>Load model file</button>
              <button type="button" className="tm-button" onClick={() => downloadRegisterCsv(model, buildRegisterCsv(report.riskRows))}>Export register (CSV)</button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={(event) => { void importModel(event); }} />
            {importError !== null && <p className="tm-error" role="alert">{importError}</p>}
            <p className="tm-muted tm-small" style={{ marginTop: '0.625rem' }}>Files are created and read in your browser. Nothing is uploaded.</p>
          </section>
        </aside>
      )}

      <div className="model-main">
        {!isWideScreen && (
          <div className="tm-actions tm-no-print">
            <button type="button" className="tm-button" aria-expanded={isEditorOpen} onClick={toggleEditor}>
              {isEditorOpen ? 'Close device editor' : `Edit device: ${model.name}`}
            </button>
          </div>
        )}
        <div ref={canvasRef} className="tm-no-print">
          {/* A narrow screen starts on the risks; the diagram is one press away, and opens by itself to show a chain. */}
          {isWideScreen || selectedChain !== null ? canvas : (
            <details className="model-diagram-fold">
              <summary>Show the device diagram</summary>
              {canvas}
            </details>
          )}
        </div>
        {(!isWideScreen || isCanvasOffscreen) && (
          <PartStrip model={model} lens={activeLens} openRiskCounts={openRiskCounts} onLensChange={setLens} />
        )}
        <LensBar
          lens={activeLens} counts={lensCounts} goalCoverage={report.goalCoverage} onChange={setLens}
          selectedElementLabel={selectedElementLabel}
        />
        <Tabs label="Threat model sections" idPrefix={SECTIONS_ID} tabs={SECTION_TABS} activeId={activeSection} onSelect={setActiveSection} />
        {isInterfaceSelected && selectedElementLabel !== null && (
          <div className="tm-no-print">
            <TargetRegionsPanel summary={targetRegions} interfaceLabel={selectedElementLabel} />
          </div>
        )}
        <div {...tabPanelProps(SECTIONS_ID, activeSection)}>
          {activeSection === 'register' && (
            <RisksSection rows={rowsInView} controlsInPlace={model.controlsInPlace} onDecide={decideRisk} onOpenRisk={setOpenedRiskId} />
          )}
          {activeSection === 'map' && <section className="tm-card"><ThreatMatrix rows={rowsInView} /></section>}
          {activeSection === 'chains' && <ChainList chainResult={chainsInView} selectedChainId={selectedChainId} onSelectChain={setSelectedChainId} />}
          {activeSection === 'beyond' && <BeyondDevice ambientThreats={report.ambientThreats} themes={report.themes} />}
          {activeSection === 'requirements' && <ComplianceChecklist assessment={report.cyberDeviceAssessment} items={report.complianceItems} />}
          {activeSection === 'report' && (
            <>
              <div className="tm-actions tm-no-print" style={{ marginBottom: '1rem' }}>
                <button type="button" className="tm-button tm-button--primary" onClick={() => window.print()}>Print or save as PDF</button>
              </div>
              <ReportView report={report} regionNames={regionNames} />
            </>
          )}
        </div>
      </div>

      <aside className="model-inspector tm-no-print" aria-label="Coverage, the selected part and the opened risk">
        <ModelInspector
          coverage={coverage} notAssessedGoals={notAssessedGoals} goalCoverage={report.goalCoverage} techniqueById={techniqueById}
          selected={selectedOutcome !== undefined && selectedElementLabel !== null ? { label: selectedElementLabel, outcome: selectedOutcome } : null}
        >
          {openedRisk !== null && (
            <RiskDetail
              row={openedRisk} technique={openedRisk.techniqueId === null ? undefined : techniqueById.get(openedRisk.techniqueId)}
              placementReasons={openedRiskReasons} precedentCvesAsOf={report.precedentCvesAsOf}
              precedentCves={report.precedentCves.filter((cve) => openedRisk.precedentCveIds.includes(cve.cveId))}
              controlsInPlace={model.controlsInPlace} onDecide={decideRisk} onToggleControl={toggleControl} onClose={closeRisk}
            />
          )}
        </ModelInspector>
      </aside>
    </div>
  );
}
