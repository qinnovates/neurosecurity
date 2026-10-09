import { describe, it, expect } from 'vitest';
import { buildThreatModelReport } from '../build-report';
import { ThreatModelDataError } from '../errors';
import { buildModelFromIntake, defaultAnswersFor, type IntakeAnswers } from '../intake-to-model';
import { describeEvidence } from '../evidence-levels';
import { EMPTY_LENS, applyLens, countOpenRisks, isLensActive, lensGoalOf, listLensElementIds, type LensContext } from '../lens';
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
const contextFor = (report: ThreatModelReport): LensContext => ({ model: report.model, techniques: engineData.techniques });
const stimulatorContext = contextFor(stimulator);

describe('risk rows carry the lens fields', () => {
  it('gives every catalog row an entry path and a goal, and leaves baseline rows without', () => {
    for (const row of stimulator.riskRows) {
      if (row.source === 'catalog' && row.catalogState === 'current') {
        expect(row.entryPath, row.riskId).not.toBeNull();
        expect(row.goal, row.riskId).not.toBeNull();
      }
      if (row.source === 'stride') expect([row.entryPath, row.goal, row.evidenceTier]).toEqual([null, null, null]);
    }
  });
});

describe('applyLens', () => {
  it('lets everything through when empty', () => {
    expect(isLensActive(EMPTY_LENS)).toBe(false);
    expect(applyLens(stimulator.riskRows, EMPTY_LENS, stimulatorContext)).toHaveLength(stimulator.riskRows.length);
  });

  it('narrows to one part alone when the lens says so', () => {
    const rows = applyLens(stimulator.riskRows, { ...EMPTY_LENS, elementId: 'implant', isElementOnly: true }, stimulatorContext);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.elementId === 'implant')).toBe(true);
  });

  it('narrows by how a technique gets in and by what it does, together', () => {
    const rows = applyLens(stimulator.riskRows, { ...EMPTY_LENS, entryPaths: ['neural_interface'], goals: ['change'] }, stimulatorContext);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.entryPath === 'neural_interface' && row.goal === 'change')).toBe(true);
  });
});

describe('countOpenRisks', () => {
  it('counts every open catalog risk once per lens when nothing is selected', () => {
    const counts = countOpenRisks(stimulator.riskRows, EMPTY_LENS);
    const sum = (record: Record<string, number>): number => Object.values(record).reduce((total, count) => total + count, 0);
    expect(sum(counts.byEntryPath)).toBe(catalogRows.length);
    expect(sum(counts.byGoal) - sum(counts.baselineByGoal)).toBe(catalogRows.length);
  });

  it('shows what choosing a value would display, given the other lens', () => {
    const lens = { ...EMPTY_LENS, goals: ['deny' as const] };
    const counts = countOpenRisks(stimulator.riskRows, lens, stimulatorContext);
    const shown = applyLens(stimulator.riskRows, { ...lens, entryPaths: ['neural_interface'] }, stimulatorContext);
    expect(counts.byEntryPath.neural_interface).toBe(shown.length);
  });

  it('drops exactly one risk from the counts once a decision is recorded on its row', () => {
    const [decided] = catalogRows;
    const rows = stimulator.riskRows.map((row) => (row.riskId === decided.riskId ? { ...row, status: 'mitigated' as const } : row));
    const total = (counts: ReturnType<typeof countOpenRisks>): number => Object.values(counts.byGoal).reduce((sum, count) => sum + count, 0);
    expect(total(countOpenRisks(rows, EMPTY_LENS))).toBe(total(countOpenRisks(stimulator.riskRows, EMPTY_LENS)) - 1);
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
    const counts = countOpenRisks(headset.riskRows, EMPTY_LENS);
    expect(counts.byGoal.deny - counts.baselineByGoal.deny).toBe(0);
    expect(headset.goalCoverage.deny.placedTechniques).toBeLessThan(headset.goalCoverage.deny.catalogTechniques);
  });
});

describe('a selected part brings its connections', () => {
  const cortical = reportFor('cortical-read-implant');
  const context = contextFor(cortical);
  const app = cortical.model.components.find((component) => component.kind === 'patient_app');
  if (app === undefined) throw new Error('test setup: the cortical preset has no patient app');
  const appLinks = cortical.model.links.filter((link) => link.fromComponentId === app.id || link.toComponentId === app.id);

  it('includes the patient app\'s Bluetooth and internet links by default', () => {
    expect(appLinks.map((link) => link.medium).sort()).toEqual(['bluetooth_le', 'internet']);
    const lens = { ...EMPTY_LENS, elementId: app.id };
    expect(listLensElementIds(lens, cortical.model)).toEqual([app.id, ...appLinks.map((link) => link.id)]);
    const rows = applyLens(cortical.riskRows, lens, context);
    const expectedIds = new Set([app.id, ...appLinks.map((link) => link.id)]);
    expect(rows).toEqual(cortical.riskRows.filter((row) => expectedIds.has(row.elementId)));
    for (const link of appLinks) expect(rows.some((row) => row.elementId === link.id), link.id).toBe(true);
  });

  it('shows the part alone when restricted, and a selected connection never brings its parts', () => {
    const alone = applyLens(cortical.riskRows, { ...EMPTY_LENS, elementId: app.id, isElementOnly: true }, context);
    expect(alone).toEqual(cortical.riskRows.filter((row) => row.elementId === app.id));
    const [link] = appLinks;
    expect(applyLens(cortical.riskRows, { ...EMPTY_LENS, elementId: link.id }, context)).toEqual(cortical.riskRows.filter((row) => row.elementId === link.id));
  });
});

describe('the catalog facets of the lens', () => {
  const context = stimulatorContext;
  const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));

  it('narrows to one technique', () => {
    const { techniqueId } = catalogRows[0];
    const rows = applyLens(stimulator.riskRows, { ...EMPTY_LENS, techniqueId }, context);
    expect(rows).toEqual(stimulator.riskRows.filter((row) => row.techniqueId === techniqueId));
    expect(isLensActive({ ...EMPTY_LENS, techniqueId })).toBe(true);
  });

  it('narrows by catalog severity and by evidence label, and hides baseline rows under either', () => {
    const critical = applyLens(stimulator.riskRows, { ...EMPTY_LENS, severities: ['critical'] }, context);
    expect(critical).toEqual(stimulator.riskRows.filter((row) => row.catalogSeverity === 'critical'));
    const label = describeEvidence(catalogRows[0]).label;
    const byEvidence = applyLens(stimulator.riskRows, { ...EMPTY_LENS, evidenceLevels: [label] }, context);
    expect(byEvidence).toEqual(catalogRows.filter((row) => describeEvidence(row).label === label));
    expect(byEvidence.length).toBeGreaterThan(0);
  });

  it('narrows by band through the technique behind each row', () => {
    const bandId = techniqueById.get(catalogRows[0].techniqueId ?? '')?.bandIds[0];
    if (bandId === undefined) throw new Error('test setup: the first technique lists no band');
    const rows = applyLens(stimulator.riskRows, { ...EMPTY_LENS, bandIds: [bandId] }, context);
    expect(rows).toEqual(catalogRows.filter((row) => techniqueById.get(row.techniqueId ?? '')?.bandIds.includes(bandId)));
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('baseline denial-of-service rows', () => {
  const baselineDeny = stimulator.riskRows.filter((row) => row.source === 'stride' && row.strideCategories.includes('denial_of_service'));

  it('count under the Deny goal, in the rows shown and in the count', () => {
    expect(baselineDeny.length).toBeGreaterThan(0);
    for (const row of baselineDeny) expect(lensGoalOf(row)).toBe('deny');
    const shown = applyLens(stimulator.riskRows, { ...EMPTY_LENS, goals: ['deny'] }, stimulatorContext);
    expect(shown.filter((row) => row.source === 'stride')).toEqual(baselineDeny);
    const counts = countOpenRisks(stimulator.riskRows, EMPTY_LENS, stimulatorContext);
    expect(counts.baselineByGoal).toEqual({ read: 0, change: 0, deny: baselineDeny.length });
    expect(counts.byGoal.deny).toBe(shown.length);
  });

  it('leave every other baseline row without a goal', () => {
    for (const row of stimulator.riskRows.filter((candidate) => candidate.source === 'stride' && !candidate.strideCategories.includes('denial_of_service'))) {
      expect(lensGoalOf(row)).toBeNull();
    }
  });
});
