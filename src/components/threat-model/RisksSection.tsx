import { useMemo, type Ref } from 'react';
import DataTable, { type DataTableHandle, type DataTableSort } from '@/components/lab-kit/DataTable';
import EvidenceLegend from '@/components/lab-kit/EvidenceLegend';
import Segmented, { type SegmentedOption } from '@/components/lab-kit/Segmented';
import { useViewState } from '@/components/workbench/ViewStateContext';
import type { RiskStatus } from '@/lib/threat-model/device-model';
import type { ModelElement } from '@/lib/threat-model/model-order';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import { MODEL_STATE_KEYS } from './frame/model-view-keys';
import { DecisionSelect, EvidenceCell, SeverityCell, buildRegisterColumns } from './frame/register-columns';
import { groupRegisterRows } from './frame/register-order';
import { useModelHighlight } from './model-highlight';

export const REGISTER_SCOPES = ['catalog', 'stride', 'all'] as const;
export type RegisterScope = typeof REGISTER_SCOPES[number];

const SCOPE_OPTIONS: readonly SegmentedOption<RegisterScope>[] = [
  { value: 'catalog', label: 'Neural techniques' },
  { value: 'stride', label: 'STRIDE baseline' },
  { value: 'all', label: 'All' },
];
const SORT_DIRECTIONS: readonly string[] = ['ascending', 'descending'];
const MAX_COLUMN_ID_LENGTH = 40;

function isRegisterScope(value: unknown): value is RegisterScope {
  return typeof value === 'string' && (REGISTER_SCOPES as readonly string[]).includes(value);
}

function isRegisterSort(value: unknown): value is DataTableSort | null {
  if (value === null) return true;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const { columnId, direction } = value as Record<string, unknown>;
  return typeof columnId === 'string' && columnId.length <= MAX_COLUMN_ID_LENGTH && typeof direction === 'string' && SORT_DIRECTIONS.includes(direction);
}

interface Props {
  /** Current rows the facets let through. */
  rows: readonly RiskRow[];
  /** Every part and connection in model order; it orders the lines inside a technique. */
  elements: readonly ModelElement[];
  openedRiskId: string | null;
  /** A decision chosen on the row. The caller records it, or asks for the note it needs. */
  onDecide: (row: RiskRow, status: RiskStatus) => void;
  onOpenRisk: (riskId: string) => void;
  onOpenTechnique: (techniqueId: string) => void;
  tableRef?: Ref<DataTableHandle>;
}

function RiskCard({ row, onDecide }: { row: RiskRow; onDecide: Props['onDecide'] }) {
  return (
    <div className="model-risk-card">
      <p><strong>{row.title}</strong></p>
      <p className="lab-soft">{row.elementLabel}{row.techniqueId !== null && <> <span className="lab-id">{row.techniqueId}</span></>}</p>
      <p className="model-risk-facts"><SeverityCell row={row} /><EvidenceCell row={row} /></p>
      <DecisionSelect row={row} onDecide={onDecide} />
    </div>
  );
}

/**
 * The register: one line per technique per part, grouped by technique, open groups first.
 * Each line keeps its own decision. A row opens its detail in the drawer beside the table,
 * and rows slide to their new place when a filter or a decision changes the set.
 */
export default function RisksSection({ rows, elements, openedRiskId, onDecide, onOpenRisk, onOpenTechnique, tableRef }: Props) {
  const [scope, setScope] = useViewState<RegisterScope>(MODEL_STATE_KEYS.registerScope, 'catalog', isRegisterScope);
  const [sort, setSort] = useViewState<DataTableSort | null>(MODEL_STATE_KEYS.registerSort, null, isRegisterSort);
  const highlight = useModelHighlight();

  const scopedRows = useMemo(() => rows.filter((row) => scope === 'all' || row.source === scope), [rows, scope]);
  const grouped = useMemo(() => groupRegisterRows(scopedRows, elements), [scopedRows, elements]);
  const columns = useMemo(
    () => buildRegisterColumns({ leadRiskIds: sort === null ? grouped.leadRiskIds : null, onDecide, onOpenTechnique }),
    [sort, grouped.leadRiskIds, onDecide, onOpenTechnique],
  );
  const openCount = scopedRows.filter((row) => !isRiskAddressed(row)).length;
  const emptyMessage = 'No risk of this kind matches the part and lenses chosen. Nothing is hidden beyond them; choose "Show everything" to see the rest.';

  return (
    <section className="lab-panel model-register" aria-label="Risk register">
      <div className="model-register-bar">
        <Segmented label="Register scope" options={SCOPE_OPTIONS} value={scope} onChange={setScope} />
        {sort !== null && <button type="button" className="lab-button" onClick={() => setSort(null)}>Group by technique</button>}
      </div>
      <div>
        <DataTable
          ref={tableRef}
          caption={`${openCount} open of ${scopedRows.length}. A row closes only when a decision is recorded on that row. Enter opens a row.`}
          columns={columns} rows={grouped.rows} rowKey={(row) => row.riskId} emptyMessage={emptyMessage}
          sort={sort} onSortChange={setSort} openedKey={openedRiskId}
          onOpenRow={(row) => onOpenRisk(row.riskId)} isRowQuiet={isRiskAddressed}
          isRowLit={(row) => highlight.isLit(row.elementId)} onRowPoint={(row) => highlight.setLitKey(row?.elementId ?? null)}
          renderCard={(row) => <RiskCard row={row} onDecide={onDecide} />}
        />
      </div>
      <div className="model-register-legend">
        <EvidenceLegend isCompact />
      </div>
    </section>
  );
}
