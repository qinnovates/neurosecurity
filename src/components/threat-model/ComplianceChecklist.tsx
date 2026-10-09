import { useState } from 'react';
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
      {LINKABLE_URL_PATTERN.test(item.sourceUrl) && <a className="lab-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open the source: ${item.title}`}>Open the source</a>}
      <span className="report-print-only"> {item.sourceUrl}</span>
    </p>
  );
}

const CYBER_DEVICE_ID = 'cyber-device';
const CYBER_DEVICE_TITLE = 'Is this a cyber device?';

function CyberDeviceItem({ assessment, isSelected }: { assessment: CyberDeviceAssessment; isSelected: boolean }) {
  return (
    <section className="report-item" id={`checklist-${CYBER_DEVICE_ID}`} data-selected={isSelected}>
      <h3 className="report-subheading">{CYBER_DEVICE_TITLE}</h3>
      <p>{CONNECTIVITY_LABELS[assessment.connectivity]}</p>
      <p className="lab-soft">{assessment.explanation}</p>
      <blockquote className="report-quote">{assessment.connectivityQuote}</blockquote>
    </section>
  );
}

function RequirementItem({ item, isSelected }: { item: ComplianceItem; isSelected: boolean }) {
  return (
    <section className="report-item" id={`checklist-${item.requirementId}`} data-selected={isSelected}>
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
  );
}

/** How many requirements stand under each status, in the order the statuses are defined; a status with none is left out. */
export function countByApplicability(items: readonly ComplianceItem[]): { applicability: RequirementApplicability; label: string; count: number }[] {
  return (Object.keys(APPLICABILITY_LABELS) as RequirementApplicability[])
    .map((applicability) => ({ applicability, label: APPLICABILITY_LABELS[applicability], count: items.filter((item) => item.applicability === applicability).length }))
    .filter((entry) => entry.count > 0);
}

interface NavProps {
  items: readonly ComplianceItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Every requirement by title with its status, under a count of each status. Choosing one shows it beside the list. */
function ChecklistNav({ items, selectedId, onSelect }: NavProps) {
  return (
    <nav className="checklist-nav" aria-label="Requirements">
      <ul className="checklist-counts" aria-label={`${items.length} requirements by status`}>
        {countByApplicability(items).map((entry) => <li key={entry.applicability}><span className="lab-figure">{entry.count}</span> {entry.label}</li>)}
      </ul>
      <ul className="checklist-nav-list">
        <li>
          <button type="button" className="checklist-pick" aria-current={selectedId === CYBER_DEVICE_ID ? 'true' : undefined} onClick={() => onSelect(CYBER_DEVICE_ID)}>{CYBER_DEVICE_TITLE}</button>
        </li>
        {items.map((item) => (
          <li key={item.requirementId}>
            <button type="button" className="checklist-pick" aria-current={selectedId === item.requirementId ? 'true' : undefined} onClick={() => onSelect(item.requirementId)}>
              <span>{item.title}</span>
              <span className="lab-label">{APPLICABILITY_LABELS[item.applicability]}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The checklist. As its own screen (`isTitleShown`) the requirements are listed beside the one
 * being read; inside the report, and on paper either way, every requirement is printed in order.
 */
export default function ComplianceChecklist({ assessment, items, isTitleShown = true }: Props) {
  const sourceCount = assessment.checklistSources.length;
  const [chosenId, setChosenId] = useState(CYBER_DEVICE_ID);
  // A requirement that is no longer listed (the submission type changed) falls back to the first entry.
  const selectedId = items.some((item) => item.requirementId === chosenId) ? chosenId : CYBER_DEVICE_ID;
  const select = (id: string): void => {
    setChosenId(id);
    // Where every requirement is on the page (a narrow screen), choosing one brings it into view.
    document.getElementById(`checklist-${id}`)?.scrollIntoView?.({ block: 'nearest' });
  };
  return (
    <div className="report-checklist" id={isTitleShown ? 'lab-results' : undefined}>
      {isTitleShown && <h2 className="lab-title">{CHECKLIST_TITLE}</h2>}
      <div className="checklist-intro">
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
      </div>
      <div className={isTitleShown ? 'checklist-body' : undefined}>
        {isTitleShown && <ChecklistNav items={items} selectedId={selectedId} onSelect={select} />}
        <div className={isTitleShown ? 'checklist-detail' : undefined}>
          <CyberDeviceItem assessment={assessment} isSelected={selectedId === CYBER_DEVICE_ID} />
          {items.map((item) => <RequirementItem key={item.requirementId} item={item} isSelected={selectedId === item.requirementId} />)}
        </div>
      </div>
    </div>
  );
}
