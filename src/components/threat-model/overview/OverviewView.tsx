import { useMemo, type ReactNode } from 'react';
import EmptyState from '@/components/lab-kit/EmptyState';
import Panel from '@/components/lab-kit/Panel';
import StatTile from '@/components/lab-kit/StatTile';
import type { DeviceModel } from '@/lib/threat-model/device-model';
import type { SeverityCoverage } from '@/lib/threat-model/placement-coverage';
import type { PlacementTableInfo } from '@/lib/threat-model/reference-data-types';
import { countRowsByElement, describeRegisterUnits, summariseRegisterUnits } from '@/lib/threat-model/register-counts';
import { THREAT_GOALS, type GoalCoverage, type RiskRow, type ThreatGoal } from '@/lib/threat-model/report-types';
import type { ScopeStatement } from '@/lib/threat-model/scope-statement';
import { isZeroNotAssessed, type CoverageGaps } from '../frame/facet-counts';
import CoverageBySeverity, { COVERAGE_TITLE } from './CoverageBySeverity';
import DecisionProgress, { DECISION_PROGRESS_TITLE } from './DecisionProgress';
import GoalCoverageNotes from './GoalCoverageNotes';
import OpenRowsByElement, { OPEN_ROWS_TITLE } from './OpenRowsByElement';
import { listTopOpenRows, sumDecisions, summariseOverview, type OverviewFigures } from './overview-figures';
import TopOpenRows, { TOP_OPEN_ROWS_TITLE } from './TopOpenRows';

interface Props {
  model: DeviceModel;
  /** Current register rows for the whole device; the Overview is never narrowed. */
  rows: readonly RiskRow[];
  scope: ScopeStatement;
  severityCoverage: SeverityCoverage;
  goalCoverage: Record<ThreatGoal, GoalCoverage>;
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

function Tiles({ figures, gaps }: { figures: OverviewFigures; gaps: CoverageGaps }) {
  const hasNoCatalogRow = isZeroNotAssessed(figures.catalogRows, gaps.isAnyIncomplete);
  return (
    <section className="model-tiles" aria-label="This device at a glance">
      <StatTile
        label="Open rows" figure={figures.openCatalogRows} unit={`of ${figures.catalogRows}`} isNotAssessed={hasNoCatalogRow}
        note={`${figures.openBaselineRows} of ${figures.baselineRows} baseline rows open`}
      />
      <StatTile
        label="Critical and high still open" figure={figures.openSevereRows} unit={`of ${figures.severeRows}`}
        isNotAssessed={isZeroNotAssessed(figures.severeRows, gaps.bySeverity.critical || gaps.bySeverity.high)}
      />
      <StatTile
        label="Techniques that apply" figure={figures.techniquesThatApply} unit={`of ${figures.catalogTechniques}`}
        isNotAssessed={isZeroNotAssessed(figures.techniquesThatApply, figures.techniquesNotAssessed > 0)}
      />
      <StatTile label="Catalog techniques not assessed" figure={figures.techniquesNotAssessed} unit={`of ${figures.catalogTechniques}`} />
    </section>
  );
}

/**
 * The device's threat model at a glance: what is open, how much of the catalog was assessed,
 * where the open rows sit, and how far the decisions have got. Every figure is counted from
 * the rows, the scope statement or the placement table.
 */
export default function OverviewView({
  model, rows, scope, severityCoverage, goalCoverage, gaps, placementTable, diagram, onSelectElement, onOpenRisk, onOpenTechnique, onOpenScopeLists,
}: Props) {
  const figures = useMemo(() => summariseOverview(rows, scope), [rows, scope]);
  const elementCounts = useMemo(() => countRowsByElement(model, rows), [model, rows]);
  const topRows = useMemo(() => listTopOpenRows(rows, TOP_ROW_LIMIT), [rows]);
  const catalogRowsByGoal = useMemo(
    () => Object.fromEntries(THREAT_GOALS.map((goal) => [goal, rows.filter((row) => row.source === 'catalog' && row.goal === goal).length])) as Record<ThreatGoal, number>,
    [rows],
  );
  const scopeListsLink = <button type="button" className="lab-link" onClick={onOpenScopeLists}>{SCOPE_LISTS_LABEL}</button>;

  return (
    <div className="model-overview">
      <Tiles figures={figures} gaps={gaps} />
      <p className="model-units">{describeRegisterUnits(summariseRegisterUnits(model, rows))}</p>
      {diagram}
      <div className="model-overview-grid">
        <Panel title={COVERAGE_TITLE} actions={scopeListsLink}>
          <CoverageBySeverity coverage={severityCoverage} />
          <GoalCoverageNotes goalCoverage={goalCoverage} catalogRowsByGoal={catalogRowsByGoal} />
        </Panel>
        <Panel title={OPEN_ROWS_TITLE}>
          <OpenRowsByElement elementCounts={elementCounts} isCoverageIncomplete={gaps.isAnyIncomplete} onSelectElement={onSelectElement} />
        </Panel>
        <Panel title={DECISION_PROGRESS_TITLE}>
          <DecisionProgress totals={sumDecisions(elementCounts)} />
        </Panel>
        <Panel title={TOP_OPEN_ROWS_TITLE}>
          {figures.catalogRows === 0
            ? <EmptyState reason="nothing-shown" title="No techniques are placed on this model." action={scopeListsLink} />
            : <TopOpenRows rows={topRows} openRowCount={figures.openCatalogRows} onOpenRisk={onOpenRisk} onOpenTechnique={onOpenTechnique} />}
        </Panel>
      </div>
      <p className="lab-soft model-placement-line">
        <span className="lab-figure">{placementTable.placementCount}</span> placements drafted with an AI assistant;{' '}
        <span className="lab-figure">{placementTable.reviewedPlacementCount}</span> reviewed by the author.
      </p>
    </div>
  );
}
