import { useMemo } from 'react';
import { useFocus } from '@/components/workbench/FocusContext';
import type { EngineData } from '@/lib/threat-model/catalog-types';
import { summariseHeadlineFigures } from '@/lib/threat-model/headline-figures';
import { listOrphanDecisions } from '@/lib/threat-model/orphan-decisions';
import { summariseCoverageBySeverity } from '@/lib/threat-model/placement-coverage';
import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { countRowsByElement, summariseRegisterUnits } from '@/lib/threat-model/register-counts';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';
import { summariseScope } from '@/lib/threat-model/scope-statement';
import ChainList from './ChainList';
import ComplianceChecklist from './ComplianceChecklist';
import ReportArchitecture from './report/ReportArchitecture';
import ReportCves from './report/ReportCves';
import ReportOverview from './report/ReportOverview';
import ReportScope from './report/ReportScope';
import { ReportSection } from './report/ReportSection';
import ReportSystem from './report/ReportSystem';
import ReportTitleBlock from './report/ReportTitleBlock';
import RiskRegister from './RiskRegister';
import './report/report.css';
import './report/report-print.css';

export { VIEW_LABELS } from './report/report-sections';

interface DocumentProps {
  report: ThreatModelReport;
  engineData: EngineData;
  referenceData: ReferenceData;
  regionNames: readonly string[];
}

/**
 * The complete report as one document, in the order of `REPORT_SECTIONS`. Every figure in it is
 * computed here from the report, the catalog and the reference data it is given.
 */
export function ReportDocument({ report, engineData, referenceData, regionNames }: DocumentProps) {
  const { model } = report;
  const scope = useMemo(() => summariseScope(model, engineData, referenceData), [model, engineData, referenceData]);
  const coverage = useMemo(() => summariseCoverageBySeverity(engineData.techniques, scope), [engineData, scope]);
  const elements = useMemo(() => countRowsByElement(model, report.riskRows), [model, report]);
  const units = useMemo(() => summariseRegisterUnits(model, report.riskRows), [model, report]);
  const headlineFigures = useMemo(() => summariseHeadlineFigures(report, coverage), [report, coverage]);
  const orphanDecisions = useMemo(() => listOrphanDecisions(model, report), [model, report]);
  return (
    <article className="report" id="lab-results">
      <ReportTitleBlock report={report} referenceData={referenceData} regionNames={regionNames} />
      <ReportOverview headlineFigures={headlineFigures} elements={elements} units={units} coverage={coverage} placementTable={referenceData.placementTable} />
      <ReportSystem model={model} />
      <ReportScope model={model} scope={scope} coverageGaps={report.coverageGaps} />
      <ReportSection id="register"><RiskRegister rows={report.riskRows} orphanDecisions={orphanDecisions} /></ReportSection>
      <ReportArchitecture model={model} views={report.architectureViews} />
      <ReportSection id="chains"><ChainList model={model} chainResult={report.chainResult} /></ReportSection>
      <ReportSection id="checklist"><ComplianceChecklist assessment={report.cyberDeviceAssessment} items={report.complianceItems} isTitleShown={false} /></ReportSection>
      <ReportCves cves={report.precedentCves} mappingDate={report.precedentCvesAsOf} />
    </article>
  );
}

interface Props {
  report: ThreatModelReport;
  regionNames: readonly string[];
}

/** The report for the device in focus, with the one action that belongs to it: exporting its register. */
export default function ReportView({ report, regionNames }: Props) {
  const { engineData, referenceData, exportRegister } = useFocus();
  return (
    <>
      <div className="report-actions report-no-print">
        <button type="button" className="lab-button" onClick={exportRegister}>Export register (CSV)</button>
      </div>
      <ReportDocument report={report} engineData={engineData} referenceData={referenceData} regionNames={regionNames} />
    </>
  );
}
