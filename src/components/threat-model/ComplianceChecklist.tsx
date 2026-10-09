import { CHECKLIST_TITLE } from '@/lib/threat-model/compliance-us';
import type {
  ComplianceItem, CyberDeviceAssessment, CyberDeviceConnectivity, RequirementApplicability, RequirementEvidence,
} from '@/lib/threat-model/report-types';

interface Props {
  assessment: CyberDeviceAssessment;
  items: readonly ComplianceItem[];
  /** False where the surrounding page already heads the section with the title. */
  isTitleShown?: boolean;
}

const APPLICABILITY_LABELS: Record<RequirementApplicability, string> = {
  required: 'Required by statute',
  recommended: 'Recommended by FDA guidance',
  not_required: 'Not required here',
  not_evaluated: 'Not evaluated',
  not_determined: 'Not determined by this tool',
};

const CONNECTIVITY_LABELS: Record<CyberDeviceConnectivity, string> = {
  meets: 'As modelled, it meets the connectivity part of the definition.',
  not_determined: 'Not determined by this tool.',
};

const EVIDENCE_LABELS: Record<RequirementEvidence, string> = {
  draft_in_this_report: 'A first draft is in this report',
  user_must_supply: 'You must supply this',
};

export default function ComplianceChecklist({ assessment, items, isTitleShown = true }: Props) {
  const sourceCount = assessment.checklistSources.length;
  return (
    <div>
      {isTitleShown && <h2 className="tm-heading">{CHECKLIST_TITLE}</h2>}
      <p className="tm-notice">
        This is a checklist of US requirements with their sources. It is not a compliance determination and not legal advice.
        Have a qualified regulatory professional review anything you file.
      </p>
      <p>{assessment.checklistStatus}</p>
      <p className="tm-muted">
        Not covered here: anything outside the {sourceCount} source{sourceCount === 1 ? '' : 's'} this list was built from.
      </p>
      <ul className="tm-list tm-muted">
        {assessment.checklistSources.map((source) => <li key={source.id}>{source.title}. Read {source.dateRead}.</li>)}
      </ul>
      <section className="tm-card">
        <h3 className="tm-heading">Is this a cyber device?</h3>
        <p>{CONNECTIVITY_LABELS[assessment.connectivity]}</p>
        <p className="tm-muted">{assessment.explanation}</p>
        <blockquote className="tm-quote">{assessment.connectivityQuote}</blockquote>
      </section>
      {items.map((item) => (
        <section key={item.requirementId} className="tm-card">
          <h3 className="tm-heading">{item.title}</h3>
          <div className="tm-actions" style={{ marginBottom: '0.5rem' }}>
            <span className={`tm-badge ${item.applicability === 'required' ? 'tm-badge--warning' : ''}`}>{APPLICABILITY_LABELS[item.applicability]}</span>
            <span className="tm-badge">{EVIDENCE_LABELS[item.evidence]}</span>
          </div>
          <p className="tm-muted">{item.applicabilityReason}</p>
          <h4 className="tm-subheading">What to do</h4>
          <p>{item.suggestedFix}</p>
          <h4 className="tm-subheading">Source</h4>
          <blockquote className="tm-quote">{item.supportingQuote}</blockquote>
          <p className="tm-muted tm-small">
            {item.instrument}. Read {item.dateRead}.{' '}
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open the source</a>
            <span className="tm-print-only"> {item.sourceUrl}</span>
          </p>
        </section>
      ))}
    </div>
  );
}
