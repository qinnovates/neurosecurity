import { useRef, type KeyboardEvent } from 'react';
import { EvidenceGlyph } from '@/components/lab-kit/EvidenceMark';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';

export interface MatrixAxisItem {
  id: string;
  label: string;
  /** A longer name for the tooltip, when the label is a code. */
  title?: string;
}

interface Props {
  caption: string;
  rows: readonly MatrixAxisItem[];
  columns: readonly MatrixAxisItem[];
  techniquesAt: (rowId: string, columnId: string) => readonly CatalogTechnique[];
  onPickCell: (rowId: string, columnId: string) => void;
}

/** A cell draws this many marks and then counts the rest, so one crowded cell cannot stretch the table. */
const MAX_MARKS_PER_CELL = 30;
const ARROW_STEPS: Record<string, readonly [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };

/**
 * The catalog laid out on two axes, one mark per technique, each drawn with its evidence.
 * A dense cell and a sparse cell use the same mark, so a cell with one technique reads as sparse, not broken.
 */
export default function MarkMatrix({ caption, rows, columns, techniquesAt, onPickCell }: Props) {
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

  let hasTabStop = false;
  return (
    <div className="mark-matrix-wrap">
      <table className="mark-matrix" ref={tableRef}>
        <caption className="lab-label">{caption}</caption>
        <thead>
          <tr>
            <td />
            {columns.map((column) => <th key={column.id} scope="col" title={column.title}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id}>
              <th scope="row" title={row.title}>{row.label}</th>
              {columns.map((column, columnIndex) => {
                const techniques = techniquesAt(row.id, column.id);
                if (techniques.length === 0) return <td key={column.id} />;
                const isTabStop = !hasTabStop;
                hasTabStop = true;
                const sorted = [...techniques].sort((left, right) => describeEvidence(left).rank - describeEvidence(right).rank);
                return (
                  <td key={column.id}>
                    <button
                      type="button" className="mark-matrix-cell" data-cell={`${rowIndex}-${columnIndex}`} tabIndex={isTabStop ? 0 : -1}
                      aria-label={`${row.title ?? row.label}, ${column.title ?? column.label}: ${techniques.length} technique${techniques.length === 1 ? '' : 's'}. Show them in the table.`}
                      onClick={() => onPickCell(row.id, column.id)} onKeyDown={(event) => moveFocus(event, rowIndex, columnIndex)}
                    >
                      {sorted.slice(0, MAX_MARKS_PER_CELL).map((technique) => <EvidenceGlyph key={technique.id} evidence={describeEvidence(technique)} isDecorative />)}
                      {sorted.length > MAX_MARKS_PER_CELL && <span className="mark-matrix-more">+{sorted.length - MAX_MARKS_PER_CELL}</span>}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
