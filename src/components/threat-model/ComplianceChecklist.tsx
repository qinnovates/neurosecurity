import type { ComplianceItem, CyberDeviceAssessment, RequirementApplicability, RequirementEvidence } from '@/lib/threat-model/report-types';

interface Props {
  assessment: CyberDeviceAssessment;
  items: readonly ComplianceItem[];
}

const APPLICABILITY_LABELS: Record<RequirementApplicability, string> = {
  required: 'Required by statute',
  recommended: 'Recommended by FDA guidance',
  not_required: 'Not required here',
};

const EVIDENCE_LABELS: Record<RequirementEvidence, string> = {
  draft_in_this_report: 'A first draft is in this report',
  user_must_supply: 'You must supply this',
};

export default function ComplianceChecklist({ assessment, items }: Props) {
  return (
    <div>
      <p className="tm-notice">
        This is a checklist of US requirements with their sources. It is not a compliance determination and not legal advice.
        Have a qualified regulatory professional review anything you file.
      </p>
      <section className="tm-card">
        <h3 className="tm-heading">Is this a cyber device?</h3>
        <p>{assessment.isCyberDevice ? 'As modelled, it meets the connectivity part of the definition.' : 'As modelled, it does not meet the connectivity part of the definition.'}</p>
        <p className="tm-muted">{assessment.explanation}</p>
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
