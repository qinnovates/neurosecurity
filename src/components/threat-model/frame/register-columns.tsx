import type { DataTableColumn } from '@/components/lab-kit/DataTable';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import { CATALOG_SEVERITIES } from '@/lib/threat-model/catalog-types';
import { RISK_STATUSES, type RiskStatus } from '@/lib/threat-model/device-model';
import { evidenceRankOf } from '@/lib/threat-model/evidence-levels';
import { CATALOG_SEVERITY_HEADING } from '@/lib/threat-model/lab-terms';
import { NOT_SCORED_LABEL } from '@/lib/threat-model/register-csv';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { STRIDE_LABELS } from '@/lib/threat-model/stride';
import { RISK_STATUS_LABELS } from '../risk-status-labels';

/** Sorts after every known value, so a row with nothing to compare never ranks as the best or the least severe. */
const SORTS_LAST = 99;
export const BASELINE_LABEL = 'Baseline';
export const NO_CVE_LINKED_LABEL = 'None linked';
export const CVE_HEADING = 'CVEs in other products';

export interface RegisterColumnOptions {
  /** Risk ids that open a group; null when the reader has sorted and every row names its threat in full. */
  leadRiskIds: ReadonlySet<string> | null;
  onDecide: (row: RiskRow, status: RiskStatus) => void;
  onOpenTechnique: (techniqueId: string) => void;
}

export function EvidenceCell({ row }: { row: RiskRow }) {
  if (row.source === 'stride') return <span className="lab-soft">{BASELINE_LABEL}</span>;
  return <EvidenceMark tier={row.evidenceTier} status={row.evidenceStatus} labelForm="short" />;
}

export function SeverityCell({ row }: { row: RiskRow }) {
  return row.catalogSeverity === null ? <span className="lab-soft">{NOT_SCORED_LABEL}</span> : <SeverityMark severity={row.catalogSeverity} />;
}

export function DecisionSelect({ row, onDecide }: { row: RiskRow; onDecide: RegisterColumnOptions['onDecide'] }) {
  return (
    <select
      className="lab-input model-decision" aria-label={`Decision for ${row.title} on ${row.elementLabel}`} value={row.status}
      onChange={(event) => onDecide(row, event.target.value as RiskStatus)}
    >
      {RISK_STATUSES.map((status) => <option key={status} value={status}>{RISK_STATUS_LABELS[status]}</option>)}
    </select>
  );
}

function IdCell({ row, onOpenTechnique }: { row: RiskRow; onOpenTechnique: RegisterColumnOptions['onOpenTechnique'] }) {
  if (row.techniqueId === null) return <span className="lab-soft">{row.strideCategories.map((category) => STRIDE_LABELS[category]).join(', ')}</span>;
  return <TechniqueLink techniqueId={row.techniqueId} techniqueName={row.title} onOpen={onOpenTechnique} />;
}

/** Threat, ID, Part, Catalog severity, Evidence, CVEs in other products, Decision. */
export function buildRegisterColumns({ leadRiskIds, onDecide, onOpenTechnique }: RegisterColumnOptions): readonly DataTableColumn<RiskRow>[] {
  const isLead = (row: RiskRow): boolean => leadRiskIds === null || leadRiskIds.has(row.riskId);
  return [
    {
      id: 'threat', header: 'Threat', sortValue: (row) => row.title,
      render: (row) => <span className="model-threat" data-lead={isLead(row)}>{row.title}</span>,
    },
    { id: 'id', header: 'ID', sortValue: (row) => row.techniqueId ?? '', render: (row) => <IdCell row={row} onOpenTechnique={onOpenTechnique} /> },
    { id: 'part', header: 'Part', sortValue: (row) => row.elementLabel, render: (row) => row.elementLabel },
    {
      id: 'severity', header: CATALOG_SEVERITY_HEADING, render: (row) => <SeverityCell row={row} />,
      sortValue: (row) => (row.catalogSeverity === null ? SORTS_LAST : CATALOG_SEVERITIES.indexOf(row.catalogSeverity)),
    },
    {
      id: 'evidence', header: 'Evidence', render: (row) => <EvidenceCell row={row} />,
      sortValue: (row) => (row.source === 'stride' ? SORTS_LAST : evidenceRankOf(row)),
    },
    {
      id: 'cves', header: CVE_HEADING, sortValue: (row) => -row.precedentCveIds.length,
      render: (row) => (row.precedentCveIds.length === 0 ? <span className="lab-soft">{NO_CVE_LINKED_LABEL}</span> : <span className="lab-figure">{row.precedentCveIds.length}</span>),
    },
    { id: 'decision', header: 'Decision', render: (row) => <DecisionSelect row={row} onDecide={onDecide} /> },
  ];
}
