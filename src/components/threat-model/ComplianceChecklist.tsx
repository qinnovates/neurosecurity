import { CHECKLIST_TITLE } from '@/lib/threat-model/compliance-us';
import type {
  ComplianceItem, CyberDeviceAssessment, CyberDeviceConnectivity, RequirementApplicability, RequirementEvidence,
} from '@/lib/threat-model/report-types';
import './report/report.css';
import './report/report-print.css';

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

/** Only a secure web address is made into a link; anything else is printed as text. */
const LINKABLE_URL_PATTERN = /^https:\/\//;

function SourceLine({ item }: { item: ComplianceItem }) {
  return (
    <p className="lab-soft">
      {item.instrument}. Read {item.dateRead}.{' '}
      {LINKABLE_URL_PATTERN.test(item.sourceUrl) && <a className="lab-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open the source</a>}
      <span className="report-print-only"> {item.sourceUrl}</span>
    </p>
  );
}

export default function ComplianceChecklist({ assessment, items, isTitleShown = true }: Props) {
  const sourceCount = assessment.checklistSources.length;
  return (
    <div className="report-checklist" id={isTitleShown ? 'lab-results' : undefined}>
      {isTitleShown && <h2 className="lab-title">{CHECKLIST_TITLE}</h2>}
      <p className="lab-notice">
        This is a checklist of US requirements with their sources. It is not a compliance determination and not legal advice.
        Have a qualified regulatory professional review anything you file.
      </p>
      <p>{assessment.checklistStatus}</p>
      <p className="lab-soft">
        Not covered here: anything outside the {sourceCount} source{sourceCount === 1 ? '' : 's'} this list was built from.
      </p>
      <ul className="report-list lab-soft">
        {assessment.checklistSources.map((source) => <li key={source.id}>{source.title}. Read {source.dateRead}.</li>)}
      </ul>
      <section className="report-item">
        <h3 className="report-subheading">Is this a cyber device?</h3>
        <p>{CONNECTIVITY_LABELS[assessment.connectivity]}</p>
        <p className="lab-soft">{assessment.explanation}</p>
        <blockquote className="report-quote">{assessment.connectivityQuote}</blockquote>
      </section>
      {items.map((item) => (
        <section key={item.requirementId} className="report-item">
          <h3 className="report-subheading">{item.title}</h3>
          <p className="report-step-meta">
            <span className="report-tag">{APPLICABILITY_LABELS[item.applicability]}</span>
            <span className="report-tag">{EVIDENCE_LABELS[item.evidence]}</span>
          </p>
          <p className="lab-soft">{item.applicabilityReason}</p>
          <h4 className="lab-label">What to do</h4>
          <p>{item.suggestedFix}</p>
          <h4 className="lab-label">Source</h4>
          <blockquote className="report-quote">{item.supportingQuote}</blockquote>
          <SourceLine item={item} />
        </section>
      ))}
    </div>
  );
}
