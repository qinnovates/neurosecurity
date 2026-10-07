import { useState } from 'react';
import { MODEL_LIMITS, RISK_STATUSES, type RiskStatus } from '@/lib/threat-model/device-model';
import { NOT_SCORED_LABEL } from '@/lib/threat-model/register-csv';
import type { RiskRow } from '@/lib/threat-model/report-types';
import { isRiskAddressed } from '@/lib/threat-model/risk-register';

type SourceFilter = 'catalog' | 'stride' | 'all';

interface Props {
  rows: readonly RiskRow[];
  controlsInPlace: readonly string[];
  /** Omit to render a read-only register, as in the printed report. */
  onDecide?: (riskId: string, status: RiskStatus, note: string) => void;
  onToggleControl?: (control: string) => void;
}

const STATUS_LABELS: Record<RiskStatus, string> = {
  open: 'Open',
  mitigated: 'Mitigated',
  accepted: 'Accepted',
  not_applicable: 'Not applicable',
};

const FILTER_LABELS: Record<SourceFilter, string> = {
  catalog: 'Neural techniques',
  stride: 'STRIDE baseline',
  all: 'All',
};

function ControlList({ row, controlsInPlace, onToggleControl }: { row: RiskRow; controlsInPlace: readonly string[]; onToggleControl?: (control: string) => void }) {
  if (row.controls.length === 0) return <span className="tm-muted tm-small">None suggested</span>;
  return (
    <>
      {row.controls.map((control) => (
        <label key={control} className="tm-check">
          <input
            type="checkbox" checked={controlsInPlace.includes(control)} disabled={onToggleControl === undefined}
            onChange={() => onToggleControl?.(control)}
          />
          <span>{control}</span>
        </label>
      ))}
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

export default function RiskRegister({ rows, controlsInPlace, onDecide, onToggleControl }: Props) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('catalog');
  const isReadOnly = onDecide === undefined;
  const visibleRows = rows.filter((row) => isReadOnly || sourceFilter === 'all' || row.source === sourceFilter);

  return (
    <div>
      {!isReadOnly && (
        <div className="tm-tabs tm-no-print" role="group" aria-label="Register rows to show">
          {(Object.keys(FILTER_LABELS) as SourceFilter[]).map((filter) => (
            <button key={filter} type="button" className="tm-tab" aria-pressed={sourceFilter === filter} onClick={() => setSourceFilter(filter)}>
              {FILTER_LABELS[filter]}
            </button>
          ))}
        </div>
      )}
      {visibleRows.length === 0 && <p className="tm-muted">No rows to show here.</p>}
      {visibleRows.length > 0 && (
        <div className="tm-table-wrap">
          <table className="tm-table">
            <thead>
              <tr><th>Threat</th><th>Evidence</th><th>Score</th><th>Suggested controls</th><th>Status</th></tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.riskId} className={isRiskAddressed(row, controlsInPlace) ? 'tm-row--addressed' : undefined}>
                  <td><ThreatCell row={row} /></td>
                  <td>{row.evidenceStatus ?? <span className="tm-muted tm-small">Generic baseline</span>}</td>
                  <td><ScoreCell row={row} /></td>
                  <td><ControlList row={row} controlsInPlace={controlsInPlace} onToggleControl={onToggleControl} /></td>
                  <td>
                    {isReadOnly ? STATUS_LABELS[row.status] : (
                      <select className="tm-select" aria-label={`Status of ${row.title}`} value={row.status} onChange={(event) => onDecide(row.riskId, event.target.value as RiskStatus, row.note)}>
                        {RISK_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                      </select>
                    )}
                    {isReadOnly ? (row.note !== '' && <div className="tm-muted tm-small">{row.note}</div>) : (
                      <input
                        className="tm-input" style={{ marginTop: '0.25rem' }} type="text" placeholder="Note" aria-label={`Note for ${row.title}`}
                        maxLength={MODEL_LIMITS.maxNoteLength} value={row.note}
                        onChange={(event) => onDecide(row.riskId, row.status, event.target.value)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
