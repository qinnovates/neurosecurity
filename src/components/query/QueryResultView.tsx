import type { QueryResult } from '@/lib/kql-engine';
import { nearestNames } from '@/lib/threat-model/nearest-names';

interface Props {
  result: QueryResult;
  tableNames: readonly string[];
}

const MAX_ROWS_SHOWN = 200;
const COUNT_COLUMN = 'count';
const UNKNOWN_TABLE_PATTERN = /^Unknown table "([^"]+)"/;

export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/** An unknown table gets the nearest real names, not the whole list in one sentence. */
function describeError(error: string, tableNames: readonly string[]): string {
  const unknownTable = error.match(UNKNOWN_TABLE_PATTERN)?.[1];
  if (unknownTable === undefined) return error;
  const suggestions = nearestNames(unknownTable, tableNames);
  return suggestions.length === 0
    ? `There is no table named "${unknownTable}". The tables are listed on the left.`
    : `There is no table named "${unknownTable}". Did you mean ${suggestions.join(', ')}? The full list is on the left.`;
}

/** A result of one label column and one count gets a bar beside each number, drawn to the same scale. */
function countScale(result: QueryResult, columns: readonly string[]): number | null {
  if (columns.length !== 2 || !columns.includes(COUNT_COLUMN)) return null;
  const counts = result.rows.map((row) => row[COUNT_COLUMN]);
  if (!counts.every((count): count is number => typeof count === 'number' && count >= 0)) return null;
  return Math.max(...counts, 0);
}

export default function QueryResultView({ result, tableNames }: Props) {
  if (result.error !== null) return <p className="tm-error" role="alert">{describeError(result.error, tableNames)}</p>;
  if (result.rows.length === 0) return <p className="lab-soft">The query ran and no row matches it.</p>;
  const columns = Object.keys(result.rows[0]);
  const shown = result.rows.slice(0, MAX_ROWS_SHOWN);
  const largestCount = countScale(result, columns);
  return (
    <>
      <p className="lab-soft" role="status">{result.rows.length.toLocaleString('en-US')} row{result.rows.length === 1 ? '' : 's'}{result.rows.length > shown.length ? `, first ${shown.length} shown` : ''}.</p>
      <div className="lab-table-wrap query-result">
        <table className="lab-table">
          <thead>
            <tr>
              {columns.map((column) => <th key={column} scope="col"><span className="lab-table-head">{column}</span></th>)}
              {largestCount !== null && <th scope="col"><span className="lab-table-head sr-only">Share of the largest count</span></th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => <td key={column} className={typeof row[column] === 'number' ? 'lab-figure' : undefined}>{formatCell(row[column])}</td>)}
                {largestCount !== null && (
                  <td className="query-bar-cell" aria-hidden="true">
                    <span className="query-bar" style={{ width: `${largestCount === 0 ? 0 : ((row[COUNT_COLUMN] as number) / largestCount) * 100}%` }} title={`${formatCell(row[columns.find((column) => column !== COUNT_COLUMN) ?? COUNT_COLUMN])}: ${formatCell(row[COUNT_COLUMN])}`} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
