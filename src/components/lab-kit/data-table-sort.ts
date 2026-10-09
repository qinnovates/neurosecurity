import type { ReactNode } from 'react';

export interface DataTableColumn<Row> {
  id: string;
  header: string;
  render: (row: Row) => ReactNode;
  /** Makes the column sortable. Numbers sort numerically, strings by locale. */
  sortValue?: (row: Row) => string | number;
}

export type SortDirection = 'ascending' | 'descending';

export interface DataTableSort {
  columnId: string;
  direction: SortDirection;
}

function compareValues(left: string | number, right: string | number): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right));
}

/** A first press sorts ascending; a second press on the same column reverses it. */
export function nextSort(current: DataTableSort | null, columnId: string): DataTableSort {
  const isReversal = current?.columnId === columnId && current.direction === 'ascending';
  return { columnId, direction: isReversal ? 'descending' : 'ascending' };
}

/** The rows in sorted order, or as given when there is no sort or the column cannot be sorted. */
export function sortRows<Row>(rows: readonly Row[], columns: readonly DataTableColumn<Row>[], sort: DataTableSort | null): readonly Row[] {
  const sortValue = columns.find((column) => column.id === sort?.columnId)?.sortValue;
  if (sort === null || sortValue === undefined) return rows;
  const sign = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((left, right) => sign * compareValues(sortValue(left), sortValue(right)));
}
