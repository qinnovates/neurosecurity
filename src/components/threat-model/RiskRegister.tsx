import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { NOT_SCORED_LABEL } from '@/lib/threat-model/register-csv';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import { RISK_STATUS_LABELS } from './risk-status-labels';

interface Props {
  rows: readonly RiskRow[];
}

function DetectionNoteCell({ row }: { row: RiskRow }) {
  return (
    <>
      {row.detectionNote === null ? <span className="tm-muted tm-small">None recorded</span> : row.detectionNote}
      <div className="tm-muted tm-small">Controls: none recorded for this row.</div>
    </>
  );
}

function ThreatCell({ row }: { row: RiskRow }) {
  return (
    <>
      <div>{row.title}</div>
      <div className="tm-muted tm-small">
        {row.elementLabel}
        {row.techniqueId !== null && <> · <span className="tm-mono">{row.techniqueId}</span></>}
      </div>
      {row.catalogState === 'missing' && <span className="tm-badge tm-badge--warning">No longer in the catalog</span>}
      {row.precedentCveIds.length > 0 && <div className="tm-muted tm-small">CVEs in other products: {row.precedentCveIds.length}</div>}
    </>
  );
}

function ScoreCell({ row }: { row: RiskRow }) {
  return (
    <>
      {row.catalogSeverity !== null && <span className={`tm-badge tm-badge--${row.catalogSeverity}`}>{row.catalogSeverity}</span>}
      <div className="tm-mono">{row.cvssBaseVector ?? NOT_SCORED_LABEL}</div>
      {row.nissScore !== null && <div className="tm-muted tm-small">NISS annex: {row.nissScore}</div>}
    </>
  );
}

/** The whole register as it is printed in the report: every row, every column, nothing to operate. */
export default function RiskRegister({ rows }: Props) {
  if (rows.length === 0) return <p className="tm-muted">No rows to show here.</p>;
  return (
    <div className="tm-table-wrap">
      <table className="tm-table">
        <thead>
          <tr><th>Threat</th><th>Evidence</th><th>Score</th><th>Detection note, from the catalog</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.riskId} className={isRiskAddressed(row) ? 'tm-row--addressed' : undefined}>
              <td><ThreatCell row={row} /></td>
              <td>{row.source === 'catalog' ? describeEvidence(row).label : <span className="tm-muted tm-small">Generic baseline</span>}</td>
              <td><ScoreCell row={row} /></td>
              <td><DetectionNoteCell row={row} /></td>
              <td>
                {RISK_STATUS_LABELS[row.status]}
                {row.note !== '' && <div className="tm-muted tm-small">{row.note}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
