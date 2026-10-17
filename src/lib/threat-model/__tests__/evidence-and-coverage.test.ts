import { describe, it, expect } from 'vitest';
import { buildThreatModelReport } from '../build-report';
import { countByEvidenceLevel, evidenceLabel, evidenceLevelOf } from '../evidence-levels';
import { buildModelFromIntake, defaultAnswersFor } from '../intake-to-model';
import { summarisePlacementCoverage } from '../placement-coverage';
import { loadEngineBundle, loadReferenceData } from './load-test-data';

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);

describe('evidence levels', () => {
  it('maps the four ranked statuses, whatever their case', () => {
    expect(evidenceLevelOf('CONFIRMED')).toBe('confirmed');
    expect(evidenceLevelOf('demonstrated')).toBe('demonstrated');
    expect(evidenceLevelOf(' Emerging ')).toBe('emerging');
    expect(evidenceLevelOf('THEORETICAL')).toBe('theoretical');
  });

  it('keeps an unknown status visible as "other" under its own word', () => {
    expect(evidenceLevelOf('PLAUSIBLE')).toBe('other');
    expect(evidenceLabel('PLAUSIBLE')).toBe('Plausible');
    expect(evidenceLabel('')).toBe('Not stated');
  });

  it('counts every catalog technique exactly once, with zero-count levels present', () => {
    const counts = countByEvidenceLevel(engineData.techniques);
    expect(counts.map((entry) => entry.level)).toEqual(['confirmed', 'demonstrated', 'emerging', 'theoretical', 'other']);
    expect(counts.reduce((sum, entry) => sum + entry.count, 0)).toBe(engineData.techniques.length);
    expect(countByEvidenceLevel([])).toHaveLength(5);
  });

  it('names the catalog\'s own words for statuses outside the ranked four', () => {
    const other = countByEvidenceLevel(engineData.techniques).find((entry) => entry.level === 'other');
    const unranked = new Set(engineData.techniques.map((technique) => technique.evidenceStatus).filter((status) => evidenceLevelOf(status) === 'other'));
    expect(other?.statuses).toHaveLength(unranked.size);
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
