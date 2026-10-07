import { useMemo, useState, type CSSProperties } from 'react';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import type { GeneratedChain } from '@/lib/threat-model/chain-types';
import { applyLens, type Lens } from '@/lib/threat-model/lens';
import { derivePayloadFlows } from '@/lib/threat-model/payload-flow';
import { LINK_PAYLOADS } from '@/lib/threat-model/reference-data-types';
import type { ArchitectureView, ThreatModelReport } from '@/lib/threat-model/report-types';
import { countOpenRisksByElement } from '@/lib/threat-model/risk-register';
import ArchitectureDiagram, { PAYLOAD_LABELS } from './ArchitectureDiagram';
import { VIEW_LABELS } from './ReportView';
import Tabs, { tabPanelProps } from './Tabs';

const VIEWS_ID = 'tm-views';
/** Width the diagram keeps per trust zone, so part names stay readable however many zones the device spans. */
const DIAGRAM_REM_PER_ZONE = 11;

interface Props {
  report: ThreatModelReport;
  lens: Lens;
  onLensChange: (lens: Lens) => void;
  selectedChain: GeneratedChain | null;
  /** Where the selected chain's playback has got to; the diagram follows it. */
  chainPlayback: SequencePlayback;
  onClearChain: () => void;
  isEditorOpen: boolean;
  onToggleEditor: () => void;
}

/**
 * The device itself: the path from the patient outward, with what each connection carries.
 * Selecting a part narrows every section below to that part; selecting it again shows the whole device.
 */
export default function DeviceCanvas({ report, lens, onLensChange, selectedChain, chainPlayback, onClearChain, isEditorOpen, onToggleEditor }: Props) {
  const [activeView, setActiveView] = useState<ArchitectureView>('global_system');
  const { model } = report;

  const payloadFlows = useMemo(() => derivePayloadFlows(model), [model]);
  const payloadsShown = LINK_PAYLOADS.filter((payload) => [...payloadFlows.values()].some((flows) => flows.some((flow) => flow.payload === payload)));
  const viewSelection = report.architectureViews.find((selection) => selection.view === activeView);
  const chainMarkers = selectedChain?.steps.map((step) => ({ elementId: step.elementId, position: step.position })) ?? [];
  // A selected chain takes over the highlight so its path stands out from the rest of the system.
  const highlight = selectedChain !== null
    ? { componentIds: chainMarkers.map((marker) => marker.elementId), linkIds: chainMarkers.map((marker) => marker.elementId) }
    : viewSelection !== undefined && activeView !== 'global_system'
      ? { componentIds: viewSelection.highlightedComponentIds, linkIds: viewSelection.highlightedLinkIds }
      : null;
  // Counts follow the other lenses, so the diagram shows where the selected kind of risk sits.
  const rowsUnderLens = applyLens(report.riskRows, { ...lens, elementId: null });
  const zoneCount = new Set(model.components.map((component) => component.trustZone)).size;
  const selectElement = (elementId: string): void => onLensChange({ ...lens, elementId: lens.elementId === elementId ? null : elementId });

  return (
    <section className="lab-panel model-canvas" aria-label="Device diagram">
      <div className="model-canvas-bar">
        <Tabs
          label="Architecture view" idPrefix={VIEWS_ID} activeId={activeView}
          tabs={report.architectureViews.map((selection) => ({ id: selection.view, label: VIEW_LABELS[selection.view] }))}
          onSelect={(view) => { setActiveView(view); onClearChain(); }}
        />
        <button type="button" className="tm-button" aria-expanded={isEditorOpen} onClick={onToggleEditor}>
          {isEditorOpen ? 'Close device editor' : 'Edit device'}
        </button>
      </div>
      <div {...tabPanelProps(VIEWS_ID, activeView)}>
        {selectedChain !== null ? (
          <p className="model-canvas-note">
            <span className="tm-badge tm-badge--generated">Generated hypothesis</span> {selectedChain.chain_name}. A path through this model exists; that is not evidence the attack has been carried out.{' '}
            <button type="button" className="tm-button" onClick={onClearChain}>Clear</button>
          </p>
        ) : (
          <p className="model-canvas-note lab-soft">{viewSelection?.explanation} Select a part to narrow everything below to it.</p>
        )}
        <div className="model-canvas-scroll" style={{ '--model-diagram-min-width': `${zoneCount * DIAGRAM_REM_PER_ZONE}rem` } as CSSProperties}>
          <ArchitectureDiagram
            model={model}
            title={`${selectedChain !== null ? 'Attack chain hypothesis' : VIEW_LABELS[activeView]} of ${model.name}`}
            highlight={highlight}
            selectedElementId={lens.elementId}
            onSelectElement={selectElement}
            openRiskCounts={countOpenRisksByElement(rowsUnderLens, model.controlsInPlace)}
            chainSteps={chainMarkers}
            reachedStepCount={selectedChain !== null && (chainPlayback.isPlaying || chainPlayback.reached < chainMarkers.length) ? chainPlayback.reached : undefined}
            payloadFlows={payloadFlows}
          />
        </div>
      </div>
      {payloadsShown.length > 0 && (
        <p className="model-canvas-legend lab-soft">
          {payloadsShown.map((payload) => (
            <span key={payload} className="model-legend-item">
              <svg viewBox="0 0 30 8" width="30" height="8" aria-hidden="true"><path className="tm-track" data-payload={payload} data-direction="none" d="M 2 4 H 28" /></svg>
              {PAYLOAD_LABELS[payload]}
            </span>
          ))}
          <span>Direction is derived: neural data moves away from the part in contact with tissue; commands and updates move toward it.</span>
        </p>
      )}
    </section>
  );
}
