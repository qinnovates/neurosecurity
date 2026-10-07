import { describe, it, expect } from 'vitest';
import { buildThreatModelReport } from '../build-report';
import { ThreatModelDataError } from '../errors';
import { buildModelFromIntake, defaultAnswersFor, type IntakeAnswers } from '../intake-to-model';
import { EMPTY_LENS, applyLens, countOpenRisks, isLensActive } from '../lens';
import { parsePlacementRules, parseThreatThemes } from '../parse-mappings';
import type { ThreatModelReport } from '../report-types';
import { loadEngineBundle, loadReferenceData, readDataFile } from './load-test-data';

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const SENSES_TECHNIQUE_IDS = ['QIF-T0035', 'QIF-T0052', 'QIF-T0103'];

function reportFor(archetypeId: string, overrides: Partial<IntakeAnswers> = {}): ThreatModelReport {
  const archetype = referenceData.archetypes.find((candidate) => candidate.id === archetypeId);
  if (archetype === undefined) throw new Error(`test setup: unknown archetype ${archetypeId}`);
  const model = buildModelFromIntake({ ...defaultAnswersFor(archetype), ...overrides }, archetype, engineData.registrarVersion);
  return buildThreatModelReport({ model, engineData, referenceData, generatedAt: '2026-10-06T00:00:00Z' });
}

const stimulator = reportFor('subcortical-stimulator');
const catalogRows = stimulator.riskRows.filter((row) => row.source === 'catalog');

describe('risk rows carry the lens fields', () => {
  it('gives every catalog row an entry path and a goal, and leaves baseline rows without', () => {
    for (const row of stimulator.riskRows) {
      if (row.source === 'catalog' && row.catalogState === 'current') {
        expect(row.entryPath, row.riskId).not.toBeNull();
        expect(row.goal, row.riskId).not.toBeNull();
      }
      if (row.source === 'stride') expect([row.entryPath, row.goal]).toEqual([null, null]);
    }
  });
});

describe('applyLens', () => {
  it('lets everything through when empty', () => {
    expect(isLensActive(EMPTY_LENS)).toBe(false);
    expect(applyLens(stimulator.riskRows, EMPTY_LENS)).toHaveLength(stimulator.riskRows.length);
  });

  it('narrows to one part of the device', () => {
    const rows = applyLens(stimulator.riskRows, { ...EMPTY_LENS, elementId: 'implant' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.elementId === 'implant')).toBe(true);
  });

  it('narrows by how a technique gets in and by what it does, together', () => {
    const rows = applyLens(stimulator.riskRows, { elementId: null, entryPaths: ['neural_interface'], goals: ['change'] });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.entryPath === 'neural_interface' && row.goal === 'change')).toBe(true);
  });
});

describe('countOpenRisks', () => {
  it('counts every open catalog risk once per lens when nothing is selected', () => {
    const counts = countOpenRisks(stimulator.riskRows, EMPTY_LENS, []);
    const sum = (record: Record<string, number>): number => Object.values(record).reduce((total, count) => total + count, 0);
    expect(sum(counts.byEntryPath)).toBe(catalogRows.length);
    expect(sum(counts.byGoal)).toBe(catalogRows.length);
  });

  it('shows what choosing a value would display, given the other lens', () => {
    const lens = { elementId: null, entryPaths: [], goals: ['deny' as const] };
    const counts = countOpenRisks(stimulator.riskRows, lens, []);
    const shown = applyLens(stimulator.riskRows, { ...lens, entryPaths: ['neural_interface'] });
    expect(counts.byEntryPath.neural_interface).toBe(shown.length);
  });

  it('drops a risk from the counts once one of its controls is in place', () => {
    const row = catalogRows.find((candidate) => candidate.controls.length > 0);
    if (row === undefined) throw new Error('test setup: no catalog row with a control');
    const before = countOpenRisks(stimulator.riskRows, EMPTY_LENS, []);
    const after = countOpenRisks(stimulator.riskRows, EMPTY_LENS, [row.controls[0]]);
    const total = (counts: typeof before): number => Object.values(counts.byGoal).reduce((sum, count) => sum + count, 0);
    expect(total(after)).toBeLessThan(total(before));
  });
});

describe('techniques that come in through the senses', () => {
  const matched = (report: ThreatModelReport): Set<string | null> => new Set(report.riskRows.map((row) => row.techniqueId));

  it('are placed when the system presents sounds or images to the patient', () => {
    const report = reportFor('noninvasive-eeg-headset');
    for (const techniqueId of SENSES_TECHNIQUE_IDS) expect(matched(report).has(techniqueId), techniqueId).toBe(true);
    expect(report.riskRows.filter((row) => row.entryPath === 'senses').length).toBeGreaterThan(0);
  });

  it('are excluded, with the reason stated, when it does not', () => {
    const report = reportFor('noninvasive-eeg-headset', { presentsStimuli: false });
    for (const techniqueId of SENSES_TECHNIQUE_IDS) expect(matched(report).has(techniqueId), techniqueId).toBe(false);
  });
});

describe('around the device and themes', () => {
  it('lists evidenced techniques that never pass through a device, and no unmodelled device classes', () => {
    const notPlaced = referenceData.placementRules.notPlaced;
    const expected = Object.values(notPlaced).filter((decision) => decision.category !== 'other_device_class').length;
    expect(stimulator.ambientThreats).toHaveLength(expected);
    expect(stimulator.ambientThreats.every((threat) => threat.reason.length > 10)).toBe(true);
  });

  it('maps every theme onto real catalog techniques and says where each one stands', () => {
    const knownIds = new Set(engineData.techniques.map((technique) => technique.id));
    for (const theme of stimulator.themes) {
      for (const technique of theme.techniques) expect(knownIds.has(technique.techniqueId), technique.techniqueId).toBe(true);
    }
    const bodyDevices = stimulator.themes.find((theme) => theme.id === 'body-devices');
    expect(bodyDevices?.techniques).toEqual([]);
    expect(bodyDevices?.catalogGap).toBeTruthy();
  });

  it('rejects a theme that names a technique the catalog does not have', () => {
    const broken = JSON.parse(JSON.stringify(readDataFile('threat-model/threat-themes.json'))) as { themes: { techniqueIds: string[] }[] };
    broken.themes[0].techniqueIds.push('QIF-T9999');
    expect(() => parseThreatThemes(broken, engineData.techniques)).toThrow(ThreatModelDataError);
  });

  it('rejects a placement with no entry path', () => {
    const broken = JSON.parse(JSON.stringify(readDataFile('threat-model/technique-placement.json'))) as { placements: Record<string, Record<string, unknown>> };
    delete broken.placements['QIF-T0049'].entryPath;
    expect(() => parsePlacementRules(broken, engineData.techniques)).toThrow(/QIF-T0049.*malformed/);
  });
});

describe('goal coverage', () => {
  it('counts, per goal, how many catalog techniques have a placement decision', () => {
    const { goalCoverage } = stimulator;
    const withMode = engineData.techniques.filter((technique) => technique.mode !== null).length;
    const counted = goalCoverage.read.catalogTechniques + goalCoverage.change.catalogTechniques + goalCoverage.deny.catalogTechniques;
    expect(counted).toBe(withMode);
    for (const coverage of Object.values(goalCoverage)) {
      expect(coverage.placedTechniques).toBeLessThanOrEqual(coverage.catalogTechniques);
    }
    const placedTotal = goalCoverage.read.placedTechniques + goalCoverage.change.placedTechniques + goalCoverage.deny.placedTechniques;
    expect(placedTotal).toBe(Object.keys(referenceData.placementRules.placements).length);
  });

  it('shows that deny-type techniques are mostly not placed, which is why a recording device counts none', () => {
    const headset = reportFor('noninvasive-eeg-headset');
    const openDeny = countOpenRisks(headset.riskRows, EMPTY_LENS, headset.model.controlsInPlace).byGoal.deny;
    expect(openDeny).toBe(0);
    expect(headset.goalCoverage.deny.placedTechniques).toBeLessThan(headset.goalCoverage.deny.catalogTechniques);
  });
});
