import { useMemo } from 'react';
import EmptyState from '@/components/lab-kit/EmptyState';
import HatchSwatch from '@/components/lab-kit/HatchSwatch';
import Legend from '@/components/lab-kit/Legend';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import type { ModelElement } from '@/lib/threat-model/model-order';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import { isZeroNotAssessed } from './frame/facet-counts';
import { buildTechniqueMatrix, type MatrixLine, type MatrixTotals } from './frame/technique-matrix';
import { useModelHighlight } from './model-highlight';
import { RISK_STATUS_LABELS } from './risk-status-labels';

interface Props {
  rows: readonly RiskRow[];
  /** Every part and connection in model order. Left out, the columns are the elements that carry a row. */
  elements?: readonly ModelElement[];
  /** When set, a cell opens its row. */
  onOpenRow?: (riskId: string) => void;
  /** When set, a technique's ID opens the technique. */
  onOpenTechnique?: (techniqueId: string) => void;
  /** True when some catalog technique has no placement decision, so an empty column cannot be read as "none". */
  isCoverageIncomplete?: boolean;
}

const MARK_PX = 12;
const DECIDED_LABEL = 'Decision recorded';
const NOT_ASSESSED_LABEL = 'Not assessed';
const CAPTION = 'Where each placed technique acts.';

/** A filled square is a row still open; an outlined one has a decision recorded. */
function DecisionMark({ isOpen }: { isOpen: boolean }) {
  return (
    <svg className="model-matrix-mark" width={MARK_PX} height={MARK_PX} viewBox={`0 0 ${MARK_PX} ${MARK_PX}`} aria-hidden="true" focusable="false">
      <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill={isOpen ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Totals({ totals, isCoverageIncomplete }: { totals: MatrixTotals; isCoverageIncomplete: boolean }) {
  if (isZeroNotAssessed(totals.rows, isCoverageIncomplete)) return <HatchSwatch label={NOT_ASSESSED_LABEL} />;
  return <span className="lab-figure">{totals.open} of {totals.rows}</span>;
}

function MatrixCell({ row, onOpenRow }: { row: RiskRow | null; onOpenRow: Props['onOpenRow'] }) {
  if (row === null) return null;
  const isOpen = !isRiskAddressed(row);
  const name = `${row.title} on ${row.elementLabel}: ${isOpen ? RISK_STATUS_LABELS.open : `${DECIDED_LABEL}, ${RISK_STATUS_LABELS[row.status]}`}`;
  if (onOpenRow === undefined) return <span role="img" aria-label={name}><DecisionMark isOpen={isOpen} /></span>;
  return <button type="button" className="model-matrix-cell" aria-label={name} onClick={() => onOpenRow(row.riskId)}><DecisionMark isOpen={isOpen} /></button>;
}

function TechniqueHead({ line, onOpenTechnique }: { line: MatrixLine; onOpenTechnique: Props['onOpenTechnique'] }) {
  return (
    <th scope="row">
      <span className="model-matrix-technique">
        {line.severity !== null && <SeverityMark severity={line.severity} isLabelHidden />}
        <span className="model-matrix-title">{line.title}</span>
        {onOpenTechnique === undefined
          ? <span className="lab-id">{line.techniqueId}</span>
          : <TechniqueLink techniqueId={line.techniqueId} techniqueName={line.title} onOpen={onOpenTechnique} />}
      </span>
    </th>
  );
}

/**
 * Techniques by part: one line per technique, one column per part or connection in model
 * order, a mark where the technique is placed, and the open rows of every line and column.
 */
export default function ThreatMatrix({ rows, elements, onOpenRow, onOpenTechnique, isCoverageIncomplete = false }: Props) {
  const matrix = useMemo(() => buildTechniqueMatrix(rows, elements), [rows, elements]);
  const highlight = useModelHighlight();

  if (matrix.lines.length === 0) {
    return (
      <EmptyState
        reason="nothing-shown" title="No risk of this kind matches the part and lenses chosen."
        action={<p>Nothing is hidden beyond them; choose "Show everything" to see the rest.</p>}
      />
    );
  }

  return (
    <div className="model-matrix-wrap">
      <table className="lab-table model-matrix">
        <caption className="lab-label">{CAPTION}</caption>
        <thead>
          <tr>
            <th scope="col"><span className="lab-table-head">Technique</span></th>
            {matrix.columns.map((column) => (
              <th key={column.id} scope="col" className="model-matrix-column" {...highlight.bind(column.id)}><span className="lab-table-head">{column.label}</span></th>
            ))}
            <th scope="col"><span className="lab-table-head">Open rows</span></th>
          </tr>
        </thead>
        <tbody>
          {matrix.lines.map((line) => (
            <tr key={line.techniqueId}>
              <TechniqueHead line={line} onOpenTechnique={onOpenTechnique} />
              {line.cells.map((row, index) => (
                <td key={matrix.columns[index].id} className="model-matrix-slot" data-lit={highlight.isLit(matrix.columns[index].id)}><MatrixCell row={row} onOpenRow={onOpenRow} /></td>
              ))}
              <td><Totals totals={line} isCoverageIncomplete={false} /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Open rows</th>
            {matrix.columnTotals.map((totals, index) => (
              <td key={matrix.columns[index].id} className="model-matrix-slot"><Totals totals={totals} isCoverageIncomplete={isCoverageIncomplete} /></td>
            ))}
            <td />
          </tr>
        </tfoot>
      </table>
      <Legend
        label="Marks in the table"
        items={[
          { id: 'open', mark: <DecisionMark isOpen />, name: RISK_STATUS_LABELS.open },
          { id: 'decided', mark: <DecisionMark isOpen={false} />, name: DECIDED_LABEL },
        ]}
      />
    </div>
  );
}
