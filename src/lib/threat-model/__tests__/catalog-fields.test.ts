import { describe, it, expect } from 'vitest';
import { engineData, referenceData } from './preset-reports';
import { readDataFile } from './load-test-data';
import { PLACEMENT_REVIEW_FIELD } from '../parse-mappings';

interface RawEvidence {
  tier?: string; basis?: string; population?: string; neural_product_cve_count?: number; adjacent_cve_count?: number; derived_by?: string; derived_on?: string;
}
interface RawTechnique { id: string; evidence?: RawEvidence; sources?: string[] }

const rawTechniques = (readDataFile('qtara-registrar.json') as { techniques: RawTechnique[] }).techniques;
const rawPlacement = readDataFile('threat-model/technique-placement.json') as { version: string; status: string; placements: Record<string, Record<string, unknown>>; notPlaced: Record<string, unknown> };

describe('catalog fields read from the registrar', () => {
  it('carries the evidence record and the sources of every technique exactly as the file has them', () => {
    expect(engineData.techniques).toHaveLength(rawTechniques.length);
    for (const [index, raw] of rawTechniques.entries()) {
      const technique = engineData.techniques[index];
      expect(technique.id).toBe(raw.id);
      expect({
        tier: technique.evidenceTier, basis: technique.evidenceBasis, population: technique.evidencePopulation,
        neural: technique.neuralProductCveCount, adjacent: technique.adjacentCveCount, by: technique.evidenceDerivedBy, on: technique.evidenceDerivedOn,
      }, raw.id).toEqual({
        tier: raw.evidence?.tier ?? null, basis: raw.evidence?.basis ?? null, population: raw.evidence?.population ?? null,
        neural: raw.evidence?.neural_product_cve_count ?? null, adjacent: raw.evidence?.adjacent_cve_count ?? null,
        by: raw.evidence?.derived_by ?? null, on: raw.evidence?.derived_on ?? null,
      });
      expect(technique.sources, raw.id).toEqual(raw.sources ?? []);
    }
  });

  it('loads no description, notes or mechanism text, and no band controls', () => {
    for (const technique of engineData.techniques) {
      for (const field of ['description', 'notes', 'mechanism']) expect(technique, technique.id).not.toHaveProperty(field);
    }
    expect(engineData).not.toHaveProperty('controlsByBand');
  });
});

describe('placement table info', () => {
  const info = referenceData.placementTable;

  it('exposes the version and status as the file writes them, with counts taken from its records', () => {
    expect(info.version).toBe(rawPlacement.version);
    expect(info.status).toBe(rawPlacement.status);
    expect(info.placementCount).toBe(Object.keys(rawPlacement.placements).length);
    expect(info.notPlacedCount).toBe(Object.keys(rawPlacement.notPlaced).length);
  });

  it('counts a placement as reviewed only when its record carries the review field', () => {
    const withField = Object.values(rawPlacement.placements).filter((placement) => PLACEMENT_REVIEW_FIELD in placement).length;
    expect(info.reviewedPlacementCount).toBe(withField);
    expect(info.reviewedPlacementCount).toBeLessThanOrEqual(info.placementCount);
  });

  it('carries the checklist version from its file', () => {
    expect(referenceData.compliance.version).toBe((readDataFile('threat-model/compliance-us.json') as { version: string }).version);
  });
});
