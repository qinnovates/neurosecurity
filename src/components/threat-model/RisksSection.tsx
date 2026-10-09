import { useState } from 'react';
import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import FilterChip from '@/components/lab-kit/FilterChip';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import { CATALOG_SEVERITIES, type CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { RISK_STATUSES, type RiskStatus } from '@/lib/threat-model/device-model';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import { RISK_STATUS_LABELS } from './risk-status-labels';

type SourceFilter = 'catalog' | 'stride' | 'all';

interface Props {
  /** Rows the current part and lenses let through. */
  rows: readonly RiskRow[];
  /** Looks up the catalog entry behind a row, for its evidence tier. */
  techniqueById: ReadonlyMap<string, CatalogTechnique>;
  onDecide: (riskId: string, status: RiskStatus, note: string) => void;
  onOpenRisk: (riskId: string) => void;
}

const SOURCE_FILTERS: readonly { id: SourceFilter; label: string }[] = [
  { id: 'catalog', label: 'Neural techniques' },
  { id: 'stride', label: 'STRIDE baseline' },
  { id: 'all', label: 'All' },
];
/** Sorts after every known value, so a row with nothing to compare never ranks as the best or the least severe. */
const SORTS_LAST = 99;

function matchesSource(row: RiskRow, filter: SourceFilter): boolean {
  return filter === 'all' || row.source === filter;
}

function buildColumns(onDecide: Props['onDecide'], techniqueById: Props['techniqueById']): readonly DataTableColumn<RiskRow>[] {
  const tierOf = (row: RiskRow): string | null => (row.techniqueId === null ? null : techniqueById.get(row.techniqueId)?.evidenceTier ?? null);
  return [
    {
      id: 'evidence', header: 'Evidence',
      render: (row) => (row.evidenceStatus === null ? <span className="lab-soft">Baseline</span> : <EvidenceMark tier={tierOf(row)} status={row.evidenceStatus} />),
      sortValue: (row) => (row.evidenceStatus === null ? SORTS_LAST : describeEvidence({ evidenceTier: tierOf(row), evidenceStatus: row.evidenceStatus }).rank),
    },
    {
      id: 'threat', header: 'Threat', sortValue: (row) => row.title,
      render: (row) => <>{row.title}{row.catalogState === 'missing' && <> <span className="tm-badge tm-badge--warning">No longer in the catalog</span></>}</>,
    },
    {
      id: 'id', header: 'ID', sortValue: (row) => row.techniqueId ?? '',
      render: (row) => (row.techniqueId === null ? <span className="lab-soft">{row.strideCategories.join(', ')}</span> : <span className="lab-id">{row.techniqueId}</span>),
    },
    { id: 'part', header: 'Part', render: (row) => row.elementLabel, sortValue: (row) => row.elementLabel },
    {
      id: 'severity', header: 'Severity',
      render: (row) => (row.catalogSeverity === null ? <span className="lab-soft">Not scored</span> : <SeverityMark severity={row.catalogSeverity} />),
      sortValue: (row) => (row.catalogSeverity === null ? SORTS_LAST : CATALOG_SEVERITIES.indexOf(row.catalogSeverity)),
    },
    { id: 'cves', header: 'CVEs in other products', render: (row) => <span className="lab-figure">{row.precedentCveIds.length}</span>, sortValue: (row) => -row.precedentCveIds.length },
    {
      id: 'decision', header: 'Decision',
      render: (row) => (
        <select className="model-decision" aria-label={`Decision for ${row.title} on ${row.elementLabel}`} value={row.status} onChange={(event) => onDecide(row.riskId, event.target.value as RiskStatus, row.note)}>
          {RISK_STATUSES.map((status) => <option key={status} value={status}>{RISK_STATUS_LABELS[status]}</option>)}
        </select>
      ),
    },
  ];
}

/** The register for triage: one line per risk, evidence first, open rows on top. A row opens its detail beside the table. */
export default function RisksSection({ rows, techniqueById, onDecide, onOpenRisk }: Props) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('catalog');
  const [isOpenOnly, setOpenOnly] = useState(false);

  const sourceRows = rows.filter((row) => matchesSource(row, sourceFilter));
  const openRows = sourceRows.filter((row) => !isRiskAddressed(row));
  // Open rows first, so triage starts at the top; the order within each group is kept.
  const visibleRows = isOpenOnly ? openRows : [...openRows, ...sourceRows.filter((row) => isRiskAddressed(row))];
  const emptyMessage = sourceRows.length === 0
    ? 'No risk of this kind matches the part and lenses chosen. Nothing is hidden beyond them; choose "Show everything" to see the rest.'
    : 'Every row here has a decision recorded.';

  return (
    <section className="lab-panel model-register" aria-label="Risk register">
      <div className="model-register-bar" role="group" aria-label="Register rows to show">
        {SOURCE_FILTERS.map((filter) => (
          <FilterChip
            key={filter.id} label={filter.label} count={rows.filter((row) => matchesSource(row, filter.id)).length}
            isPressed={sourceFilter === filter.id} onToggle={() => setSourceFilter(filter.id)}
          />
        ))}
        <FilterChip label="Open only" count={openRows.length} isPressed={isOpenOnly} onToggle={() => setOpenOnly(!isOpenOnly)} />
      </div>
      <DataTable
        caption={`${openRows.length} open of ${sourceRows.length}. A row closes only when a decision is recorded on that row. Enter opens a row.`}
        columns={buildColumns(onDecide, techniqueById)} rows={visibleRows} rowKey={(row) => row.riskId} emptyMessage={emptyMessage}
        onOpenRow={(row) => onOpenRisk(row.riskId)} isRowQuiet={isRiskAddressed}
      />
    </section>
  );
}
