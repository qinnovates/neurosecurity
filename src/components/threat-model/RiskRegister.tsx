import { EvidenceGlyph } from '@/components/lab-kit/EvidenceMark';
import EvidenceLegend from '@/components/lab-kit/EvidenceLegend';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import { countByEvidence, describeEvidence } from '@/lib/threat-model/evidence-levels';
import { CATALOG_SEVERITY_HEADING } from '@/lib/threat-model/lab-terms';
import type { OrphanDecision } from '@/lib/threat-model/orphan-decisions';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { ReportTable, type ReportColumn } from './report/ReportSection';
import { RISK_STATUS_LABELS } from './risk-status-labels';

interface Props {
  rows: readonly RiskRow[];
  /** Decisions saved in the model that no row now carries. Listed under the register so none is lost from the page. */
  orphanDecisions?: readonly OrphanDecision[];
}

const BASELINE_LABEL = 'Generic baseline';
const NO_VALUE = '';

const REGISTER_COLUMNS: readonly ReportColumn<RiskRow>[] = [
  { id: 'threat', header: 'Threat', render: (row) => row.title },
  { id: 'id', header: 'ID', render: (row) => (row.techniqueId === null ? NO_VALUE : <span className="lab-id">{row.techniqueId}</span>) },
  { id: 'part', header: 'Part', render: (row) => row.elementLabel },
  { id: 'severity', header: CATALOG_SEVERITY_HEADING, render: (row) => (row.catalogSeverity === null ? NO_VALUE : <SeverityMark severity={row.catalogSeverity} />) },
  { id: 'evidence', header: 'Evidence', render: (row) => (row.source === 'catalog' ? <EvidenceGlyph evidence={describeEvidence(row)} labelForm="short" /> : <span className="lab-soft">{BASELINE_LABEL}</span>) },
  { id: 'decision', header: 'Decision', render: (row) => RISK_STATUS_LABELS[row.status] },
  { id: 'note', header: 'Note', render: (row) => row.note },
];

const ORPHAN_COLUMNS: readonly ReportColumn<OrphanDecision>[] = [
  { id: 'id', header: 'Recorded on', render: (orphan) => <span className="lab-id report-wrap">{orphan.decision.riskId}</span> },
  { id: 'decision', header: 'Decision', render: (orphan) => RISK_STATUS_LABELS[orphan.decision.status] },
  { id: 'note', header: 'Note', render: (orphan) => orphan.decision.note },
  { id: 'cause', header: 'Why it has no row', render: (orphan) => orphan.detail },
];

/** The whole register as the report prints it: one line per row, nothing to operate. */
export default function RiskRegister({ rows, orphanDecisions = [] }: Props) {
  // A row kept only because a saved decision names a technique the catalog no longer holds is listed with the decisions below.
  const current = rows.filter((row) => row.catalogState === 'current');
  const catalogRows = current.filter((row) => row.source === 'catalog');
  return (
    <>
      <ReportTable
        caption={`${current.length} rows: ${catalogRows.length} from the technique catalog, ${current.length - catalogRows.length} from the generic baseline`}
        columns={REGISTER_COLUMNS} rows={current} rowKey={(row) => row.riskId} emptyMessage="No rows to show here."
      />
      {catalogRows.length > 0 && <EvidenceLegend counts={countByEvidence(catalogRows)} isCompact />}
      {orphanDecisions.length > 0 && (
        <>
          <h3 className="report-subheading">Decisions without a row: {orphanDecisions.length}</h3>
          <ReportTable caption="Decisions saved in the model that no row now carries" columns={ORPHAN_COLUMNS} rows={orphanDecisions} rowKey={(orphan) => orphan.decision.riskId} emptyMessage="Every saved decision has a row." />
        </>
      )}
    </>
  );
}
