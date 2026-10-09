import type { DataTableColumn } from '@/components/lab-kit/DataTable';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import type { Row } from '@/lib/kql-engine';
import { CATALOG_SEVERITIES, type CatalogSeverity } from '@/lib/threat-model/catalog-types';

export interface ResultRow {
  /** The row's position in the result, as text; a result has no other identity. */
  key: string;
  cells: Row;
}

export const COUNT_COLUMN = 'count';
const SEVERITY_COLUMN = 'severity';
const BAR_COLUMN_ID = 'count-bar';
const BAR_COLUMN_HEADER = 'Share of the largest count';

export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/** The largest count, when the result has a count column of whole, non-negative numbers beside at least one label; otherwise null. */
export function findLargestCount(rows: readonly Row[], columns: readonly string[]): number | null {
  if (columns.length < 2 || !columns.includes(COUNT_COLUMN)) return null;
  const counts = rows.map((row) => row[COUNT_COLUMN]);
  if (!counts.every((count): count is number => typeof count === 'number' && count >= 0)) return null;
  return Math.max(...counts, 0);
}

/** Numbers sort as numbers and catalog severities in their own order; everything else as text. */
function sortValueOf(column: string, value: unknown): string | number {
  if (typeof value === 'number') return value;
  const text = formatCell(value);
  const severityRank = column === SEVERITY_COLUMN ? (CATALOG_SEVERITIES as readonly string[]).indexOf(text.toLowerCase()) : -1;
  return severityRank === -1 ? text : severityRank;
}

interface ColumnInputs {
  columns: readonly string[];
  /** Null when the result is not a set of counts. */
  largestCount: number | null;
  techniqueIds: ReadonlySet<string>;
  onOpenTechnique: (techniqueId: string) => void;
}

/** A catalog severity in a `severity` column, whatever its letter case; null for any other value, which is then printed as it is. */
function asCatalogSeverity(column: string, value: unknown): CatalogSeverity | null {
  if (column !== SEVERITY_COLUMN || typeof value !== 'string') return null;
  return CATALOG_SEVERITIES.find((severity) => severity === value.toLowerCase()) ?? null;
}

function renderCell(column: string, value: unknown, { techniqueIds, onOpenTechnique }: ColumnInputs) {
  const severity = asCatalogSeverity(column, value);
  if (severity !== null) return <SeverityMark severity={severity} />;
  if (typeof value === 'string' && techniqueIds.has(value)) return <TechniqueLink techniqueId={value} onOpen={onOpenTechnique} />;
  return <span className={typeof value === 'number' ? 'lab-figure' : undefined}>{formatCell(value)}</span>;
}

/** One table column per result column, and, for a set of counts, a bar per row drawn from zero to the largest count. */
export function buildResultColumns(inputs: ColumnInputs): DataTableColumn<ResultRow>[] {
  const { columns, largestCount } = inputs;
  const dataColumns = columns.map((column): DataTableColumn<ResultRow> => ({
    id: column,
    header: column,
    render: (row) => renderCell(column, row.cells[column], inputs),
    sortValue: (row) => sortValueOf(column, row.cells[column]),
  }));
  if (largestCount === null) return dataColumns;
  const barColumn: DataTableColumn<ResultRow> = {
    id: BAR_COLUMN_ID,
    header: BAR_COLUMN_HEADER,
    render: (row) => (
      <span className="query-bar-track" aria-hidden="true">
        <span className="query-bar" style={{ width: `${largestCount === 0 ? 0 : ((row.cells[COUNT_COLUMN] as number) / largestCount) * 100}%` }} />
      </span>
    ),
  };
  return [...dataColumns, barColumn];
}
