import { useMemo } from 'react';
import type { SequencePlayback } from '@/components/lab-kit/motion/use-sequence-playback';
import Segmented from '@/components/lab-kit/Segmented';
import { useViewState } from '@/components/workbench/ViewStateContext';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import type { GeneratedChain } from '@/lib/threat-model/chain-types';
import { applyLens, type Lens } from '@/lib/threat-model/lens';
import { countRowsByElement, type ElementRowCounts } from '@/lib/threat-model/register-counts';
import { ARCHITECTURE_VIEWS, type ArchitectureView, type ThreatModelReport } from '@/lib/threat-model/report-types';
import ArchitectureDiagram from './ArchitectureDiagram';
import { VIEW_LABELS } from './report/report-sections';

const DEFAULT_VIEW: ArchitectureView = 'global_system';
/** Under "model/", so the choice is forgotten when the device is replaced. */
const VIEW_STATE_KEY = 'model/architecture-view';

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
  isEditorOpen?: boolean;
  /** When given, a button that opens and closes the device editor is shown beside the view control. */
  onToggleEditor?: () => void;
  /**
   * Rows per part and connection for the badges, as `countRowsByElement` returns them. When
   * absent the counts are taken here from the report's rows under the lens.
   */
  elementCounts?: readonly ElementRowCounts[];
  /** The catalog's techniques, so a band lens narrows the counts taken here. Not needed when `elementCounts` is given. */
  techniques?: readonly Pick<CatalogTechnique, 'id' | 'bandIds'>[];
  /** Leaves out the sentence above the diagram and the legend under it, for a place that explains both itself. */
  isCompact?: boolean;
}

/**
 * The device itself: the path from the patient outward, with what each connection carries
 * and a badge on every part and connection. Selecting one narrows the rows to it; selecting
 * it again shows the whole device.
 */
export default function DeviceCanvas({
  report, lens, onLensChange, selectedChain, chainPlayback, onClearChain, isEditorOpen = false, onToggleEditor, elementCounts, techniques, isCompact = false,
}: Props) {
  const [activeView, setActiveView] = useViewState<ArchitectureView>(VIEW_STATE_KEY, DEFAULT_VIEW, isArchitectureView);
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
    <section className="lab-panel lab-diagram-panel" aria-label="Device diagram">
      <div className="lab-diagram-bar">
        {report.architectureViews.length > 1 && (
          <Segmented
            label="Architecture view" value={activeView}
            options={report.architectureViews.map((selection) => ({ value: selection.view, label: VIEW_LABELS[selection.view] }))}
            onChange={(view) => { setActiveView(view); onClearChain(); }}
          />
        )}
        {onToggleEditor !== undefined && (
          <button type="button" className="lab-button" aria-expanded={isEditorOpen} onClick={onToggleEditor}>
            {isEditorOpen ? 'Close device editor' : 'Edit device'}
          </button>
        )}
      </div>
      {selectedChain !== null ? (
        <p className="lab-diagram-note">
          <span className="lab-diagram-hypothesis">Generated hypothesis</span> {selectedChain.chain_name}. A path through this model exists; that is not evidence the attack has been carried out.{' '}
          <button type="button" className="lab-button" onClick={onClearChain}>Clear</button>
        </p>
      ) : !isCompact && (
        <p className="lab-diagram-note">{viewSelection?.explanation} Select a part or a connection to narrow the rows to it; select it again to show the whole device.</p>
      )}
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
        isLegendHidden={isCompact}
      />
    </section>
  );
}
