import { describe, it, expect } from 'vitest';
import { ThreatModelDataError } from '../errors';
import { parseArchetypes } from '../parse-archetypes';
import { parseComplianceUs } from '../parse-compliance';
import { DEFAULT_EVIDENCE_STATUSES } from '../catalog-types';
import { parsePlacementRules } from '../parse-mappings';
import { loadEngineBundle, loadReferenceData, readDataFile } from './load-test-data';

const bundle = loadEngineBundle();
const regionIds = new Set(bundle.engineData.regions.map((region) => region.id));

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('bundled reference data', () => {
  it('loads the catalog, atlas and CVE mapping', () => {
    const { engineData, tacticIds } = bundle;
    expect(engineData.techniques.length).toBeGreaterThan(100);
    expect(engineData.regions.length).toBeGreaterThan(30);
    expect(engineData.precedentCves.length).toBeGreaterThan(0);
    expect(tacticIds.size).toBeGreaterThan(10);
  });

  it('loads every authored file against the current catalog', () => {
    const referenceData = loadReferenceData(bundle);
    expect(referenceData.archetypes.map((archetype) => archetype.id)).toEqual([
      'noninvasive-eeg-headset', 'cortical-read-implant', 'subcortical-stimulator',
    ]);
  });

  it('gives every compliance requirement a source, a date read, and a quote', () => {
    const { sources, requirements } = loadReferenceData(bundle).compliance;
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    for (const requirement of requirements) {
      const source = sourceById.get(requirement.sourceId);
      expect(source?.url.startsWith('https://')).toBe(true);
      expect(source?.dateRead).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(requirement.quote.length).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('compliance data validation', () => {
  const validCompliance = readDataFile('threat-model/compliance-us.json') as { requirements: Record<string, unknown>[]; sources: Record<string, unknown>[] };

  it('rejects a requirement without a quote', () => {
    const broken = cloneData(validCompliance);
    delete broken.requirements[0].quote;
    expect(() => parseComplianceUs(broken)).toThrow(ThreatModelDataError);
  });

  it('rejects a source without a date read', () => {
    const broken = cloneData(validCompliance);
    delete broken.sources[0].dateRead;
    expect(() => parseComplianceUs(broken)).toThrow(/dateRead/);
  });

  it('rejects a requirement that cites an unknown source', () => {
    const broken = cloneData(validCompliance);
    broken.requirements[0].sourceId = 'not-a-source';
    expect(() => parseComplianceUs(broken)).toThrow(/sourceId/);
  });

  it('rejects a source that is not https', () => {
    const broken = cloneData(validCompliance);
    broken.sources[0].url = 'http://example.test/statute';
    expect(() => parseComplianceUs(broken)).toThrow(/https/);
  });
});

describe('placement table validation', () => {
  const validPlacement = readDataFile('threat-model/technique-placement.json') as {
    placements: Record<string, Record<string, unknown>>;
    notPlaced: Record<string, Record<string, unknown>>;
  };
  const techniques = bundle.engineData.techniques;

  it('holds a decision for every confirmed or demonstrated technique', () => {
    const rules = parsePlacementRules(validPlacement, techniques);
    const evidenced = techniques.filter((technique) => (DEFAULT_EVIDENCE_STATUSES as readonly string[]).includes(technique.evidenceStatus));
    for (const technique of evidenced) {
      expect(technique.id in rules.placements || technique.id in rules.notPlaced, technique.id).toBe(true);
    }
  });

  it('fails when an evidenced technique has no decision', () => {
    const broken = cloneData(validPlacement);
    delete broken.placements['QIF-T0049'];
    expect(() => parsePlacementRules(broken, techniques)).toThrow(/QIF-T0049.*no placement decision/);
  });

  it('fails when a decision names a technique the catalog does not have', () => {
    const broken = cloneData(validPlacement);
    broken.notPlaced['QIF-T9999'] = { category: 'external_energy', reason: 'Not a real technique.' };
    expect(() => parsePlacementRules(broken, techniques)).toThrow(/QIF-T9999/);
  });

  it('fails when a technique is both placed and not placed', () => {
    const broken = cloneData(validPlacement);
    broken.notPlaced['QIF-T0049'] = { category: 'external_energy', reason: 'Contradicts its placement.' };
    expect(() => parsePlacementRules(broken, techniques)).toThrow(/both placed and not placed/);
  });

  it('fails when a placement acts on nothing', () => {
    const broken = cloneData(validPlacement);
    Object.assign(broken.placements['QIF-T0049'], { onNeuralInterface: false, componentKinds: [], linkMedia: [], onLinksCarrying: [] });
    expect(() => parsePlacementRules(broken, techniques)).toThrow(/names no component or link/);
  });

  it('fails when a not-placed decision has no reason', () => {
    const broken = cloneData(validPlacement);
    delete broken.notPlaced['QIF-T0012'].reason;
    expect(() => parsePlacementRules(broken, techniques)).toThrow(/needs a known category and a reason/);
  });
});

describe('archetype validation', () => {
  const validArchetypes = readDataFile('threat-model/archetypes.json') as { archetypes: { defaultRegionIds: string[]; components: { isNeuralInterface: boolean }[]; links: { toComponentId: string }[] }[] };

  it('rejects an archetype that names a region outside the atlas', () => {
    const broken = cloneData(validArchetypes);
    broken.archetypes[0].defaultRegionIds = ['not_a_region'];
    expect(() => parseArchetypes(broken, regionIds)).toThrow(/not_a_region/);
  });

  it('rejects an archetype with no neural interface', () => {
    const broken = cloneData(validArchetypes);
    for (const component of broken.archetypes[0].components) component.isNeuralInterface = false;
    expect(() => parseArchetypes(broken, regionIds)).toThrow(/neural interface/);
  });

  it('rejects a link to a component that does not exist', () => {
    const broken = cloneData(validArchetypes);
    broken.archetypes[0].links[0].toComponentId = 'ghost';
    expect(() => parseArchetypes(broken, regionIds)).toThrow(/toComponentId/);
  });
});
