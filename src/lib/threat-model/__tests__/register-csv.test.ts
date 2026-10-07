import { describe, it, expect } from 'vitest';
import { NOT_SCORED_LABEL, buildRegisterCsv, escapeCsvCell } from '../register-csv';
import type { RiskRow } from '../report-types';

function buildRow(overrides: Partial<RiskRow> = {}): RiskRow {
  return {
    riskId: 'app::QIF-T0051', elementId: 'app', elementLabel: 'Patient app', source: 'catalog', techniqueId: 'QIF-T0051',
    title: 'Neural data privacy breach', strideCategories: ['information_disclosure'], entryPath: 'device_systems', goal: 'read', catalogSeverity: 'high',
    cvssBaseVector: null, nissScore: 5.2, evidenceStatus: 'CONFIRMED', precedentCveIds: [], controls: ['Encrypt at rest'],
    fdaRequirementCodes: ['TM'], status: 'open', note: '', catalogState: 'current', ...overrides,
  };
}

describe('escapeCsvCell', () => {
  it.each(['=HYPERLINK("http://evil.test","x")', '+1+1', '-2+3', '@SUM(A1)', '\tcmd'])('neutralises the formula cell %s', (value) => {
    expect(escapeCsvCell(value).startsWith(`"'`)).toBe(true);
  });

  it('doubles quotes and leaves ordinary text alone', () => {
    expect(escapeCsvCell('He said "no"')).toBe('"He said ""no"""');
    expect(escapeCsvCell('Patient app')).toBe('"Patient app"');
  });
});

describe('buildRegisterCsv', () => {
  it('writes a header and one line per row', () => {
    const lines = buildRegisterCsv([buildRow(), buildRow({ riskId: 'cloud::QIF-T0044' })]).trimEnd().split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('"CVSS base vector"');
  });

  it('labels a missing CVSS vector as not scored', () => {
    expect(buildRegisterCsv([buildRow()])).toContain(`"${NOT_SCORED_LABEL}"`);
  });

  it('neutralises a formula typed into a note', () => {
    expect(buildRegisterCsv([buildRow({ note: '=cmd|"/c calc"!A1' })])).toContain(`"'=cmd|""/c calc""!A1"`);
  });
});
