import type { ReactNode } from 'react';
import { headingFor, type ReportSectionId } from './report-sections';

interface SectionProps {
  id: ReportSectionId;
  children: ReactNode;
}

/** One numbered section of the report. Flat, with a hairline above; it may break across pages. */
export function ReportSection({ id, children }: SectionProps) {
  const headingId = `report-${id}`;
  return (
    <section className="report-section" aria-labelledby={headingId}>
      <h2 className="report-heading" id={headingId}>{headingFor(id)}</h2>
      {children}
    </section>
  );
}

export interface ReportColumn<Row> {
  id: string;
  header: string;
  render: (row: Row) => ReactNode;
  /** Right-aligned, in tabular figures. */
  isFigure?: boolean;
}

interface TableProps<Row> {
  caption: string;
  columns: readonly ReportColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** What to say when there are no rows. It should say why, not only that. */
  emptyMessage: string;
}

/**
 * A table as a document prints it: nothing to operate, cells that wrap, a head the browser
 * repeats on every page, and rows that are not split across pages.
 */
export function ReportTable<Row>({ caption, columns, rows, rowKey, emptyMessage }: TableProps<Row>) {
  if (rows.length === 0) return <p className="lab-table-empty">{emptyMessage}</p>;
  return (
    <div className="lab-table-wrap report-table-wrap">
      <table className="lab-table report-table">
        <caption className="lab-label">{caption}</caption>
        <thead>
          <tr>{columns.map((column) => <th key={column.id} scope="col" data-figure={column.isFigure === true}><span className="lab-table-head">{column.header}</span></th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => <td key={column.id} className={column.isFigure === true ? 'lab-figure' : undefined} data-figure={column.isFigure === true}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
