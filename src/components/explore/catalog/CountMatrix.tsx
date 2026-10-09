import { useRef, type KeyboardEvent } from 'react';
import { cellKey, type CountMatrixData, type MatrixAxisItem } from './count-matrix';

interface Props {
  caption: string;
  /** What the rows are: "Technique family". */
  rowHeading: string;
  rows: readonly MatrixAxisItem[];
  columns: readonly MatrixAxisItem[];
  data: CountMatrixData;
  isCellPicked: (rowId: string, columnId: string) => boolean;
  /** Told which cell was pressed; the caller sets that cell's two filters, or clears them when it was already picked. */
  onPickCell: (rowId: string, columnId: string) => void;
}

export const TOTAL_HEADING = 'Distinct techniques';
const ARROW_STEPS: Readonly<Record<string, readonly [number, number]>> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };

function nameOf(item: MatrixAxisItem): string {
  return item.title ?? item.label;
}

function techniqueWord(count: number): string {
  return count === 1 ? 'technique' : 'techniques';
}

/** A total is printed only where there is something to count; a blank is never a zero. */
function Total({ count }: { count: number | undefined }) {
  return <td className="explore-matrix-total">{count !== undefined && count > 0 && <span className="lab-figure">{count}</span>}</td>;
}

/**
 * The catalog as integers on two axes, with totals of distinct techniques. A cell is a
 * button: pressing it narrows the catalog to that cell. An empty cell is left blank.
 */
export default function CountMatrix({ caption, rowHeading, rows, columns, data, isCellPicked, onPickCell }: Props) {
  const tableRef = useRef<HTMLTableElement>(null);

  /** Arrow keys walk the grid, skipping empty cells in the direction of travel. */
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, rowIndex: number, columnIndex: number): void => {
    const step = ARROW_STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    let row = rowIndex + step[0];
    let column = columnIndex + step[1];
    while (row >= 0 && row < rows.length && column >= 0 && column < columns.length) {
      const target = tableRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${row}-${column}"]`);
      if (target !== null && target !== undefined) { target.focus(); return; }
      row += step[0];
      column += step[1];
    }
  };

  const firstFilledKey = rows.flatMap((row) => columns.map((column) => cellKey(row.id, column.id))).find((key) => data.cells.has(key));
  return (
    <div className="explore-matrix-wrap">
      <table className="explore-matrix" ref={tableRef}>
        <caption className="lab-label">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{rowHeading}</th>
            {columns.map((column) => <th key={column.id} scope="col" title={column.title}>{column.label}</th>)}
            <th scope="col">{TOTAL_HEADING}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id}>
              <th scope="row" title={row.title}>{row.label}</th>
              {columns.map((column, columnIndex) => {
                const key = cellKey(row.id, column.id);
                const count = data.cells.get(key);
                if (count === undefined) return <td key={column.id} />;
                return (
                  <td key={column.id}>
                    <button
                      type="button" className="explore-matrix-cell lab-figure" data-cell={`${rowIndex}-${columnIndex}`} tabIndex={key === firstFilledKey ? 0 : -1}
                      aria-pressed={isCellPicked(row.id, column.id)} aria-label={`${nameOf(row)}, ${nameOf(column)}: ${count} ${techniqueWord(count)}`}
                      onClick={() => onPickCell(row.id, column.id)} onKeyDown={(event) => moveFocus(event, rowIndex, columnIndex)}
                    >
                      {count}
                    </button>
                  </td>
                );
              })}
              <Total count={data.rowTotals.get(row.id)} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{TOTAL_HEADING}</th>
            {columns.map((column) => <Total key={column.id} count={data.columnTotals.get(column.id)} />)}
            <Total count={data.total} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
