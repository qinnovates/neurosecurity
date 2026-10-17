/**
 * What the Lab shows of the site's query database: only the tables and columns named here.
 * Everything else is left out, so a table or column added to the site never appears in the
 * Lab until someone reads it and adds it to this list.
 *
 * The rules behind the list are the Lab's standing ones: named companies and devices carry
 * published specifications only, no brain region carries a finding, and no clinical claim is
 * repeated beside a technique.
 */

type Row = Record<string, unknown>;
export type LabTables = Record<string, Row[]>;

/** Site table name to the columns the Lab may show from it. */
export const ALLOWED_SITE_TABLES: Readonly<Record<string, readonly string[]>> = {
  /** The catalog's own fields. Evidence and bands are read from the Lab's `placements` table instead. */
  techniques: ['id', 'name', 'tactic', 'parent_id', 'severity', 'niss_score', 'niss_vector', 'tara_alias', 'tara_mode'],
  /** Without `description`. */
  tactics: ['id', 'name', 'domain', 'domain_code', 'action_code'],
  /** Public record identifiers and scores. The mapping file holds no description column here. */
  cves: ['cve_id', 'product', 'cvss', 'cwe', 'category', 'technique_ids'],
  /**
   * Authored chains, one row per step. Without `drift_profile` and `clinical_parallel`, and without the
   * chain file's free-text evidence notes (`chain_evidence_rationale`, `extrapolation`, `device_class`,
   * `step_evidence_note`, `step_evidence_source`): those carry the catalog's retired status words and
   * name products beside techniques. The evidence labels stay.
   */
  attack_chains: [
    'chain_id', 'chain_name', 'chain_objective', 'chain_evidence_label',
    'step_count', 'position', 'technique_id', 'tara_alias', 'role', 'action', 'detection_window',
    'step_evidence_label',
  ],
  /** The eight published specifications the specifications view reads. */
  devices: ['device', 'company', 'type', 'channels', 'electrode_type', 'fda_status', 'first_human', 'target_use'],
  /** Without `fda_status`: the site table cuts that field short, and a cut-off regulatory status is not a published specification. */
  hardware_specs: ['id', 'manufacturer', 'device_name', 'device_type', 'channels', 'power_mw', 'directionality'],
  /** Without the risk rating of a named device's radio link. */
  comms: ['device', 'manufacturer', 'wireless_protocol', 'rf_band'],
};

/** What one row of a site table is, where its name and its row count alone would mislead: seven authored chains are 35 rows. */
export const SITE_TABLE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  attack_chains: 'One row per step of an authored chain.',
};

/** Shown beside the console, so the reader knows what is here and that the rest was left out on purpose. */
export const LAB_TABLE_POLICY_STATEMENT =
  "This console holds the technique catalog, public CVE records, authored chains and published device specifications. The site's other datasets are on the main site.";

function keepColumns(rows: readonly Row[], columns: readonly string[]): Row[] {
  return rows.map((row) => Object.fromEntries(columns.filter((column) => Object.hasOwn(row, column)).map((column) => [column, row[column]])));
}

/** The database as the Lab may show it: allowed tables only, each cut down to its allowed columns. */
export function applyLabTablePolicy(tables: Readonly<Record<string, readonly Row[]>>): LabTables {
  const allowed: LabTables = {};
  for (const [name, columns] of Object.entries(ALLOWED_SITE_TABLES)) {
    if (Object.hasOwn(tables, name)) allowed[name] = keepColumns(tables[name], columns);
  }
  return allowed;
}
