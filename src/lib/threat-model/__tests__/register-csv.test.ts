import { describe, it, expect } from 'vitest';
import { STANDING_STATEMENTS } from '../../../components/workbench/StandingLine';
import { describeEvidence } from '../evidence-levels';
import { CATALOG_SEVERITY_HEADING, EFFECT_HEADING, ENTRY_PATH_HEADING } from '../lab-terms';
import { NOT_SCORED_LABEL, buildRegisterCsv, buildRegisterExportCsv, escapeCsvCell, indexPlacementReasons, type RegisterCsvContext } from '../register-csv';
import type { RiskRow } from '../report-types';
import { PRESETS, referenceData } from './preset-reports';

function buildRow(overrides: Partial<RiskRow> = {}): RiskRow {
  return {
    riskId: 'app::QIF-T0051', elementId: 'app', elementLabel: 'Patient app', source: 'catalog', techniqueId: 'QIF-T0051',
    title: 'Neural data privacy breach', strideCategories: ['information_disclosure'], entryPath: 'device_systems', goal: 'read', catalogSeverity: 'high',
    cvssBaseVector: null, nissScore: 5.2, evidenceStatus: 'CONFIRMED', evidenceTier: 'demonstrated_case', precedentCveIds: [], detectionNote: 'Audit of data access',
    fdaRequirementCodes: ['TM'], status: 'open', note: '', catalogState: 'current', ...overrides,
  };
}

const EXPORT_DATE = '2026-10-09';

function buildContext(overrides: Partial<RegisterCsvContext['header']> = {}): RegisterCsvContext {
  return {
    header: {
      deviceName: 'Test device', exportDate: EXPORT_DATE, registrarVersion: 'R', placementTableVersion: 'P',
      checklistVersion: 'C', standingStatements: STANDING_STATEMENTS, ...overrides,
    },
    placementReasonByRiskId: new Map([['app::QIF-T0051', 'Acts on the patient app.']]),
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

  it('heads its columns with the Lab\'s terms', () => {
    const [header] = buildRegisterCsv([buildRow()]).split('\r\n');
    for (const heading of [ENTRY_PATH_HEADING, EFFECT_HEADING, CATALOG_SEVERITY_HEADING, 'Evidence', 'Why here']) expect(header).toContain(`"${heading}"`);
    expect(header).not.toContain('Evidence status');
  });

  it('carries the catalog detection note under its own heading and no controls column', () => {
    const [header, line] = buildRegisterCsv([buildRow()]).trimEnd().split('\r\n');
    expect(header).toContain('"Detection note (catalog)"');
    expect(header).toContain('"CVEs in other products"');
    expect(header).not.toMatch(/controls|Precedent/i);
    expect(line).toContain('"Audit of data access"');
  });

  it('writes the evidence by tier, never the legacy status, and nothing for a baseline row', () => {
    const csv = buildRegisterCsv([buildRow(), buildRow({ riskId: 'app::STRIDE-spoofing', source: 'stride', techniqueId: null, evidenceStatus: null, evidenceTier: null })]);
    expect(csv).toContain(`"${describeEvidence({ evidenceTier: 'demonstrated_case' }).label}"`);
    expect(csv).not.toMatch(/CONFIRMED|Not stated/);
  });

  it('labels a missing CVSS vector as not scored', () => {
    expect(buildRegisterCsv([buildRow()])).toContain(`"${NOT_SCORED_LABEL}"`);
  });

  it('neutralises a formula typed into a note', () => {
    expect(buildRegisterCsv([buildRow({ note: '=cmd|"/c calc"!A1' })])).toContain(`"'=cmd|""/c calc""!A1"`);
  });
});

describe('the header block', () => {
  it('states the device, the date, the three versions and every standing statement, before the table', () => {
    const lines = buildRegisterCsv([buildRow()], buildContext()).trimEnd().split('\r\n');
    expect(lines.slice(0, 5)).toEqual([
      '"Device","Test device"', `"Exported","${EXPORT_DATE}"`, '"Technique catalog version","R"',
      '"Placement table version","P"', '"Requirements checklist version","C"',
    ]);
    expect(STANDING_STATEMENTS).toHaveLength(4);
    expect(lines.slice(5, 5 + STANDING_STATEMENTS.length)).toEqual(STANDING_STATEMENTS.map((statement) => `"Standing statement","${statement}"`));
    expect(lines[5 + STANDING_STATEMENTS.length]).toBe('');
    expect(lines[6 + STANDING_STATEMENTS.length]).toContain('"Risk id"');
    expect(lines).toHaveLength(8 + STANDING_STATEMENTS.length);
  });

  it('neutralises a formula typed as the device name', () => {
    expect(buildRegisterCsv([], buildContext({ deviceName: '=1+1' }))).toContain(`"Device","'=1+1"`);
  });

  it('writes the placement reason under "Why here"', () => {
    const [header, line] = buildRegisterCsv([buildRow()], buildContext()).trimEnd().split('\r\n').slice(-2);
    const column = header.split('","').indexOf('Why here');
    expect(line.split('","')[column]).toBe('Acts on the patient app.');
  });
});

describe.each(PRESETS)('the export for the preset %s', (_id, { report }) => {
  const csv = buildRegisterExportCsv({ report, referenceData, exportDate: EXPORT_DATE, standingStatements: STANDING_STATEMENTS });

  it('takes the header from the report and the data files', () => {
    expect(csv).toContain(escapeCsvCell(report.model.name));
    expect(csv).toContain(`"Technique catalog version","${report.registrarVersion}"`);
    expect(csv).toContain(`"Placement table version","${referenceData.placementTable.version}"`);
    // The file's own status sentence carries retired wording; the export gives the version and not that sentence.
    expect(referenceData.placementTable.status).toMatch(/confirmed|weaker evidence/);
    expect(csv).not.toContain(referenceData.placementTable.status);
    expect(csv).not.toContain('Placement table status');
    expect(csv).not.toMatch(/\bconfirmed\b|weaker evidence/i);
    expect(csv).toContain(`"Requirements checklist version","${referenceData.compliance.version}"`);
    for (const statement of STANDING_STATEMENTS) expect(csv).toContain(escapeCsvCell(statement));
  });

  it('gives every catalog row the engine\'s reason for placing it, and one line per row', () => {
    const reasons = indexPlacementReasons(report);
    const catalogRows = report.riskRows.filter((row) => row.source === 'catalog');
    expect(reasons.size).toBe(catalogRows.length);
    for (const row of catalogRows) {
      expect(reasons.get(row.riskId)?.length ?? 0, row.riskId).toBeGreaterThan(10);
      expect(csv).toContain(escapeCsvCell(reasons.get(row.riskId) ?? ''));
    }
    expect(csv.trimEnd().split('\r\n')).toHaveLength(report.riskRows.length + 7 + STANDING_STATEMENTS.length);
  });

  it('never prints a legacy evidence word', () => {
    expect(csv.split('\r\n').slice(6 + STANDING_STATEMENTS.length).join('\n')).not.toMatch(/\b(CONFIRMED|DEMONSTRATED|proven)\b/);
  });
});
