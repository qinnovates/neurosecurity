import { useState } from 'react';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { GeneratedChain } from '@/lib/threat-model/chain-types';
import { applyLens, type Lens } from '@/lib/threat-model/lens';
import type { ArchitectureView, ThreatModelReport } from '@/lib/threat-model/report-types';
import { countOpenRisksByElement } from '@/lib/threat-model/risk-register';
import { describeElement } from '@/lib/threat-model/stride';
import ArchitectureDiagram from './ArchitectureDiagram';
import ElementPanel from './ElementPanel';
import { VIEW_LABELS } from './ReportView';
import Tabs, { tabPanelProps } from './Tabs';

const VIEWS_ID = 'tm-views';

interface Props {
  report: ThreatModelReport;
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  lens: Lens;
  onLensChange: (lens: Lens) => void;
  selectedChain: GeneratedChain | null;
  onClearChain: () => void;
}

/**
 * The device itself, always on screen: the path from the patient outward. Selecting a
 * part narrows every section below to that part; selecting it again shows the whole device.
 */
export default function DeviceSpine({ report, techniqueById, lens, onLensChange, selectedChain, onClearChain }: Props) {
  const [activeView, setActiveView] = useState<ArchitectureView>('global_system');
  // Changing the key remounts the diagram, which restarts the step-by-step playback.
  const [replayCount, setReplayCount] = useState(0);
  const [isCollapsed, setCollapsed] = useState(false);
  const { model } = report;
  // A chain picked from the list has to be seen, so it opens a hidden diagram.
  const isDiagramShown = !isCollapsed || selectedChain !== null;

  const viewSelection = report.architectureViews.find((selection) => selection.view === activeView);
  const selectedOutcome = report.elementOutcomes.find((outcome) => outcome.elementId === lens.elementId);
  const chainMarkers = selectedChain?.steps.map((step) => ({ elementId: step.elementId, position: step.position })) ?? [];
  // A selected chain takes over the highlight so its path stands out from the rest of the system.
  const highlight = selectedChain !== null
    ? { componentIds: chainMarkers.map((marker) => marker.elementId), linkIds: chainMarkers.map((marker) => marker.elementId) }
    : viewSelection !== undefined && activeView !== 'global_system'
      ? { componentIds: viewSelection.highlightedComponentIds, linkIds: viewSelection.highlightedLinkIds }
      : null;
  // Heat follows the other lenses, so the diagram shows where the selected kind of risk sits.
  const rowsUnderLens = applyLens(report.riskRows, { ...lens, elementId: null });
  const selectElement = (elementId: string): void => onLensChange({ ...lens, elementId: lens.elementId === elementId ? null : elementId });

  return (
    <div className="tm-spine">
      <div className="tm-spine-bar">
        {isDiagramShown ? (
          <Tabs
            label="Architecture view" idPrefix={VIEWS_ID} activeId={activeView}
            tabs={report.architectureViews.map((selection) => ({ id: selection.view, label: VIEW_LABELS[selection.view] }))}
            onSelect={(view) => { setActiveView(view); onClearChain(); }}
          />
        ) : <span className="tm-muted tm-small">{model.name}: diagram hidden. The lenses below still apply.</span>}
        <button
          type="button" className="tm-button tm-spine-toggle" aria-expanded={isDiagramShown}
          aria-label={isDiagramShown ? 'Hide the device diagram' : 'Show the device diagram'}
          onClick={() => { if (isDiagramShown) onClearChain(); setCollapsed(isDiagramShown); }}
        >
          {isDiagramShown ? 'Hide' : 'Show diagram'}
        </button>
      </div>
      {isDiagramShown && (
      <section className="tm-card" {...tabPanelProps(VIEWS_ID, activeView)}>
        {selectedChain !== null ? (
          <p className="tm-muted">
            <span className="tm-badge tm-badge--generated">Generated hypothesis</span> Showing {selectedChain.chain_name}. Numbers mark the order of steps.{' '}
            <button type="button" className="tm-button" onClick={() => setReplayCount((count) => count + 1)}>Replay</button>{' '}
            <button type="button" className="tm-button" onClick={onClearChain}>Clear</button>
          </p>
        ) : (
          <p className="tm-muted">{viewSelection?.explanation} Select a part to narrow everything below to it.</p>
        )}
        <ArchitectureDiagram
          key={`${selectedChain?.chain_id ?? 'view'}-${replayCount}`}
          model={model}
          title={`${selectedChain !== null ? 'Attack chain hypothesis' : VIEW_LABELS[activeView]} of ${model.name}`}
          highlight={highlight}
          selectedElementId={lens.elementId}
          onSelectElement={selectElement}
          openRiskCounts={countOpenRisksByElement(rowsUnderLens, model.controlsInPlace)}
          chainMarkers={chainMarkers}
        />
      </section>
      )}
      {selectedOutcome !== undefined && lens.elementId !== null && (
        <details className="tm-spine-detail">
          <summary>Why these techniques are placed on {describeElement(model, lens.elementId)}</summary>
          <ElementPanel elementLabel={describeElement(model, lens.elementId)} outcome={selectedOutcome} techniqueById={techniqueById} />
        </details>
      )}
    </div>
  );
}
