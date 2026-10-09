import { SCOPE_TERM_LABELS } from '@/lib/threat-model/lab-terms';
import type { RiskRow } from '@/lib/threat-model/report-types';

interface Props {
  rows: readonly RiskRow[];
}

interface MatrixColumn {
  elementId: string;
  label: string;
}

/**
 * The attack map: catalog techniques down the side, device elements across the top,
 * a mark wherever a technique is placed. Severity is the catalog's own rating.
 */
export default function ThreatMatrix({ rows }: Props) {
  const catalogRows = rows.filter((row) => row.source === 'catalog' && row.catalogState === 'current');
  const columns: MatrixColumn[] = [...new Map(catalogRows.map((row) => [row.elementId, { elementId: row.elementId, label: row.elementLabel }])).values()];
  const techniques = [...new Map(catalogRows.map((row) => [row.techniqueId, row])).values()];
  const placedPairs = new Set(catalogRows.map((row) => `${row.techniqueId}|${row.elementId}`));

  if (techniques.length === 0) return <p className="tm-muted">No techniques are placed on this model.</p>;

  return (
    <div className="tm-table-wrap">
      <table className="tm-table">
        <caption className="tm-muted" style={{ captionSide: 'top', textAlign: 'left', marginBottom: '0.5rem' }}>
          Where each placed technique acts. A filled cell means the technique is placed on that part of the device.
        </caption>
        <thead>
          <tr>
            <th scope="col">Technique</th>
            <th scope="col">Severity</th>
            {columns.map((column) => <th key={column.elementId} scope="col">{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {techniques.map((technique) => (
            <tr key={technique.techniqueId}>
              <th scope="row" style={{ textTransform: 'none', letterSpacing: 0, fontSize: '0.8125rem', color: 'inherit', whiteSpace: 'normal' }}>
                {technique.title} <span className="tm-mono tm-muted">{technique.techniqueId}</span>
              </th>
              <td>{technique.catalogSeverity !== null && <span className={`tm-badge tm-badge--${technique.catalogSeverity}`}>{technique.catalogSeverity}</span>}</td>
              {columns.map((column) => {
                const isPlaced = placedPairs.has(`${technique.techniqueId}|${column.elementId}`);
                return (
                  <td key={column.elementId} style={{ textAlign: 'center' }}>
                    {isPlaced ? <span aria-label={SCOPE_TERM_LABELS.applies}>●</span> : <span aria-hidden="true" className="tm-muted">·</span>}
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
