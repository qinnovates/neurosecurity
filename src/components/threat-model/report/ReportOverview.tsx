import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import SplitBar, { type SplitBarKind } from '@/components/lab-kit/SplitBar';
import StatTile from '@/components/lab-kit/StatTile';
import { RISK_STATUSES, type RiskStatus } from '@/lib/threat-model/device-model';
import { SCOPE_TERMS, SCOPE_TERM_LABELS, CATALOG_SEVERITY_HEADING, type ScopeTerm } from '@/lib/threat-model/lab-terms';
import type { SeverityCoverage, SeverityCoverageRow } from '@/lib/threat-model/placement-coverage';
import type { PlacementTableInfo } from '@/lib/threat-model/reference-data-types';
import { describeRegisterUnits, type ElementRowCounts, type RegisterUnits } from '@/lib/threat-model/register-counts';
import type { ScopeStatement } from '@/lib/threat-model/scope-statement';
import { RISK_STATUS_LABELS } from '../risk-status-labels';
import { ReportSection, ReportTable, type ReportColumn } from './ReportSection';

interface Props {
  elements: readonly ElementRowCounts[];
  units: RegisterUnits;
  scope: ScopeStatement;
  coverage: SeverityCoverage;
  placementTable: PlacementTableInfo;
}

const METHOD_STATEMENT = 'Method: a data-flow view of the device with trust zones; the STRIDE categories applied to each component and connection as a generic baseline; '
  + 'and neural-device techniques from the TARA catalog placed on the same elements by an authored placement table. Chains are assembled along paths in the model.';

/** How each scope term is drawn in a bar. The hatch is "not assessed" and nothing else. */
const KIND_BY_TERM: Readonly<Record<ScopeTerm, SplitBarKind>> = { applies: 'solid', would_apply_if: 'soft', reviewed_outside: 'open', not_assessed: 'hatch' };

function sumOver(elements: readonly ElementRowCounts[], read: (element: ElementRowCounts) => number): number {
  return elements.reduce((sum, element) => sum + read(element), 0);
}

const COVERAGE_COLUMNS: readonly ReportColumn<SeverityCoverageRow>[] = [
  { id: 'severity', header: CATALOG_SEVERITY_HEADING, render: (row) => <SeverityMark severity={row.severity} /> },
  {
    id: 'bar', header: 'Share of the catalog at this severity',
    render: (row) => <SplitBar subject={`catalog techniques of ${row.severity} severity`} isListHidden segments={SCOPE_TERMS.map((term) => ({ id: term, label: SCOPE_TERM_LABELS[term], count: row.byTerm[term], kind: KIND_BY_TERM[term] }))} />,
  },
  ...SCOPE_TERMS.map((term): ReportColumn<SeverityCoverageRow> => ({
    id: term, header: SCOPE_TERM_LABELS[term], isFigure: true,
    render: (row) => (term === 'not_assessed' ? <><HatchSwatch /> {row.byTerm[term]}</> : row.byTerm[term]),
  })),
  { id: 'total', header: 'Total', isFigure: true, render: (row) => row.total },
];

interface StatusCount { status: RiskStatus; catalogRows: number; baselineRows: number }

const DECISION_COLUMNS: readonly ReportColumn<StatusCount>[] = [
  { id: 'decision', header: 'Decision', render: (row) => RISK_STATUS_LABELS[row.status] },
  { id: 'catalog', header: 'Catalog rows', isFigure: true, render: (row) => row.catalogRows },
  { id: 'baseline', header: 'Baseline rows', isFigure: true, render: (row) => row.baselineRows },
];

/** The register and the catalog in figures, each computed from the rows and the scope lists that follow. */
export default function ReportOverview({ elements, units, scope, coverage, placementTable }: Props) {
  const openRows = sumOver(elements, (element) => element.catalogByStatus.open + element.baselineByStatus.open);
  const criticalAndHighOpen = sumOver(elements, (element) => element.openBySeverity.critical + element.openBySeverity.high);
  const decisions = RISK_STATUSES.map((status): StatusCount => ({
    status, catalogRows: sumOver(elements, (element) => element.catalogByStatus[status]), baselineRows: sumOver(elements, (element) => element.baselineByStatus[status]),
  }));
  return (
    <ReportSection id="overview">
      <p>{METHOD_STATEMENT}</p>
      <div className="report-tiles">
        <StatTile label="Open rows" figure={openRows} unit={`of ${units.catalogRows + units.baselineRows}`} />
        <StatTile label="Critical and high still open" figure={criticalAndHighOpen} unit="catalog rows" />
        <StatTile label="Techniques that apply" figure={scope.applies.length} unit={`of ${scope.total}`} />
        <StatTile label="Catalog techniques not assessed" figure={scope.notAssessed.length} unit={`of ${scope.total}`} />
      </div>
      <p>{describeRegisterUnits(units)}</p>
      <p>{placementTable.placementCount} placements drafted with an AI assistant; {placementTable.reviewedPlacementCount} reviewed by the author.</p>
      <h3 className="report-subheading">Coverage by catalog severity</h3>
      <ReportTable caption={`${coverage.total} catalog techniques, by severity and by where each stands against this device`} columns={COVERAGE_COLUMNS} rows={coverage.rows} rowKey={(row) => row.severity} emptyMessage="The catalog holds no technique." />
      <h3 className="report-subheading">Decision progress</h3>
      <ReportTable caption="Register rows by the decision recorded on each" columns={DECISION_COLUMNS} rows={decisions} rowKey={(row) => row.status} emptyMessage="The register has no rows." />
    </ReportSection>
  );
}
