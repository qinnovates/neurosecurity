import type { RiskRow } from './report-types';

const CSV_HEADERS = [
  'Risk id', 'Element', 'Source', 'Technique', 'Threat', 'How it gets in', 'What it does', 'STRIDE', 'Catalog severity', 'CVSS base vector',
  'NISS (annex)', 'Evidence status', 'Precedent CVEs', 'Suggested controls', 'FDA requirement codes', 'Status', 'Note',
] as const;

/** Characters that make a spreadsheet treat a cell as a formula. */
const FORMULA_TRIGGER_PATTERN = /^[=+\-@\t\r]/;
/** Shown wherever a technique has no CVSS vector, so a blank can never read as a low score. */
export const NOT_SCORED_LABEL = 'Not scored';

/**
 * Escapes one cell. Text a user typed (labels, notes) ends up in a spreadsheet, so a
 * leading formula character is neutralised with an apostrophe before quoting.
 */
export function escapeCsvCell(value: string): string {
  const neutralised = FORMULA_TRIGGER_PATTERN.test(value) ? `'${value}` : value;
  return `"${neutralised.replaceAll('"', '""')}"`;
}

function toCells(row: RiskRow): string[] {
  return [
    row.riskId,
    row.elementLabel,
    row.source === 'catalog' ? 'TARA catalog' : 'STRIDE baseline',
    row.techniqueId ?? '',
    row.title,
    row.entryPath ?? '',
    row.goal ?? '',
    row.strideCategories.join('; '),
    row.catalogSeverity ?? '',
    row.cvssBaseVector ?? NOT_SCORED_LABEL,
    row.nissScore === null ? '' : String(row.nissScore),
    row.evidenceStatus ?? '',
    row.precedentCveIds.join('; '),
    row.controls.join('; '),
    row.fdaRequirementCodes.join('; '),
    row.status,
    row.note,
  ];
}

export function buildRegisterCsv(rows: readonly RiskRow[]): string {
  const lines = [CSV_HEADERS.map(escapeCsvCell).join(','), ...rows.map((row) => toCells(row).map(escapeCsvCell).join(','))];
  return `${lines.join('\r\n')}\r\n`;
}
