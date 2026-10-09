import DataTable, { type DataTableColumn } from '@/components/lab-kit/DataTable';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import { CATALOG_SEVERITY_HEADING } from '@/lib/threat-model/lab-terms';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { EvidenceCell, SeverityCell } from '../frame/register-columns';
import { useModelHighlight } from '../model-highlight';

interface Props {
  /** The first open rows, in the register's order. */
  rows: readonly RiskRow[];
  /** Every open catalog row on the device, of which `rows` are the first. */
  openRowCount: number;
  onOpenRisk: (riskId: string) => void;
  onOpenTechnique: (techniqueId: string) => void;
}

export const TOP_OPEN_ROWS_TITLE = 'Top open rows';

function buildColumns(onOpenTechnique: Props['onOpenTechnique']): readonly DataTableColumn<RiskRow>[] {
  return [
    { id: 'threat', header: 'Threat', render: (row) => row.title },
    { id: 'id', header: 'ID', render: (row) => (row.techniqueId === null ? null : <TechniqueLink techniqueId={row.techniqueId} techniqueName={row.title} onOpen={onOpenTechnique} />) },
    { id: 'part', header: 'Part', render: (row) => row.elementLabel },
    { id: 'severity', header: CATALOG_SEVERITY_HEADING, render: (row) => <SeverityCell row={row} /> },
    { id: 'evidence', header: 'Evidence', render: (row) => <EvidenceCell row={row} /> },
  ];
}

/** Where triage starts: the first few open rows, each opening its detail in the register. */
export default function TopOpenRows({ rows, openRowCount, onOpenRisk, onOpenTechnique }: Props) {
  const highlight = useModelHighlight();
  return (
    <DataTable
      caption={`First ${rows.length} of ${openRowCount} open rows. Enter opens a row.`}
      columns={buildColumns(onOpenTechnique)} rows={rows} rowKey={(row) => row.riskId} sort={null}
      emptyMessage="Every row here has a decision recorded." onOpenRow={(row) => onOpenRisk(row.riskId)}
      isRowLit={(row) => highlight.isLit(row.elementId)} onRowPoint={(row) => highlight.setLitKey(row?.elementId ?? null)}
    />
  );
}
