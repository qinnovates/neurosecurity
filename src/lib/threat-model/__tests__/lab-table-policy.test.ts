import { describe, it, expect } from 'vitest';
import { getKqlTables } from '../../kql-tables';
import { ALLOWED_SITE_TABLES, SITE_TABLE_DESCRIPTIONS, applyLabTablePolicy } from '../lab-table-policy';

/** Every table the site builds, as the Lab receives them. */
const siteTables = getKqlTables();
const allowedNames = Object.keys(ALLOWED_SITE_TABLES).sort();

function columnsOf(rows: readonly Record<string, unknown>[]): string[] {
  return [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
}

describe('lab table policy', () => {
  it('lets through exactly the allowed tables when fed everything the site builds', () => {
    expect(Object.keys(siteTables).length).toBeGreaterThan(allowedNames.length);
    expect(Object.keys(applyLabTablePolicy(siteTables)).sort()).toEqual(allowedNames);
    expect(allowedNames).toEqual(['attack_chains', 'comms', 'cves', 'devices', 'hardware_specs', 'tactics', 'techniques']);
  });

  it('drops a table nobody has allowed, so one added upstream never appears by default', () => {
    const withNewTable = { ...siteTables, zz_new: [{ company: 'Example Co', risk_index: 13.4 }] };
    expect(applyLabTablePolicy(withNewTable)).not.toHaveProperty('zz_new');
  });

  it('drops a column nobody has allowed, so one added upstream never appears by default', () => {
    const withNewColumn = { ...siteTables, devices: siteTables.devices.map((row) => ({ ...row, zz_score: 1 })) };
    for (const row of applyLabTablePolicy(withNewColumn).devices) expect(row).not.toHaveProperty('zz_score');
  });

  it.each(allowedNames)('names only columns that exist in the real %s table, so an upstream rename fails here', (name) => {
    const realColumns = columnsOf(siteTables[name]);
    for (const column of ALLOWED_SITE_TABLES[name]) expect(realColumns, `${name}.${column}`).toContain(column);
  });

  it.each(allowedNames)('shows no column of %s beyond its list, and keeps every row', (name) => {
    const shown = applyLabTablePolicy(siteTables)[name];
    expect(shown).toHaveLength(siteTables[name].length);
    expect(columnsOf(shown)).toEqual([...ALLOWED_SITE_TABLES[name]].sort());
  });

  it('keeps scores, counts, funding and ratings of named companies and devices out', () => {
    const shown = applyLabTablePolicy(siteTables);
    for (const table of ['risk_profile', 'companies', 'validations', 'hourglass_bands', 'brain_regions', 'dsm5', 'neurological_conditions', 'controls']) {
      expect(siteTables, `test setup: ${table} is no longer a site table`).toHaveProperty(table);
      expect(shown).not.toHaveProperty(table);
    }
    const deviceColumns = columnsOf(shown.devices);
    for (const column of ['cve_count', 'security_posture', 'company_funding', 'price_usd', 'units_deployed']) expect(deviceColumns).not.toContain(column);
    expect(columnsOf(shown.comms)).not.toContain('data_link_risk');
    expect(columnsOf(shown.tactics)).not.toContain('description');
    for (const column of ['drift_profile', 'clinical_parallel']) expect(columnsOf(shown.attack_chains)).not.toContain(column);
  });

  it('leaves the input untouched', () => {
    const before = columnsOf(siteTables.devices);
    applyLabTablePolicy(siteTables);
    expect(columnsOf(siteTables.devices)).toEqual(before);
  });
});

describe('columns left out because of what they carry', () => {
  const site = getKqlTables();
  const shown = applyLabTablePolicy(site);
  const columnsIn = (rows: readonly Record<string, unknown>[]): string[] => [...new Set(rows.flatMap((row) => Object.keys(row)))];

  it('shows no authored-chain free text: the notes, rationale, extrapolation and device class stay out, the labels stay in', () => {
    const columns = columnsIn(shown.attack_chains);
    for (const column of ['chain_evidence_rationale', 'step_evidence_note', 'step_evidence_source', 'extrapolation', 'device_class']) {
      expect(columnsIn(site.attack_chains), `the site table has ${column}`).toContain(column);
      expect(columns, column).not.toContain(column);
    }
    expect(columns).toEqual(expect.arrayContaining(['chain_evidence_label', 'step_evidence_label']));
  });

  it('shows no retired status word in any authored-chain cell', () => {
    const cells = shown.attack_chains.flatMap((row) => Object.values(row)).filter((value): value is string => typeof value === 'string');
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) expect(cell).not.toMatch(/\b(CONFIRMED|EMERGING|THEORETICAL)\b|\bconfirmed\b/);
  });

  it('shows no regulatory status the site table has cut short', () => {
    const truncated = site.hardware_specs.filter((row) => String(row.fda_status ?? '').length === 40);
    // The fault: the site table cuts the field at 40 characters, so some rows end mid-sentence.
    expect(truncated.length).toBeGreaterThan(0);
    expect(columnsIn(shown.hardware_specs)).not.toContain('fda_status');
    expect(ALLOWED_SITE_TABLES.hardware_specs).not.toContain('fda_status');
  });

  it('holds one row per step of an authored chain, which is what its description says', () => {
    const stepsByChain = new Map<string, number>();
    for (const row of shown.attack_chains) stepsByChain.set(String(row.chain_id), Number(row.step_count));
    expect(shown.attack_chains).toHaveLength([...stepsByChain.values()].reduce((sum, count) => sum + count, 0));
    expect(stepsByChain.size).toBeLessThan(shown.attack_chains.length);
    expect(SITE_TABLE_DESCRIPTIONS.attack_chains).toBe('One row per step of an authored chain.');
  });
});
