/**
 * The risk register as the file the reader downloads. The one production path to the CSV:
 * it always carries the header block (device, date, data versions), the standing statements
 * and each row's placement reason.
 */

import type { ReferenceData } from '@/lib/threat-model/reference-data-types';
import { buildRegisterExportCsv } from '@/lib/threat-model/register-csv';
import type { ThreatModelReport } from '@/lib/threat-model/report-types';
import { STANDING_STATEMENTS } from './standing-statements';

/** Calendar date in UTC, as ISO 8601: "2026-10-09". */
export function toExportDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * The export states the placement table's version and not its own status sentence: that
 * sentence uses evidence wording the Lab has retired, and the standing statements already
 * say where the placement decisions stand.
 */
export function buildRegisterExport(report: ThreatModelReport, referenceData: ReferenceData, now: Date): string {
  const placementTable = { ...referenceData.placementTable, status: '' };
  return buildRegisterExportCsv({
    report, referenceData: { placementTable, compliance: referenceData.compliance }, exportDate: toExportDate(now), standingStatements: STANDING_STATEMENTS,
  });
}
