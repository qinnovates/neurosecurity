import { NOT_SCORED_LABEL } from '@/lib/threat-model/register-csv';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';
import { RISK_STATUS_LABELS } from './risk-status-labels';

interface Props {
  rows: readonly RiskRow[];
  controlsInPlace: readonly string[];
}

function ControlList({ row, controlsInPlace }: { row: RiskRow; controlsInPlace: readonly string[] }) {
  if (row.controls.length === 0) return <span className="tm-muted tm-small">None suggested</span>;
  return (
    <ul className="tm-list">
      {row.controls.map((control) => <li key={control}>{control}{controlsInPlace.includes(control) ? ' (in place)' : ''}</li>)}
    </ul>
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
      {row.precedentCveIds.length > 0 && <div className="tm-muted tm-small">Precedent CVEs in similar products: {row.precedentCveIds.length}</div>}
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
export default function RiskRegister({ rows, controlsInPlace }: Props) {
  if (rows.length === 0) return <p className="tm-muted">No rows to show here.</p>;
  return (
    <div className="tm-table-wrap">
      <table className="tm-table">
        <thead>
          <tr><th>Threat</th><th>Evidence</th><th>Score</th><th>Suggested controls</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.riskId} className={isRiskAddressed(row, controlsInPlace) ? 'tm-row--addressed' : undefined}>
              <td><ThreatCell row={row} /></td>
              <td>{row.evidenceStatus ?? <span className="tm-muted tm-small">Generic baseline</span>}</td>
              <td><ScoreCell row={row} /></td>
              <td><ControlList row={row} controlsInPlace={controlsInPlace} /></td>
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
