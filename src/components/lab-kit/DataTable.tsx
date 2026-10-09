import { useCallback, useImperativeHandle, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode, type Ref } from 'react';
import DataTableCards from './DataTableCards';
import { nextSort, sortRows, type DataTableColumn, type DataTableSort } from './data-table-sort';
import { useListReflow } from './motion/use-list-reflow';
import { useMediaQuery } from './use-media-query';
import { useRowFocus } from './use-row-focus';

export type { DataTableColumn, DataTableSort, SortDirection } from './data-table-sort';

/** What a parent can ask of the table through its ref. */
export interface DataTableHandle {
  /** Moves focus to the row with this key, for example when the drawer it opened closes. False when the row is not shown. */
  focusRow: (key: string) => boolean;
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
  /** The sort, when the parent keeps it so it survives a change of view. Leave out and the table keeps its own. */
  sort?: DataTableSort | null;
  /** Told of every sort the reader asks for, whether or not the parent keeps it. */
  onSortChange?: (sort: DataTableSort) => void;
  /** The key of the row the reader has open, drawn as selected. */
  openedKey?: string | null;
  /** Rows this returns true for are lit, because the same item is pointed at in another view. */
  isRowLit?: (row: Row) => boolean;
  /** Told which row is under the pointer or holds focus, and null when none is, so another view can light its partner. */
  onRowPoint?: (row: Row | null) => void;
  /** Under 720px each row is drawn with this in place of table cells. Leave out and the table scrolls sideways. */
  renderCard?: (row: Row) => ReactNode;
  ref?: Ref<DataTableHandle>;
}

/** Controls inside a row keep their own clicks and keys; only the row itself opens. */
const ROW_CONTROL_SELECTOR = 'select, input, button, a, label, textarea';
const NARROW_SCREEN_QUERY = '(max-width: 719.98px)';

/**
 * The Lab's table: a header that stays put, sortable columns, and rows that can be walked
 * with the arrow keys. Rows slide to their new place when the set or the order changes.
 */
export default function DataTable<Row>({ caption, columns, rows, rowKey, emptyMessage, onOpenRow, isRowQuiet, sort: givenSort, onSortChange, openedKey = null, isRowLit, onRowPoint, renderCard, ref }: Props<Row>) {
  const [ownSort, setOwnSort] = useState<DataTableSort | null>(null);
  const sort = givenSort === undefined ? ownSort : givenSort;
  const isNarrow = useMediaQuery(NARROW_SCREEN_QUERY);
  const containerRef = useRef<HTMLElement | null>(null);
  const attachContainer = useCallback((node: HTMLElement | null): void => { containerRef.current = node; }, []);

  const sortedRows = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort]);
  const keys = sortedRows.map(rowKey);
  useListReflow(containerRef, keys.join('\n'));
  const { tabStopKey, rememberFocus, focusRow, moveFocus } = useRowFocus(containerRef, keys);
  useImperativeHandle(ref, () => ({ focusRow }), [focusRow]);

  const changeSort = (columnId: string): void => {
    const requested = nextSort(sort, columnId);
    setOwnSort(requested);
    onSortChange?.(requested);
  };
  const handleRowKey = (event: KeyboardEvent<HTMLElement>, row: Row, index: number): void => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' && onOpenRow !== undefined) onOpenRow(row);
    else moveFocus(event, index);
  };
  const handleRowClick = (event: MouseEvent<HTMLElement>, row: Row): void => {
    if (event.target instanceof Element && event.target.closest(ROW_CONTROL_SELECTOR) !== null) return;
    onOpenRow?.(row);
  };
  /** Everything a row needs to be walked, opened and re-flowed, whether it is drawn as a table row or a card. */
  const rowProps = (row: Row, index: number): HTMLAttributes<HTMLElement> & Record<`data-${string}`, string | boolean> => {
    const key = keys[index];
    return {
      'data-reflow-key': key, 'data-openable': onOpenRow !== undefined, 'data-quiet': isRowQuiet?.(row) === true,
      'data-lit': isRowLit?.(row) === true, 'aria-current': key === openedKey ? 'true' : undefined, tabIndex: key === tabStopKey ? 0 : -1,
      onFocus: () => { rememberFocus(key); onRowPoint?.(row); }, onBlur: () => onRowPoint?.(null),
      onPointerEnter: () => onRowPoint?.(row), onPointerLeave: () => onRowPoint?.(null),
      onKeyDown: (event) => handleRowKey(event, row, index),
      onClick: onOpenRow === undefined ? undefined : (event) => handleRowClick(event, row),
    };
  };

  if (isNarrow && renderCard !== undefined) {
    return (
      <DataTableCards
        caption={caption} columns={columns} rows={sortedRows} keys={keys} emptyMessage={emptyMessage} sort={sort} onSort={changeSort}
        renderCard={renderCard} rowProps={rowProps} attachContainer={attachContainer}
      />
    );
  }

  return (
    <div className="lab-table-wrap">
      <table className="lab-table">
        <caption className="lab-label">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col" aria-sort={sort?.columnId === column.id ? sort.direction : undefined}>
                {column.sortValue === undefined ? <span className="lab-table-head">{column.header}</span> : (
                  <button type="button" className="lab-table-sort" onClick={() => changeSort(column.id)}>
                    {column.header}
                    {sort?.columnId === column.id && <span aria-hidden="true">{sort.direction === 'ascending' ? '↑' : '↓'}</span>}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody ref={attachContainer}>
          {sortedRows.map((row, index) => (
            <tr key={keys[index]} {...rowProps(row, index)}>
              {columns.map((column) => <td key={column.id}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {sortedRows.length === 0 && <p className="lab-table-empty" role="status">{emptyMessage}</p>}
    </div>
  );
}
