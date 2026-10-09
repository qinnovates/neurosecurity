import { useId, useMemo, type ReactNode } from 'react';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import PlaybackTransport from '@/components/lab-kit/PlaybackTransport';
import Segmented from '@/components/lab-kit/Segmented';
import { useViewState } from '@/components/workbench/ViewStateContext';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { GeneratedChain } from '@/lib/threat-model/chain-types';
import { applyLens, type Lens } from '@/lib/threat-model/lens';
import { countRowsByElement, type ElementRowCounts } from '@/lib/threat-model/register-counts';
import { ARCHITECTURE_VIEWS, type ArchitectureView, type ThreatModelReport } from '@/lib/threat-model/report-types';
import ArchitectureDiagram from './ArchitectureDiagram';
import { HYPOTHESIS_LABEL } from './chain-labels';
import { VIEW_LABELS } from './report/report-sections';

const DEFAULT_VIEW: ArchitectureView = 'global_system';
/** Under "model/", so the choice is forgotten when the device is replaced. */
const VIEW_STATE_KEY = 'model/architecture-view';

/** Under "model/" as well: whether the explanation of the marks is shown under the drawing. */
const LEGEND_STATE_KEY = 'model/diagram-legend-open';
export const DIAGRAM_TOGGLE_LABEL = 'Diagram';
export const LEGEND_TOGGLE_LABEL = 'Legend';
const CHAIN_PLAYBACK_LABEL = 'Chain playback';

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isArchitectureView(value: unknown): value is ArchitectureView {
  return ARCHITECTURE_VIEWS.some((view) => view === value);
}

interface Props {
  report: ThreatModelReport;
  lens: Lens;
  onLensChange: (lens: Lens) => void;
  selectedChain: GeneratedChain | null;
  /** Where the selected chain's playback has got to; the diagram follows it. */
  chainPlayback: SequencePlayback;
  onClearChain: () => void;
  /**
   * Rows per part and connection for the badges, as `countRowsByElement` returns them. When
   * absent the counts are taken here from the report's rows under the lens.
   */
  elementCounts?: readonly ElementRowCounts[];
  /** The catalog's techniques, so a band lens narrows the counts taken here. Not needed when `elementCounts` is given. */
  techniques?: readonly Pick<CatalogTechnique, 'id' | 'bandIds'>[];
  /** False folds the drawing away and leaves the bar. Leave out where the diagram cannot be folded. */
  isOpen?: boolean;
  /** When given, the bar carries the control that folds and unfolds the drawing. */
  onToggleOpen?: () => void;
  /** Shown in the bar while the drawing is folded away: what stands in for it. */
  folded?: ReactNode;
}

interface DisclosureProps {
  label: string;
  isExpanded: boolean;
  controlsId: string;
  onToggle: () => void;
}

/** A quiet button that shows or hides the region it names. The chevron turns; nothing else moves. */
function Disclosure({ label, isExpanded, controlsId, onToggle }: DisclosureProps) {
  return (
    <button type="button" className="lab-diagram-disclosure" aria-expanded={isExpanded} aria-controls={controlsId} onClick={onToggle}>
      <svg className="lab-diagram-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5 L7 5 L3 8.5" /></svg>
      {label}
    </button>
  );
}

/**
 * The device itself: the path from the patient outward, with what each connection carries
 * and a badge on every part and connection. Selecting one narrows the rows to it; selecting
 * it again shows the whole device. The explanation of its marks waits behind "Legend", and
 * on a working screen the drawing folds away so the rows under it take the room.
 */
export default function DeviceCanvas({
  report, lens, onLensChange, selectedChain, chainPlayback, onClearChain, elementCounts, techniques, isOpen = true, onToggleOpen, folded,
}: Props) {
  const [activeView, setActiveView] = useViewState<ArchitectureView>(VIEW_STATE_KEY, DEFAULT_VIEW, isArchitectureView);
  const [isLegendOpen, setLegendOpen] = useViewState<boolean>(LEGEND_STATE_KEY, false, isBoolean);
  const bodyId = useId();
  const legendId = useId();
  const { model } = report;

  const viewSelection = report.architectureViews.find((selection) => selection.view === activeView);
  const chainMarkers = selectedChain?.steps.map((step) => ({ elementId: step.elementId, position: step.position })) ?? [];
  // A selected chain takes over the highlight so its path stands out from the rest of the system.
  const highlight = selectedChain !== null
    ? { componentIds: chainMarkers.map((marker) => marker.elementId), linkIds: chainMarkers.map((marker) => marker.elementId) }
    : viewSelection !== undefined && activeView !== DEFAULT_VIEW
      ? { componentIds: viewSelection.highlightedComponentIds, linkIds: viewSelection.highlightedLinkIds }
      : null;
  // Counts follow the other lenses, so the diagram shows where the selected kind of risk sits.
  const countsUnderLens = useMemo(
    () => elementCounts ?? countRowsByElement(model, applyLens(report.riskRows, { ...lens, elementId: null }, { model, techniques: techniques ?? [] })),
    [elementCounts, model, report.riskRows, lens, techniques],
  );
  // "Not assessed" is a fact about the whole register, not about what a filter leaves.
  const notAssessedElementIds = useMemo(
    () => new Set(countRowsByElement(model, report.riskRows).filter((counts) => counts.catalogRows === 0).map((counts) => counts.id)),
    [model, report.riskRows],
  );
  const selectElement = (elementId: string): void => onLensChange({ ...lens, elementId: lens.elementId === elementId ? null : elementId });
  const isPlaying = selectedChain !== null && (chainPlayback.isPlaying || chainPlayback.reached < chainMarkers.length);

  return (
    <section className="lab-panel lab-diagram-panel" aria-label="Device diagram" data-open={isOpen}>
      <div className="lab-diagram-bar">
        {onToggleOpen !== undefined && <Disclosure label={DIAGRAM_TOGGLE_LABEL} isExpanded={isOpen} controlsId={bodyId} onToggle={onToggleOpen} />}
        {!isOpen && folded}
        {isOpen && selectedChain === null && report.architectureViews.length > 1 && (
          <Segmented
            label="Architecture view" value={activeView}
            options={report.architectureViews.map((selection) => ({ value: selection.view, label: VIEW_LABELS[selection.view] }))}
            onChange={(view) => { setActiveView(view); onClearChain(); }}
          />
        )}
        {selectedChain !== null && (
          <div className="lab-diagram-chain">
            <span className="lab-diagram-hypothesis">{HYPOTHESIS_LABEL}</span>
            <span className="lab-diagram-chain-name" title={selectedChain.chain_name}>{selectedChain.chain_name}</span>
            <PlaybackTransport playback={chainPlayback} stepCount={selectedChain.steps.length} label={CHAIN_PLAYBACK_LABEL} />
            <button type="button" className="lab-button" onClick={onClearChain}>Clear</button>
          </div>
        )}
        {isOpen && <span className="lab-diagram-bar-end"><Disclosure label={LEGEND_TOGGLE_LABEL} isExpanded={isLegendOpen} controlsId={legendId} onToggle={() => setLegendOpen(!isLegendOpen)} /></span>}
      </div>
      <div id={bodyId} className="lab-diagram-body" hidden={!isOpen}>
        {isOpen && (
          <ArchitectureDiagram
            model={model}
            title={`${selectedChain !== null ? 'Attack chain hypothesis' : VIEW_LABELS[activeView]} of ${model.name}`}
            highlight={highlight}
            selectedElementId={lens.elementId}
            onSelectElement={selectElement}
            elementCounts={countsUnderLens}
            notAssessedElementIds={notAssessedElementIds}
            chainSteps={chainMarkers}
            reachedStepCount={isPlaying ? chainPlayback.reached : undefined}
            isLegendHidden={!isLegendOpen}
            density="compact"
            legendId={legendId}
            legendNote={selectedChain !== null
              ? 'A path through this model exists; that is not evidence the attack has been carried out.'
              : `${viewSelection?.explanation ?? ''} Select a part or a connection to narrow the rows to it; select it again to show the whole device.`.trim()}
          />
        )}
      </div>
    </section>
  );
}
