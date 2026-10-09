import { useEffect, useRef } from 'react';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { MODEL_LIMITS, RISK_STATUSES, type RiskStatus } from '@/lib/threat-model/device-model';
import { NOT_SCORED_LABEL } from '@/lib/threat-model/register-csv';
import type { PrecedentCveEntry, RiskRow } from '@/lib/threat-model/report-types';
import { RISK_STATUS_LABELS } from './risk-status-labels';

interface Props {
  row: RiskRow;
  /** The catalog entry behind the row; undefined for a baseline row or a technique no longer in the catalog. */
  technique: CatalogTechnique | undefined;
  /** Why the technique is placed on this part, in the placement table's own words. */
  placementReasons: readonly string[];
  precedentCves: readonly PrecedentCveEntry[];
  precedentCvesAsOf: string;
  onDecide: (riskId: string, status: RiskStatus, note: string) => void;
  onClose: () => void;
}

/** Everything about one risk in one place: what it is, why it is here, what was seen elsewhere, and what you decided. */
export default function RiskDetail({ row, technique, placementReasons, precedentCves, precedentCvesAsOf, onDecide, onClose }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The panel opens in answer to a row, so reading continues here.
  useEffect(() => { headingRef.current?.focus(); }, [row.riskId]);

  return (
    <section className="lab-panel model-risk-detail" aria-labelledby="model-risk-heading" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>
      <div className="lab-panel-head">
        <h2 className="lab-panel-title" id="model-risk-heading" tabIndex={-1} ref={headingRef}>{row.title}</h2>
        <button type="button" className="tm-button" onClick={onClose}>Close</button>
      </div>
      <div className="lab-panel-body model-risk-body">
        <p className="lab-soft">On {row.elementLabel}{row.techniqueId !== null && <> · <span className="lab-id">{row.techniqueId}</span></>}</p>
        <p className="model-risk-facts">
          {row.evidenceStatus === null ? <span className="lab-soft">Generic baseline, not a catalog technique</span> : <EvidenceMark tier={technique?.evidenceTier ?? null} status={row.evidenceStatus} />}
          {row.catalogSeverity !== null && <SeverityMark severity={row.catalogSeverity} />}
        </p>
        {row.catalogState === 'missing' && <p className="tm-notice">This technique is no longer in the catalog. The row is kept so your decision is not lost.</p>}

        {placementReasons.length > 0 && (
          <>
            <h3 className="lab-label">Why it is placed here</h3>
            <p>{placementReasons.join(' ')}</p>
          </>
        )}

        <h3 className="lab-label">Scores</h3>
        <p className="lab-id model-risk-vector">{row.cvssBaseVector ?? NOT_SCORED_LABEL}</p>
        {row.nissScore !== null && <p className="lab-soft">NISS {row.nissScore}. NISS is a proposed score and is not peer reviewed.</p>}

        <h3 className="lab-label">CVEs in other products</h3>
        {precedentCves.length === 0 ? <p className="lab-soft">No CVE is linked to this technique in the mapping dated {precedentCvesAsOf}. That is not a finding about this device.</p> : (
          <>
            <p className="lab-soft">Found in other products and linked to this technique by the catalog, as of {precedentCvesAsOf}. Not findings about this device.</p>
            <ul className="model-risk-list">
              {precedentCves.map((cve) => <li key={cve.cveId}><span className="lab-id">{cve.cveId}</span> {cve.product}</li>)}
            </ul>
          </>
        )}

        <h3 className="lab-label">Detection note, from the catalog</h3>
        {row.detectionNote === null ? <p className="lab-soft">None recorded.</p> : <p>{row.detectionNote}</p>}
        <p className="lab-soft">Controls: none recorded for this row.</p>

        <h3 className="lab-label">Your decision</h3>
        <select className="tm-select" aria-label="Decision" value={row.status} onChange={(event) => onDecide(row.riskId, event.target.value as RiskStatus, row.note)}>
          {RISK_STATUSES.map((status) => <option key={status} value={status}>{RISK_STATUS_LABELS[status]}</option>)}
        </select>
        <input
          className="tm-input" style={{ marginTop: '0.375rem' }} type="text" placeholder="Note" aria-label="Note for this decision"
          maxLength={MODEL_LIMITS.maxNoteLength} value={row.note} onChange={(event) => onDecide(row.riskId, row.status, event.target.value)}
        />
      </div>
    </section>
  );
}
