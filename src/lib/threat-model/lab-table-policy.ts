/**
 * What the Lab shows about named companies and devices: published specifications only.
 * The site's query database also holds security scores and counts per company. The Lab has
 * no findings about any named product, so those tables and columns are left out here, in
 * one place, for every screen that reads the database.
 */

type Row = Record<string, unknown>;
export type LabTables = Record<string, Row[]>;

/** Tables that exist only to score or rank named companies. */
export const HIDDEN_TABLES: readonly string[] = ['risk_profile'];

/** Columns that state a security posture, score or count against a named company or device. */
export const HIDDEN_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  companies: ['security_posture', 'security_notes'],
  devices: ['cve_count', 'security_posture'],
  /** A risk rating for a named device's radio link. */
  comms: ['data_link_risk'],
};

function withoutColumns(rows: readonly Row[], hidden: readonly string[]): Row[] {
  return rows.map((row) => Object.fromEntries(Object.entries(row).filter(([column]) => !hidden.includes(column))));
}

/** The database as the Lab may show it. Tables and columns not named above pass through untouched. */
export function applyLabTablePolicy(tables: Readonly<Record<string, readonly Row[]>>): LabTables {
  const allowed: LabTables = {};
  for (const [name, rows] of Object.entries(tables)) {
    if (HIDDEN_TABLES.includes(name)) continue;
    const hiddenColumns = HIDDEN_COLUMNS[name];
    allowed[name] = hiddenColumns === undefined ? [...rows] : withoutColumns(rows, hiddenColumns);
  }
  return allowed;
}
