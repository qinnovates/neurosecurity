import { useMemo, useState, type ReactNode } from 'react';
import EmptyState from '@/components/lab-kit/EmptyState';
import Panel from '@/components/lab-kit/Panel';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import { describePlacementDrafting, summariseHeadlineFigures, type HeadlineFigure, type HeadlineFigureId } from '@/lib/threat-model/headline-figures';
import type { SeverityCoverage } from '@/lib/threat-model/placement-coverage';
import type { PlacementTableInfo } from '@/lib/threat-model/reference-data-types';
import { countRowsByElement, describeRegisterUnits, summariseRegisterUnits } from '@/lib/threat-model/register-counts';
import { THREAT_GOALS, type RiskRow, type ThreatGoal, type ThreatModelReport } from '@/lib/threat-model/report-types';
import type { ScopeStatement } from '@/lib/threat-model/scope-statement';
import { COMPACT_METRICS } from '../diagram/diagram-metrics';
import { useElementSize } from '../diagram/use-element-size';
import { computeDiagramLayout } from '../diagram-layout';
import type { CoverageGaps, ScopeByKind } from '../frame/facet-counts';
import type { TermCounts } from '../frame/scope-by-kind';
import CoverageBySeverity, { COVERAGE_TITLE } from './CoverageBySeverity';
import DecisionProgress, { DECISION_PROGRESS_TITLE } from './DecisionProgress';
import GoalCoverageNotes from './GoalCoverageNotes';
import OpenRowsByElement, { OPEN_ROWS_TITLE } from './OpenRowsByElement';
import { listTopOpenRows, sumDecisions, summariseOverview } from './overview-figures';
import SummaryTile from './SummaryTile';
import TopOpenRows, { TOP_OPEN_ROWS_TITLE } from './TopOpenRows';

interface Props {
  model: DeviceModel;
  /** The report of the device in focus: the headline figures are counted from it, as the Report counts them. */
  report: ThreatModelReport;
  /** Current register rows for the whole device; the Overview is never narrowed. */
  rows: readonly RiskRow[];
  scope: ScopeStatement;
  severityCoverage: SeverityCoverage;
  scopeByKind: ScopeByKind;
  gaps: CoverageGaps;
  placementTable: PlacementTableInfo;
  /** The device diagram, drawn by the frame so it is the same one every view shows. */
  diagram: ReactNode;
  onSelectElement: (elementId: string) => void;
  onOpenRisk: (riskId: string) => void;
  onOpenTechnique: (techniqueId: string) => void;
  onOpenScopeLists: () => void;
}

/** How many open rows the Overview lists before sending the reader to the register. */
export const TOP_ROW_LIMIT = 5;
const SCOPE_LISTS_LABEL = 'The four scope lists with reasons';
/** The diagram's panel adds this to the drawing's width: its padding and its hairline. */
const DIAGRAM_PANEL_CHROME = 26;
/** The narrowest the coverage table reads well at, beside the diagram. */
const COVERAGE_MIN_WIDTH = 480;
const COLUMN_GAP = 12;

/** True when the diagram and the coverage table fit side by side in a screen this wide. Unmeasured, they stack. */
export function fitsSideBySide(screenWidth: number | null, drawingWidth: number): boolean {
  return screenWidth !== null && screenWidth - (drawingWidth + DIAGRAM_PANEL_CHROME) - COLUMN_GAP >= COVERAGE_MIN_WIDTH;
}

function sumSevere(scopeByKind: ScopeByKind): TermCounts {
  const { critical, high } = scopeByKind.bySeverity;
  return {
    applies: critical.applies + high.applies, would_apply_if: critical.would_apply_if + high.would_apply_if,
    reviewed_outside: critical.reviewed_outside + high.reviewed_outside, not_assessed: critical.not_assessed + high.not_assessed,
  };
}

/** The kinds whose placement decisions say whether an empty figure is "none on this device" or "not assessed". */
function termCountsFor(id: HeadlineFigureId, scopeByKind: ScopeByKind): TermCounts | undefined {
  if (id === 'techniques-not-assessed') return undefined;
  return id === 'severe-open' ? sumSevere(scopeByKind) : scopeByKind.all;
}

/** The headline figures as one strip, with the sentence that says what a row is and where the placements came from. */
function Summary({ figures, scopeByKind, units, placements }: { figures: readonly HeadlineFigure[]; scopeByKind: ScopeByKind; units: string; placements: string }) {
  return (
    <section className="lab-panel model-summary" aria-label="This device at a glance">
      <div className="model-tiles">
        {figures.map((figure) => <SummaryTile key={figure.id} figure={figure} termCounts={termCountsFor(figure.id, scopeByKind)} />)}
      </div>
      <div className="model-summary-notes">
        <p className="model-units">{units}</p>
        <p className="lab-soft model-placement-line">{placements}</p>
      </div>
    </section>
  );
}

/**
 * The device's threat model at a glance: what is open, how much of the catalog was assessed,
 * where the open rows sit, and how far the decisions have got. Every figure is counted from
 * the rows, the scope statement or the placement table. Where the screen is wide enough the
 * diagram, the bars that share its highlight and the coverage table share the first screen.
 */
export default function OverviewView({
  model, report, rows, scope, severityCoverage, scopeByKind, gaps, placementTable, diagram, onSelectElement, onOpenRisk, onOpenTechnique, onOpenScopeLists,
}: Props) {
  const [screen, setScreen] = useState<HTMLDivElement | null>(null);
  const screenSize = useElementSize(screen);
  const figures = useMemo(() => summariseOverview(rows, scope), [rows, scope]);
  const headline = useMemo(() => summariseHeadlineFigures(report, severityCoverage), [report, severityCoverage]);
  const elementCounts = useMemo(() => countRowsByElement(model, rows), [model, rows]);
  const topRows = useMemo(() => listTopOpenRows(rows, TOP_ROW_LIMIT), [rows]);
  const drawingWidth = useMemo(() => computeDiagramLayout(model, COMPACT_METRICS).width, [model]);
  const catalogRowsByGoal = useMemo(
    () => Object.fromEntries(THREAT_GOALS.map((goal) => [goal, rows.filter((row) => row.source === 'catalog' && row.goal === goal).length])) as Record<ThreatGoal, number>,
    [rows],
  );
  const scopeListsLink = <button type="button" className="lab-link" onClick={onOpenScopeLists}>{SCOPE_LISTS_LABEL}</button>;

  return (
    <div className="model-overview" ref={setScreen}>
      <Summary
        figures={headline} scopeByKind={scopeByKind} units={describeRegisterUnits(summariseRegisterUnits(model, rows))}
        placements={describePlacementDrafting(placementTable)}
      />
      <div className="model-overview-top" data-side={fitsSideBySide(screenSize?.width ?? null, drawingWidth)}>
        {diagram}
        <div className="model-overview-rows">
          <Panel title={OPEN_ROWS_TITLE}>
            <OpenRowsByElement elementCounts={elementCounts} isCoverageIncomplete={gaps.isAnyIncomplete} onSelectElement={onSelectElement} />
          </Panel>
        </div>
        <div className="model-overview-coverage">
          <Panel title={COVERAGE_TITLE} actions={scopeListsLink}>
            <CoverageBySeverity coverage={severityCoverage} />
            <GoalCoverageNotes scopeByGoal={scopeByKind.byGoal} catalogRowsByGoal={catalogRowsByGoal} />
          </Panel>
        </div>
      </div>
      <div className="model-overview-grid">
        <Panel title={DECISION_PROGRESS_TITLE}>
          <DecisionProgress totals={sumDecisions(elementCounts)} />
        </Panel>
        <Panel title={TOP_OPEN_ROWS_TITLE}>
          {/* The wrapper holds the table to the panel's width, so each row is one line. */}
          <div className="model-top-rows">
            {figures.catalogRows === 0
              ? <EmptyState reason="nothing-shown" title="No techniques are placed on this model." action={scopeListsLink} />
              : <TopOpenRows rows={topRows} openRowCount={figures.openCatalogRows} onOpenRisk={onOpenRisk} onOpenTechnique={onOpenTechnique} />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
