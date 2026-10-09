import { useId } from 'react';
import EvidenceMark from '@/components/lab-kit/EvidenceMark';
import SeverityMark from '@/components/lab-kit/SeverityMark';
import TechniqueLink from '@/components/lab-kit/TechniqueLink';
import type { CatalogTechnique } from '@/lib/threat-model/catalog-types';
import { MODEL_LIMITS, RISK_STATUSES, type RiskStatus } from '@/lib/threat-model/device-model';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { NOT_SCORED_LABEL } from '@/lib/threat-model/register-csv';
import type { PrecedentCveEntry, RiskRow } from '@/lib/threat-model/report-types';
import { NOTE_REQUIRED_STATEMENT, NOT_RECORDED_STATEMENT, isNoteRequired } from './frame/decision-rules';
import { CVE_HEADING } from './frame/register-columns';
import { useDecisionDraft } from './frame/use-decision-draft';
import { RISK_STATUS_LABELS } from './risk-status-labels';

interface Props {
  row: RiskRow;
  /** The catalog entry behind the row; undefined for a baseline row. */
  technique: CatalogTechnique | undefined;
  /** Why the technique is placed on this part, in the placement table's own words. */
  placementReasons: readonly string[];
  precedentCves: readonly PrecedentCveEntry[];
  precedentCvesAsOf: string;
  /** A decision chosen on the row that is waiting for its note. */
  pendingStatus?: RiskStatus | null;
  onDecide: (riskId: string, status: RiskStatus, note: string) => void;
  onOpenTechnique: (techniqueId: string) => void;
}

export const SOURCE_NOT_RECORDED_LABEL = 'Source not recorded';
const NOTE_ROWS = 3;

function DecisionForm({ row, pendingStatus, onDecide }: Pick<Props, 'row' | 'onDecide'> & { pendingStatus: RiskStatus | null }) {
  const draft = useDecisionDraft(row, pendingStatus, onDecide);
  const statusId = useId();
  const noteId = useId();
  const requirementId = useId();
  return (
    <section className="model-risk-decision" aria-label="Your decision">
      <div className="lab-field">
        <label className="lab-label" htmlFor={statusId}>Decision</label>
        <select id={statusId} className="lab-input" value={draft.status} onChange={(event) => draft.change(event.target.value as RiskStatus, draft.note)}>
          {RISK_STATUSES.map((status) => <option key={status} value={status}>{RISK_STATUS_LABELS[status]}</option>)}
        </select>
      </div>
      <div className="lab-field">
        <label className="lab-label" htmlFor={noteId}>Note for this decision</label>
        <textarea
          id={noteId} className="lab-input" rows={NOTE_ROWS} maxLength={MODEL_LIMITS.maxNoteLength} value={draft.note}
          aria-required={isNoteRequired(draft.status)} aria-invalid={draft.isNoteMissing} aria-describedby={requirementId}
          onChange={(event) => draft.change(draft.status, event.target.value)}
        />
      </div>
      <p id={requirementId} className={draft.isNoteMissing ? 'lab-notice' : 'lab-soft'} role={draft.isNoteMissing ? 'alert' : undefined}>
        {NOTE_REQUIRED_STATEMENT}{draft.isNoteMissing && <> {NOT_RECORDED_STATEMENT}</>}
      </p>
    </section>
  );
}

function EvidenceLines({ row, technique }: Pick<Props, 'row' | 'technique'>) {
  if (row.source === 'stride') return <p className="lab-soft">Generic baseline, not a catalog technique</p>;
  const evidence = describeEvidence(technique ?? row, { isDeviceRow: true });
  const lines = [evidence.provenanceLine, evidence.cveLine, evidence.placementLine].filter((line): line is string => line !== null);
  return (
    <>
      <p className="model-risk-facts">
        <EvidenceMark tier={row.evidenceTier} status={row.evidenceStatus} />
        {row.catalogSeverity !== null && <SeverityMark severity={row.catalogSeverity} />}
      </p>
      {lines.map((line) => <p key={line} className="lab-soft">{line}</p>)}
    </>
  );
}

function CveList({ precedentCves, precedentCvesAsOf }: Pick<Props, 'precedentCves' | 'precedentCvesAsOf'>) {
  if (precedentCves.length === 0) {
    return <p className="lab-soft">No CVE is linked to this technique in the mapping dated {precedentCvesAsOf}. That is not a finding about this device.</p>;
  }
  return (
    <>
      <p className="lab-soft">Found in other products and linked to this technique by the catalog, as of {precedentCvesAsOf}. Not findings about this device.</p>
      <ul className="model-risk-list">
        {precedentCves.map((cve) => (
          <li key={cve.cveId}>
            <span className="lab-id">{cve.cveId}</span> {cve.product}{' '}
            <span className="lab-soft">{cve.cvssScore === null ? NOT_SCORED_LABEL : <>CVSS <span className="lab-figure">{cve.cvssScore}</span></>}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * One risk, read in the order it is worked: the decision and its note first, then why the
 * row is here, what the evidence is, where it comes from, and what was seen in other products.
 */
export default function RiskDetail({ row, technique, placementReasons, precedentCves, precedentCvesAsOf, pendingStatus = null, onDecide, onOpenTechnique }: Props) {
  const sources = technique?.sources ?? [];
  return (
    <div className="model-risk-body">
      <DecisionForm row={row} pendingStatus={pendingStatus} onDecide={onDecide} />
      <p className="lab-soft">
        On {row.elementLabel}
        {row.techniqueId !== null && <> · <TechniqueLink techniqueId={row.techniqueId} techniqueName={row.title} onOpen={onOpenTechnique} /></>}
      </p>

      {placementReasons.length > 0 && (
        <>
          <h3 className="lab-label">Why it is placed here</h3>
          <p>{placementReasons.join(' ')}</p>
        </>
      )}

      <h3 className="lab-label">Evidence</h3>
      <EvidenceLines row={row} technique={technique} />

      {row.source === 'catalog' && (
        <>
          <h3 className="lab-label">Sources, as recorded</h3>
          {sources.length === 0 ? <p className="lab-soft">{SOURCE_NOT_RECORDED_LABEL}</p> : (
            <ul className="model-risk-list">{sources.map((source) => <li key={source}>{source}</li>)}</ul>
          )}

          <h3 className="lab-label">Detection note, from the catalog</h3>
          {row.detectionNote === null ? <p className="lab-soft">None recorded.</p> : <p>{row.detectionNote}</p>}
        </>
      )}
      <p className="lab-soft">Controls: none recorded for this row.</p>

      {row.source === 'catalog' && (
        <>
          <h3 className="lab-label">{CVE_HEADING}</h3>
          <CveList precedentCves={precedentCves} precedentCvesAsOf={precedentCvesAsOf} />

          <h3 className="lab-label">Scores</h3>
          {row.cvssBaseVector === null ? <p className="lab-soft">{NOT_SCORED_LABEL}</p> : <p className="lab-id model-risk-vector">{row.cvssBaseVector}</p>}
          {row.nissScore !== null && <p className="lab-soft">NISS {row.nissScore}. NISS is a proposed score and is not peer reviewed.</p>}
        </>
      )}
    </div>
  );
}
