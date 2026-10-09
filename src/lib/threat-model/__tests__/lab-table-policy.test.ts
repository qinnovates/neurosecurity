import { describe, it, expect } from 'vitest';
import { getKqlTables } from '../../kql-tables';
import { ALLOWED_SITE_TABLES, applyLabTablePolicy } from '../lab-table-policy';

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
