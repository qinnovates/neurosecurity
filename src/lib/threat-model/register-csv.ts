/**
 * The risk register as a CSV file. With an export context the file opens with a block that
 * says what it is: the device, the date, the versions of the data behind it, and the Lab's
 * standing statements. Every cell passes through `escapeCsvCell`.
 */

import { describeEvidence } from './evidence-levels';
import { CATALOG_SEVERITY_HEADING, CATALOG_SEVERITY_LABELS, EFFECT_HEADING, EFFECT_LABELS, ENTRY_PATH_HEADING, ENTRY_PATH_LABELS } from './lab-terms';
import { collectMatches } from './match-techniques';
import type { ReferenceData } from './reference-data-types';
import type { RiskRow, ThreatModelReport } from './report-types';
import { catalogRiskId } from './risk-register';

const WHY_HERE_HEADING = 'Why here';

const CSV_HEADERS = [
  'Risk id', 'Element', 'Source', 'Technique', 'Threat', ENTRY_PATH_HEADING, EFFECT_HEADING, 'STRIDE', CATALOG_SEVERITY_HEADING, 'CVSS base vector',
  'NISS (annex)', 'Evidence', WHY_HERE_HEADING, 'CVEs in other products', 'Detection note (catalog)', 'FDA requirement codes', 'Status', 'Note',
] as const;

/** Characters that make a spreadsheet treat a cell as a formula. */
const FORMULA_TRIGGER_PATTERN = /^[=+\-@\t\r]/;
/** Shown wherever a technique has no CVSS vector, so a blank can never read as a low score. */
export const NOT_SCORED_LABEL = 'Not scored';

/** What the header block states. Every value comes from the report, the data files or the caller; none is typed in here. */
export interface RegisterCsvHeader {
  deviceName: string;
  /** Supplied by the caller; this module never reads the clock. */
  exportDate: string;
  registrarVersion: string;
  placementTableVersion: string;
  placementTableStatus: string;
  checklistVersion: string;
  /** The Lab's standing statements, passed whole from where they are defined. */
  standingStatements: readonly string[];
}

export interface RegisterCsvContext {
  header: RegisterCsvHeader;
  /** The placement rationale for each catalog row, by risk id. */
  placementReasonByRiskId: ReadonlyMap<string, string>;
}

/**
 * Escapes one cell. Text a user typed (labels, notes) ends up in a spreadsheet, so a
 * leading formula character is neutralised with an apostrophe before quoting.
 */
export function escapeCsvCell(value: string): string {
  const neutralised = FORMULA_TRIGGER_PATTERN.test(value) ? `'${value}` : value;
  return `"${neutralised.replaceAll('"', '""')}"`;
}

function toLine(cells: readonly string[]): string {
  return cells.map(escapeCsvCell).join(',');
}

function toCells(row: RiskRow, placementReasonByRiskId: ReadonlyMap<string, string>): string[] {
  return [
    row.riskId,
    row.elementLabel,
    row.source === 'catalog' ? 'TARA catalog' : 'STRIDE baseline',
    row.techniqueId ?? '',
    row.title,
    row.entryPath === null ? '' : ENTRY_PATH_LABELS[row.entryPath],
    row.goal === null ? '' : EFFECT_LABELS[row.goal],
    row.strideCategories.join('; '),
    row.catalogSeverity === null ? '' : CATALOG_SEVERITY_LABELS[row.catalogSeverity],
    row.cvssBaseVector ?? NOT_SCORED_LABEL,
    row.nissScore === null ? '' : String(row.nissScore),
    // A baseline row is not a catalog technique and has no evidence tier.
    row.source === 'catalog' ? describeEvidence(row).label : '',
    placementReasonByRiskId.get(row.riskId) ?? '',
    row.precedentCveIds.join('; '),
    row.detectionNote ?? '',
    row.fdaRequirementCodes.join('; '),
    row.status,
    row.note,
  ];
}

function toHeaderLines(header: RegisterCsvHeader): string[] {
  return [
    toLine(['Device', header.deviceName]),
    toLine(['Exported', header.exportDate]),
    toLine(['Technique catalog version', header.registrarVersion]),
    toLine(['Placement table version', header.placementTableVersion]),
    toLine(['Placement table status', header.placementTableStatus]),
    toLine(['Requirements checklist version', header.checklistVersion]),
    ...header.standingStatements.map((statement) => toLine(['Standing statement', statement])),
    '',
  ];
}

/** Without a context the file is the table alone, and "Why here" is blank on every row. */
export function buildRegisterCsv(rows: readonly RiskRow[], context?: RegisterCsvContext): string {
  const reasons = context?.placementReasonByRiskId ?? new Map<string, string>();
  const lines = [
    ...(context === undefined ? [] : toHeaderLines(context.header)),
    toLine(CSV_HEADERS),
    ...rows.map((row) => toLine(toCells(row, reasons))),
  ];
  return `${lines.join('\r\n')}\r\n`;
}

/** The engine's reason for placing each technique on its part or connection, by risk id. */
export function indexPlacementReasons(report: Pick<ThreatModelReport, 'elementOutcomes'>): Map<string, string> {
  return new Map(collectMatches(report.elementOutcomes).map((match) =>
    [catalogRiskId(match.elementId, match.techniqueId), match.reasons.map((reason) => reason.detail).join(' ')]));
}

export interface RegisterExportInputs {
  report: ThreatModelReport;
  referenceData: Pick<ReferenceData, 'placementTable' | 'compliance'>;
  exportDate: string;
  standingStatements: readonly string[];
}

/** The whole export for one report: the header block, then every row with its placement reason. */
export function buildRegisterExportCsv({ report, referenceData, exportDate, standingStatements }: RegisterExportInputs): string {
  return buildRegisterCsv(report.riskRows, {
    header: {
      deviceName: report.model.name,
      exportDate,
      registrarVersion: report.registrarVersion,
      placementTableVersion: referenceData.placementTable.version,
      placementTableStatus: referenceData.placementTable.status,
      checklistVersion: referenceData.compliance.version,
      standingStatements,
    },
    placementReasonByRiskId: indexPlacementReasons(report),
  });
}
