import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useListReflow } from './motion/use-list-reflow';

export interface DataTableColumn<Row> {
  id: string;
  header: string;
  render: (row: Row) => ReactNode;
  /** Makes the column sortable. Numbers sort numerically, strings by locale. */
  sortValue?: (row: Row) => string | number;
}

interface Props<Row> {
  /** Accessible name of the table; also shown above it. */
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** What to say when there are no rows. It should say why, not only that. */
  emptyMessage: string;
  /** When set, a row can be opened with a click or the Enter key. */
  onOpenRow?: (row: Row) => void;
  /** Rows this returns true for are drawn quieter, for example risks already dealt with. */
  isRowQuiet?: (row: Row) => boolean;
}

type SortDirection = 'ascending' | 'descending';

interface SortState {
  columnId: string;
  direction: SortDirection;
}

/** Controls inside a row keep their own clicks and keys; only the row itself opens. */
const ROW_CONTROL_SELECTOR = 'select, input, button, a, label, textarea';

function compareValues(left: string | number, right: string | number): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right));
}

/**
 * The Lab's table: a header that stays put, sortable columns, and rows that can be walked
 * with the arrow keys. Rows slide to their new place when the set of rows changes.
 */
export default function DataTable<Row>({ caption, columns, rows, rowKey, emptyMessage, onOpenRow, isRowQuiet }: Props<Row>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const sortedRows = useMemo(() => {
    const column = columns.find((candidate) => candidate.id === sort?.columnId);
    if (sort === null || column?.sortValue === undefined) return rows;
    const { sortValue } = column;
    const sign = sort.direction === 'ascending' ? 1 : -1;
    return [...rows].sort((left, right) => sign * compareValues(sortValue(left), sortValue(right)));
  }, [rows, columns, sort]);

  const keys = sortedRows.map(rowKey);
  useListReflow(bodyRef, keys.join('\n'));
  // The row that takes the tab stop: the last one focused if it is still shown, otherwise the first.
  const tabStopKey = focusedKey !== null && keys.includes(focusedKey) ? focusedKey : keys[0];

  const toggleSort = (columnId: string): void => {
    setSort((current) => (current?.columnId === columnId && current.direction === 'ascending'
      ? { columnId, direction: 'descending' }
      : { columnId, direction: 'ascending' }));
  };

  const moveFocus = (event: KeyboardEvent<HTMLTableRowElement>, index: number): void => {
    const targets: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: keys.length - 1 };
    const target = targets[event.key];
    if (target === undefined || target < 0 || target >= keys.length) return;
    event.preventDefault();
    bodyRef.current?.querySelectorAll<HTMLTableRowElement>('tr')[target]?.focus();
  };

  const handleRowKey = (event: KeyboardEvent<HTMLTableRowElement>, row: Row, index: number): void => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' && onOpenRow !== undefined) onOpenRow(row);
    else moveFocus(event, index);
  };
  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, row: Row): void => {
    if (event.target instanceof Element && event.target.closest(ROW_CONTROL_SELECTOR) !== null) return;
    onOpenRow?.(row);
  };

  return (
    <div className="lab-table-wrap">
      <table className="lab-table">
        <caption className="lab-label">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col" aria-sort={sort?.columnId === column.id ? sort.direction : undefined}>
                {column.sortValue === undefined ? <span className="lab-table-head">{column.header}</span> : (
                  <button type="button" className="lab-table-sort" onClick={() => toggleSort(column.id)}>
                    {column.header}
                    {sort?.columnId === column.id && <span aria-hidden="true">{sort.direction === 'ascending' ? '↑' : '↓'}</span>}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {sortedRows.map((row, index) => {
            const key = keys[index];
            return (
              <tr
                key={key} data-reflow-key={key} data-openable={onOpenRow !== undefined} data-quiet={isRowQuiet?.(row) === true} tabIndex={key === tabStopKey ? 0 : -1}
                onFocus={() => setFocusedKey(key)} onKeyDown={(event) => handleRowKey(event, row, index)}
                onClick={onOpenRow === undefined ? undefined : (event) => handleRowClick(event, row)}
              >
                {columns.map((column) => <td key={column.id}>{column.render(row)}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
      {sortedRows.length === 0 && <p className="lab-table-empty" role="status">{emptyMessage}</p>}
    </div>
  );
}
