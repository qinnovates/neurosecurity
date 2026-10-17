import { STANDING_STATEMENTS } from '@/components/workbench/StandingLine';
import { EFFECT_LABELS } from '@/lib/threat-model/lab-terms';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { THREAT_GOALS, type ThreatModelReport } from '@/lib/threat-model/report-types';
import { DIRECTION_LABELS, INVASIVENESS_LABELS, SUBMISSION_LABELS } from '../editor/model-labels';
import { REPORT_AUTHOR_LINE } from './report-author';
import { formatGeneratedAt, wordsOf } from './report-sections';

interface Props {
  report: ThreatModelReport;
  referenceData: Pick<ReferenceData, 'placementTable' | 'compliance'>;
  regionNames: readonly string[];
}

const NO_REGIONS = 'None recorded';

/**
 * What the report is, of what, from which versions of the data, and what it is not. The
 * standing statements are printed whole. The last list is how much of the catalog has a
 * placement decision for each effect, so a short register for an effect is read against it.
 */
export default function ReportTitleBlock({ report, referenceData, regionNames }: Props) {
  const { model } = report;
  const facts: readonly (readonly [string, string])[] = [
    ['Generated', formatGeneratedAt(report.generatedAt)],
    ['Technique catalog version', report.registrarVersion],
    ['Placement table version', referenceData.placementTable.version],
    ['Requirements checklist version', referenceData.compliance.version],
    ['Submission type', SUBMISSION_LABELS[model.submissionType]],
    ['Device category', wordsOf(model.deviceCategory)],
    ['Invasiveness', INVASIVENESS_LABELS[model.invasiveness]],
    ['Direction', DIRECTION_LABELS[model.direction]],
    ['Target regions', regionNames.length === 0 ? NO_REGIONS : regionNames.join(', ')],
  ];
  return (
    <header className="report-title-block">
      <h2 className="lab-title">Threat model draft: {model.name}</h2>
      {REPORT_AUTHOR_LINE !== '' && <p className="report-author">{REPORT_AUTHOR_LINE}</p>}
      <dl className="report-facts">
        {facts.map(([name, value]) => (
          <div key={name}>
            <dt className="lab-label">{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="report-standing" aria-label="What TARA Lab is and is not">
        {STANDING_STATEMENTS.map((statement) => <li key={statement}>{statement}</li>)}
      </ul>
      <h3 className="report-subheading">Read this first</h3>
      <ul className="report-list">{report.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
      <h3 className="report-subheading">Placement decisions by effect</h3>
      <ul className="report-list">
        {THREAT_GOALS.map((goal) => {
          const coverage = report.goalCoverage[goal];
          return (
            <li key={goal}>
              {EFFECT_LABELS[goal]}: {coverage.placedTechniques} of the catalog&rsquo;s {coverage.catalogTechniques} techniques of this kind {coverage.placedTechniques === 1 ? 'has' : 'have'} a placement decision.
            </li>
          );
        })}
      </ul>
    </header>
  );
}
