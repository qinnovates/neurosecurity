import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { buildThreatModelReport } from '../build-report';
import { RISK_STATUSES, type DeviceModel, type RiskStatus } from '../device-model';
import { buildModelFromIntake, defaultAnswersFor } from '../intake-to-model';
import { parseDeviceModelText } from '../parse-device-model';
import { buildRegisterCsv } from '../register-csv';
import type { RiskRow, ThreatModelReport } from '../report-types';
import { countLegacyControlsInPlace, countOpenRisksByElement, describeLegacyControls, isRiskAddressed } from '../risk-register';
import { BANNED_PHRASES, EXPECTED_EXCEPTION_COUNT, SCANNED_DIRECTORIES } from './banned-phrases';
import { loadEngineBundle, loadReferenceData, readDataFile } from './load-test-data';

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const regionIds = new Set(engineData.regions.map((region) => region.id));
const presets = referenceData.archetypes.map((archetype) => [archetype.id, archetype] as const);

function reportFor(model: DeviceModel): ThreatModelReport {
  return buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
}

function addressedIds(rows: readonly RiskRow[]): Set<string> {
  return new Set(rows.filter((row) => isRiskAddressed(row)).map((row) => row.riskId));
}

const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;
const TEST_FILE_PATTERN = /\.test\.(ts|tsx)$/;

function listSourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSourceFiles(entryPath);
    return SOURCE_FILE_PATTERN.test(entry.name) && !TEST_FILE_PATTERN.test(entry.name) ? [entryPath] : [];
  });
}

describe('phrases the Lab must not put in front of a reader', () => {
  const files = SCANNED_DIRECTORIES.flatMap(listSourceFiles).map((file) => ({ file, text: fs.readFileSync(file, 'utf-8') }));

  it('scans every Lab directory', () => {
    for (const directory of SCANNED_DIRECTORIES) expect(listSourceFiles(directory).length, directory).toBeGreaterThan(0);
  });

  it('allows the number of exceptions the list states, and no more', () => {
    expect(BANNED_PHRASES.reduce((sum, phrase) => sum + phrase.allowedOccurrences, 0)).toBe(EXPECTED_EXCEPTION_COUNT);
  });

  it.each(BANNED_PHRASES.map((phrase) => [phrase.pattern.source, phrase] as const))('finds "%s" only where it is excepted', (_source, phrase) => {
    const found = files.flatMap(({ file, text }) => [...text.matchAll(phrase.pattern)].map(() => file));
    expect(found, `${phrase.rule} Found in: ${found.join(', ')}`).toHaveLength(phrase.allowedOccurrences);
  });
});

describe.each(presets)('decisions on the preset %s', (_id, archetype) => {
  const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
  const baseline = reportFor(model);
  const closingStatuses = RISK_STATUSES.filter((status) => status !== 'open');

  it('starts with every row open', () => {
    expect(baseline.riskRows.length).toBeGreaterThan(0);
    expect(addressedIds(baseline.riskRows).size).toBe(0);
  });

  it('changes the addressed state of exactly one row, the one decided, for every row in turn', () => {
    baseline.riskRows.forEach((target, index) => {
      const status: RiskStatus = closingStatuses[index % closingStatuses.length];
      const decided = reportFor({ ...model, riskDecisions: [{ riskId: target.riskId, status, note: '' }] });
      expect(decided.riskRows.map((row) => row.riskId)).toEqual(baseline.riskRows.map((row) => row.riskId));
      expect([...addressedIds(decided.riskRows)]).toEqual([target.riskId]);
    });
  });

  it('closes no row for a note alone, or for a decision returned to open', () => {
    const [target] = baseline.riskRows;
    const noted = reportFor({ ...model, riskDecisions: [{ riskId: target.riskId, status: 'open', note: 'Looked at; undecided.' }] });
    expect(addressedIds(noted.riskRows).size).toBe(0);
  });

  it('closes no row for controls a file marks in place under the older scheme', () => {
    const everyNote = [...new Set(baseline.riskRows.flatMap((row) => (row.detectionNote === null ? [] : [row.detectionNote])))];
    const legacy = reportFor({ ...model, controlsInPlace: everyNote });
    expect(addressedIds(legacy.riskRows).size).toBe(0);
    expect(countOpenRisksByElement(legacy.riskRows)).toEqual(countOpenRisksByElement(baseline.riskRows));
  });

  it('carries the catalog detection note on catalog rows and no control on any row', () => {
    const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));
    for (const row of baseline.riskRows) {
      expect(row).not.toHaveProperty('controls');
      const expected = row.source === 'catalog' && row.techniqueId !== null ? techniqueById.get(row.techniqueId)?.detection ?? null : null;
      expect(row.detectionNote).toBe(expected);
    }
  });

  it('prints no band-derived control in the register, the CSV or a generated chain', () => {
    // Read from the file itself, so this holds whether or not the engine still loads it.
    const { controls_by_band: byBand } = readDataFile('qif-security-controls.json') as { controls_by_band: Record<string, { prevention?: string[]; detection?: string[] }> };
    const bandControls = Object.values(byBand).flatMap((controls) => [...(controls.prevention ?? []), ...(controls.detection ?? [])]);
    expect(bandControls.length).toBeGreaterThan(0);
    const catalogNotes = engineData.techniques.flatMap((technique) => (technique.detection === null ? [] : [technique.detection]));
    const printed = `${buildRegisterCsv(baseline.riskRows)}\n${JSON.stringify(baseline.riskRows)}\n${JSON.stringify(baseline.chainResult)}`;
    // A band control whose words also occur in a technique's own catalog note cannot be told apart by text, so it is not searched for.
    const distinctive = bandControls.filter((control) => !catalogNotes.some((note) => note.includes(control)));
    expect(distinctive.length).toBeGreaterThan(bandControls.length / 2);
    for (const control of distinctive) expect(printed).not.toContain(control);
    expect(printed).not.toMatch(/\(addresses step \d+\)/);
    for (const chain of baseline.chainResult.chains) expect(chain.defenses).toEqual([]);
  });
});

describe('controls in place from an older file', () => {
  const [, archetype] = presets[0];
  const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);

  it('says nothing when the file marks none', () => {
    expect(countLegacyControlsInPlace(model)).toBe(0);
    expect(describeLegacyControls(model)).toBeNull();
  });

  it('counts them in one notice that says they no longer close rows', () => {
    expect(describeLegacyControls({ ...model, controlsInPlace: ['Firmware signing'] }))
      .toBe('This file marks 1 control in place under an older scheme. It no longer closes rows.');
    expect(describeLegacyControls({ ...model, controlsInPlace: ['Firmware signing', 'Link encryption', 'Audit log'] }))
      .toBe('This file marks 3 controls in place under an older scheme. They no longer close rows.');
  });

  it('reads them from a file and writes them back unchanged', () => {
    const saved: DeviceModel = { ...model, controlsInPlace: ['Firmware signing', 'Link encryption'] };
    const reloaded = parseDeviceModelText(JSON.stringify(saved), regionIds);
    expect(reloaded.controlsInPlace).toEqual(saved.controlsInPlace);
    expect(JSON.parse(JSON.stringify(reloaded))).toEqual(JSON.parse(JSON.stringify(saved)));
  });
});
