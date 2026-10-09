import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { shownDirection, type DataTableColumn, type DataTableSort } from './data-table-sort';

interface Props<Row> {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  /** Already sorted by the table. */
  rows: readonly Row[];
  keys: readonly string[];
  emptyMessage: string;
  sort: DataTableSort | null;
  onSort: (columnId: string) => void;
  renderCard: (row: Row) => ReactNode;
  rowProps: (row: Row, index: number) => HTMLAttributes<HTMLElement>;
  attachContainer: (node: HTMLElement | null) => void;
}

/** The table's narrow-screen form: one card per row, with the sort the column headers would have offered. */
export default function DataTableCards<Row>({ caption, columns, rows, keys, emptyMessage, sort, onSort, renderCard, rowProps, attachContainer }: Props<Row>) {
  const captionId = useId();
  const sortableColumns = columns.filter((column) => column.sortValue !== undefined);
  return (
    <div>
      <p className="lab-label lab-cards-caption" id={captionId}>{caption}</p>
      {sortableColumns.length > 0 && (
        <div className="lab-facet-control" role="group" aria-label="Sort by">
          <span className="lab-label">Sort by</span>
          {sortableColumns.map((column) => {
            const isSorted = sort?.columnId === column.id;
            return (
              <button key={column.id} type="button" className="lab-chip" aria-pressed={isSorted} onClick={() => onSort(column.id)}>
                {column.header}{isSorted && sort !== null && <span>{shownDirection(column, sort.direction)}</span>}
              </button>
            );
          })}
        </div>
      )}
      <ul className="lab-cards" aria-labelledby={captionId} ref={attachContainer}>
        {rows.map((row, index) => <li key={keys[index]} className="lab-card" {...rowProps(row, index)}>{renderCard(row)}</li>)}
      </ul>
      {rows.length === 0 && <p className="lab-table-empty" role="status">{emptyMessage}</p>}
    </div>
  );
}
