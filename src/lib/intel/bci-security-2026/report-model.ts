/**
 * Assembles the figures the State of BCI Security 2026 page renders, so each section
 * component reads one object and none of them recomputes a metric.
 */
import { REPORT } from './report-data';
import {
  capitalByChannel, companyCount, disclosureByClass, postureNonePublishedCount, disclosureLeaders, evidenceMaturity, neuralDeviceCves,
  roundsSummary, sumSplits, trackedFunding, trackedRoundRecipients, vcByYear,
} from './metrics';

const REPORT_YEAR = '2026';

function cveSummary() {
  const cves = neuralDeviceCves();
  return {
    cves,
    total: cves.length,
    vendors: new Set(cves.map((cve) => cve.vendor)).size,
    publishedThisYear: cves.filter((cve) => cve.published.startsWith(REPORT_YEAR)).length,
    staged: cves.filter((cve) => cve.isStaged).length,
    consumerHome: cves.filter((cve) => cve.group === 'consumer_home').length,
  };
}

function disclosureSummary() {
  const byClass = disclosureByClass();
  const implant = sumSplits([byClass.invasive, byClass.semi_invasive]);
  const all = sumSplits([byClass.invasive, byClass.semi_invasive, byClass.non_invasive]);
  const recipients = trackedRoundRecipients();
  return {
    byClass,
    implant,
    implantTotal: implant.found + implant.none_found + implant.not_checked,
    all,
    leaders: disclosureLeaders(),
    roundRecipients: recipients,
    roundRecipientsWithChannel: recipients.filter((recipient) => recipient.status === 'found').length,
  };
}

function capitalSummary() {
  const funding = trackedFunding();
  const split = capitalByChannel();
  const withoutLargest = capitalByChannel({ excludeLargestHolder: true });
  const withoutLargestTotal = withoutLargest.found + withoutLargest.none_found + withoutLargest.not_checked;
  return {
    ...funding,
    split,
    withoutLargest,
    noneFoundShare: split.none_found / funding.totalUsd,
    notCheckedShare: split.not_checked / funding.totalUsd,
    noneFoundShareWithoutLargest: withoutLargest.none_found / withoutLargestTotal,
  };
}

export function buildReportModel() {
  const evidence = evidenceMaturity();
  return {
    meta: REPORT.meta,
    companies: companyCount(),
    postureNonePublished: postureNonePublishedCount(),
    rounds: roundsSummary(),
    vc: vcByYear(),
    capital: capitalSummary(),
    disclosure: disclosureSummary(),
    cve: cveSummary(),
    evidence: { ...evidence, strictShare: evidence.demonstratedStrict / evidence.total, tierShare: evidence.demonstrated / evidence.total },
    q1: REPORT.q1_baseline,
    report: REPORT,
  };
}

export type ReportModel = ReturnType<typeof buildReportModel>;
