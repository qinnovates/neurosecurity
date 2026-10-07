import { describe, it, expect } from 'vitest';
import { buildThreatModelReport } from '../build-report';
import { countByEvidence, countByEvidenceLevel, describeEvidence } from '../evidence-levels';
import { buildModelFromIntake, defaultAnswersFor } from '../intake-to-model';
import { summarisePlacementCoverage } from '../placement-coverage';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);

describe('evidence', () => {
  it('reads the tier before the legacy status, and groups it as the catalog does', () => {
    expect(describeEvidence({ evidenceTier: 'demonstrated_case', evidenceStatus: 'THEORETICAL' })).toMatchObject({ level: 'demonstrated', label: 'Demonstrated (Case Study / Observational)' });
    expect(describeEvidence({ evidenceTier: 'theoretical_modeled', evidenceStatus: 'THEORETICAL' }).level).toBe('theoretical');
    expect(describeEvidence({ evidenceTier: 'speculative', evidenceStatus: 'PLAUSIBLE' }).level).toBe('speculative');
  });

  it('falls back to the legacy status when a record has no tier, and never calls it validated', () => {
    expect(describeEvidence({ evidenceTier: null, evidenceStatus: 'CONFIRMED' })).toMatchObject({ level: 'demonstrated', label: 'Confirmed' });
    expect(describeEvidence({ evidenceTier: null, evidenceStatus: 'emerging' }).level).toBe('theoretical');
  });

  it('keeps a value neither scheme knows visible as "other" under its own word', () => {
    expect(describeEvidence({ evidenceTier: 'brand_new_tier', evidenceStatus: 'CONFIRMED' })).toMatchObject({ level: 'other', label: 'Brand new tier' });
    expect(describeEvidence({ evidenceTier: null, evidenceStatus: null })).toMatchObject({ level: 'other', label: 'Not stated' });
  });

  it('ranks stronger evidence first', () => {
    const rank = (tier: string): number => describeEvidence({ evidenceTier: tier, evidenceStatus: null }).rank;
    expect(rank('demonstrated_lab')).toBeLessThan(rank('theoretical_proposed'));
    expect(rank('theoretical_proposed')).toBeLessThan(rank('speculative'));
  });

  it('counts every catalog technique exactly once, by value and by level', () => {
    const byValue = countByEvidence(engineData.techniques);
    expect(byValue.reduce((sum, entry) => sum + entry.count, 0)).toBe(engineData.techniques.length);
    expect(byValue.map((entry) => entry.rank)).toEqual([...byValue.map((entry) => entry.rank)].sort((left, right) => left - right));
    const byLevel = countByEvidenceLevel(engineData.techniques);
    expect(byLevel.map((entry) => entry.level)).toEqual(['validated', 'demonstrated', 'theoretical', 'speculative', 'other']);
    expect(byLevel.reduce((sum, entry) => sum + entry.count, 0)).toBe(engineData.techniques.length);
    expect(countByEvidenceLevel([])).toHaveLength(5);
  });

  it('carries a tier for every technique in today\'s catalog', () => {
    expect(engineData.techniques.filter((technique) => technique.evidenceTier === null)).toEqual([]);
  });
});

describe('placement coverage', () => {
  it('accounts for the whole catalog with no device', () => {
    const coverage = summarisePlacementCoverage(engineData.techniques, referenceData.placementRules);
    expect(coverage.placedHere + coverage.notPlaced + coverage.notAssessed).toBe(coverage.total);
    expect(coverage.placedElsewhere).toBe(0);
    expect(coverage.placedHere).toBe(Object.keys(referenceData.placementRules.placements).length);
    expect(coverage.notPlaced).toBe(Object.keys(referenceData.placementRules.notPlaced).length);
  });

  it('separates techniques placed on this device from those placed only on other kinds', () => {
    for (const archetype of referenceData.archetypes) {
      const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
      const report = buildThreatModelReport({ model, engineData, referenceData, generatedAt: '' });
      const onDevice = new Set(report.riskRows.flatMap((row) => (row.source === 'catalog' && row.techniqueId !== null ? [row.techniqueId] : [])));
      const coverage = summarisePlacementCoverage(engineData.techniques, referenceData.placementRules, onDevice);
      expect(coverage.placedHere).toBe(onDevice.size);
      expect(coverage.placedHere + coverage.placedElsewhere + coverage.notPlaced + coverage.notAssessed).toBe(coverage.total);
    }
  });

  it('reports an empty catalog as all zeros', () => {
    expect(summarisePlacementCoverage([], { placements: {}, notPlaced: {} })).toEqual({ placedHere: 0, placedElsewhere: 0, notPlaced: 0, notAssessed: 0, total: 0 });
  });
});
