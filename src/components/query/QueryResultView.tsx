import { useMemo } from 'react';
import DataTable from '@/components/lab-kit/DataTable';
import EmptyState from '@/components/lab-kit/EmptyState';
import type { QueryResult } from '@/lib/kql-engine';
import { nearestNames } from '@/lib/threat-model/nearest-names';
import { buildResultColumns, findLargestCount, type ResultRow } from './query-result-columns';

interface Props {
  result: QueryResult;
  tableNames: readonly string[];
  /** Every technique id in the catalog; a cell holding one becomes a link to it. */
  techniqueIds: ReadonlySet<string>;
  onOpenTechnique: (techniqueId: string) => void;
}

const MAX_ROWS_SHOWN = 200;
const UNKNOWN_TABLE_PATTERN = /^Unknown table "([^"]+)"/;
const ERROR_TITLE = 'The query did not run';

/** For an unknown table, the nearest real names; for anything else, nothing beyond the engine's own words. */
function suggestTables(error: string, tableNames: readonly string[]): string | null {
  const unknownTable = error.match(UNKNOWN_TABLE_PATTERN)?.[1];
  if (unknownTable === undefined) return null;
  const suggestions = nearestNames(unknownTable, tableNames);
  return suggestions.length === 0 ? 'The tables are listed beside the result.' : `Did you mean ${suggestions.join(', ')}? The full list is beside the result.`;
}

function describeRowCount(total: number, shown: number): string {
  return `${total.toLocaleString('en-US')} row${total === 1 ? '' : 's'}${total > shown ? `, first ${shown} shown` : ''}`;
}

/** What a query returned: the engine's error in its own words, an empty result said as such, or the rows. */
export default function QueryResultView({ result, tableNames, techniqueIds, onOpenTechnique }: Props) {
  const columnNames = useMemo(() => Object.keys(result.rows[0] ?? {}), [result]);
  const shown = useMemo(() => result.rows.slice(0, MAX_ROWS_SHOWN).map((cells, index): ResultRow => ({ key: String(index), cells })), [result]);
  const columns = useMemo(
    () => buildResultColumns({ columns: columnNames, largestCount: findLargestCount(result.rows, columnNames), techniqueIds, onOpenTechnique }),
    [columnNames, result, techniqueIds, onOpenTechnique],
  );

  if (result.error !== null) {
    const suggestion = suggestTables(result.error, tableNames);
    return (
      <div className="lab-notice query-error" role="alert">
        <p className="query-error-title">{ERROR_TITLE}</p>
        <p className="query-error-message">{result.error}</p>
        {suggestion !== null && <p>{suggestion}</p>}
      </div>
    );
  }
  if (result.rows.length === 0) {
    return <EmptyState reason="nothing-shown" title="The query ran and no row matches it" action="Change the query, or choose a table to see what it holds." />;
  }
  return (
    <div className="query-result">
      <DataTable
        caption={describeRowCount(result.rows.length, shown.length)} columns={columns} rows={shown} rowKey={(row) => row.key}
        emptyMessage="The query ran and no row matches it."
      />
    </div>
  );
}
