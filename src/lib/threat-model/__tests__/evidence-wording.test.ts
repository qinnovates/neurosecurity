import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { EVIDENCE_POPULATION_LABELS, EVIDENCE_TIER_GROUP, type EvidencePopulation } from '../../evidence-tiers';
import { CATALOG_SEVERITIES } from '../catalog-types';
import {
  ADJACENT_POPULATION_BY_CVE_CATEGORY, ADJACENT_POPULATION_PHRASES, NEURAL_COUNT_CVE_CATEGORIES, EVIDENCE_SHORT_LABELS, NOT_STATED_LABEL, PLACEMENT_PROVENANCE_LINE, describeEvidence, evidenceRankOf, weakestEvidenceOf,
} from '../evidence-levels';
import { readDataFile } from './load-test-data';
import { PRESETS, engineData } from './preset-reports';

const LEGACY_WORDS = /confirmed|proven/i;
const SHORT_LABELS = ['Lab', 'Case study', 'Modelled', 'Proposed', 'Speculative', 'Validated', 'Not stated'];
const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));

function wordsOf(evidence: ReturnType<typeof describeEvidence>): string {
  return [evidence.label, evidence.shortLabel, evidence.provenanceLine, evidence.cveLine, evidence.placementLine].filter((line) => line !== null).join('\n');
}

describe('describeEvidence over the whole catalog', () => {
  it('never says "confirmed" or "proven", on a catalog entry or on a device row', () => {
    for (const technique of engineData.techniques) {
      expect(wordsOf(describeEvidence(technique)), technique.id).not.toMatch(LEGACY_WORDS);
      expect(wordsOf(describeEvidence(technique, { isDeviceRow: true })), technique.id).not.toMatch(LEGACY_WORDS);
    }
  });

  it('uses only the seven short labels', () => {
    expect([...new Set(Object.values(EVIDENCE_SHORT_LABELS)), NOT_STATED_LABEL].sort()).toEqual([...SHORT_LABELS].sort());
    for (const technique of engineData.techniques) expect(SHORT_LABELS, technique.id).toContain(describeEvidence(technique).shortLabel);
  });

  it('rewords only "Lab-proven", to "lab"', () => {
    expect(describeEvidence({ evidenceTier: 'demonstrated_lab' }).label).toBe('Demonstrated (lab)');
    expect(describeEvidence({ evidenceTier: 'demonstrated_case' }).label).toBe('Demonstrated (Case Study / Observational)');
  });

  it('takes each adjacent-population phrase from the catalog\'s own label for that code', () => {
    for (const [population, phrase] of Object.entries(ADJACENT_POPULATION_PHRASES)) {
      expect(EVIDENCE_POPULATION_LABELS[population as EvidencePopulation], population).toContain(phrase);
    }
  });

  it('says only that a script set the tier and the date the catalog records', () => {
    for (const technique of engineData.techniques) {
      const { provenanceLine } = describeEvidence(technique);
      if (technique.evidenceDerivedBy === null) expect(provenanceLine, technique.id).toBeNull();
      else expect(provenanceLine, technique.id).toBe(`Tier set by script on ${technique.evidenceDerivedOn}.`);
      expect(provenanceLine ?? '', technique.id).not.toMatch(/earlier status|reviewed/);
    }
    expect(describeEvidence({ evidenceTier: 'speculative' }).provenanceLine).toBeNull();
    expect(describeEvidence({ evidenceTier: 'speculative' }).cveLine).toBeNull();
  });

  it('adds the placement line on a device row and nowhere else', () => {
    const [technique] = engineData.techniques;
    expect(describeEvidence(technique).placementLine).toBeNull();
    expect(describeEvidence(technique, { isDeviceRow: true }).placementLine).toBe(PLACEMENT_PROVENANCE_LINE);
  });

  it('ranks by the tier alone, whatever the legacy status says', () => {
    const tiers = Object.keys(EVIDENCE_TIER_GROUP);
    expect(tiers.map((tier) => evidenceRankOf({ evidenceTier: tier, evidenceStatus: 'THEORETICAL' }))).toEqual(tiers.map((_tier, index) => index));
    expect(evidenceRankOf({ evidenceTier: 'demonstrated_case', evidenceStatus: 'CONFIRMED' })).toBeGreaterThan(evidenceRankOf({ evidenceTier: 'demonstrated_lab', evidenceStatus: 'DEMONSTRATED' }));
    expect(evidenceRankOf({ evidenceTier: null, evidenceStatus: null })).toBe(tiers.length);
    expect(weakestEvidenceOf([{ evidenceTier: 'demonstrated_lab' }, { evidenceTier: 'theoretical_modeled' }])?.evidenceTier).toBe('theoretical_modeled');
    expect(weakestEvidenceOf([])).toBeNull();
  });

  it('words a record with no tier through the catalog\'s fallback tier, never through the legacy word', () => {
    expect(describeEvidence({ evidenceTier: null, evidenceStatus: 'CONFIRMED' })).toMatchObject({ level: 'demonstrated', label: 'Demonstrated (lab)', shortLabel: 'Lab' });
    expect(describeEvidence({ evidenceTier: null, evidenceStatus: null })).toMatchObject({ level: 'other', label: NOT_STATED_LABEL, shortLabel: NOT_STATED_LABEL });
  });
});

interface RawCveRecord { tara_techniques: string[]; category?: string; validation?: { nvd_verified?: boolean } }

describe('the CVE line against the per-record categories in datalake/cve-technique-mapping.json', () => {
  const TIER_SCRIPT = fs.readFileSync('src/scripts/migrate-populate-evidence-tier.py', 'utf-8');
  const counted = (readDataFile('cve-technique-mapping.json') as { mappings: RawCveRecord[] }).mappings.filter((record) => record.validation?.nvd_verified === true);
  const neuralCategories = [...(/NEURAL_PRODUCT_CATEGORIES = \{([^}]*)\}/.exec(TIER_SCRIPT)?.[1] ?? '').matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const populationByCategory = new Map([...(/POPULATION_BY_CATEGORY = \{([^}]*)\}/.exec(TIER_SCRIPT)?.[1] ?? '').matchAll(/"([^"]+)": "([^"]+)"/g)].map((match) => [match[1], match[2]]));

  /** The category of each counted record of a technique, read from the file and from nothing else. */
  function categoriesOf(techniqueId: string): string[] {
    return counted.filter((record) => record.tara_techniques.includes(techniqueId)).map((record) => record.category ?? '');
  }

  it('holds the same category lists as the script that set the counts', () => {
    expect(neuralCategories.length).toBeGreaterThan(0);
    expect([...NEURAL_COUNT_CVE_CATEGORIES].sort()).toEqual([...neuralCategories].sort());
    const adjacentInScript = [...populationByCategory].filter(([, population]) => population !== 'neural_product');
    expect(Object.entries(ADJACENT_POPULATION_BY_CVE_CATEGORY).sort()).toEqual(adjacentInScript.sort());
  });

  it('reproduces both recorded counts of every technique from the record categories', () => {
    for (const technique of engineData.techniques) {
      const categories = categoriesOf(technique.id);
      expect(technique.cveRecordCategories, technique.id).toEqual(categories);
      expect(categories.filter((category) => neuralCategories.includes(category)).length, technique.id).toBe(technique.neuralProductCveCount);
      expect(categories.filter((category) => !neuralCategories.includes(category)).length, technique.id).toBe(technique.adjacentCveCount);
    }
  });

  it('names one adjacent population only when every adjacent record of the technique is in it', () => {
    const adjacentOnly = engineData.techniques.filter((technique) => technique.neuralProductCveCount === 0 && (technique.adjacentCveCount ?? 0) > 0);
    expect(adjacentOnly.length).toBeGreaterThan(0);
    let mixedCount = 0;
    for (const technique of adjacentOnly) {
      const populations = new Set(categoriesOf(technique.id).map((category) => populationByCategory.get(category)));
      const { cveLine } = describeEvidence(technique);
      const namedPhrase = Object.entries(ADJACENT_POPULATION_PHRASES).find(([, phrase]) => cveLine?.endsWith(` in ${phrase}.`));
      if (populations.size === 1) {
        expect(namedPhrase?.[0], technique.id).toBe([...populations][0]);
        expect(cveLine, technique.id).toBe(`CVE records: none in a neural-data product; ${technique.adjacentCveCount} in ${namedPhrase?.[1]}.`);
      } else {
        mixedCount += 1;
        expect(namedPhrase, `${technique.id} has records in ${[...populations].join(' and ')}`).toBeUndefined();
        expect(cveLine, technique.id).toBe(`CVE records: none in a neural-data product; ${technique.adjacentCveCount} in adjacent technology.`);
      }
    }
    // The catalog holds techniques whose adjacent records span populations; the check above is not vacuous.
    expect(mixedCount).toBeGreaterThan(0);
  });

  it('names the catalog categories of the counted records and never calls them neural-data products', () => {
    const withNeuralCount = engineData.techniques.filter((technique) => (technique.neuralProductCveCount ?? 0) > 0);
    expect(withNeuralCount.length).toBeGreaterThan(0);
    for (const technique of withNeuralCount) {
      const present = neuralCategories.filter((category) => categoriesOf(technique.id).includes(category));
      const names = present.length === 1 ? present[0] : `${present.slice(0, -1).join(', ')} and ${present[present.length - 1]}`;
      const adjacent = technique.adjacentCveCount === 0 ? 'none' : technique.adjacentCveCount;
      const { cveLine } = describeEvidence(technique);
      expect(cveLine, technique.id).toBe(`CVE records: ${technique.neuralProductCveCount} in the catalog's ${present.length === 1 ? 'category' : 'categories'} ${names}; ${adjacent} in other categories.`);
      expect(cveLine, technique.id).not.toMatch(/neural-data product/);
    }
  });

  it('says "none in any product" exactly when the technique has no counted record', () => {
    for (const technique of engineData.techniques) {
      const hasNone = categoriesOf(technique.id).length === 0;
      expect(describeEvidence(technique).cveLine === 'CVE records: none in any product.', technique.id).toBe(hasNone);
    }
  });

  it('names no single population when the caller holds no records', () => {
    expect(describeEvidence({ evidenceTier: 'demonstrated_lab', neuralProductCveCount: 0, adjacentCveCount: 3, evidencePopulation: 'adjacent_clinical' }).cveLine)
      .toBe('CVE records: none in a neural-data product; 3 in adjacent technology.');
    expect(describeEvidence({ evidenceTier: 'demonstrated_lab', neuralProductCveCount: 2, adjacentCveCount: 0 }).cveLine)
      .toBe('CVE records: 2 in the catalog\'s categories Neural/EEG Systems, Implant Telemetry or Implant Gateway/Hub; none in other categories.');
  });
});

describe.each(PRESETS)('the tier travels with the status on the preset %s', (_id, { report }) => {
  it('on risk rows, chain steps, ambient threats and theme techniques', () => {
    for (const row of report.riskRows) expect(row.evidenceTier, row.riskId).toBe(row.techniqueId === null ? null : techniqueById.get(row.techniqueId)?.evidenceTier ?? null);
    for (const chain of report.chainResult.chains) {
      for (const step of chain.steps) expect(step.evidenceTier, step.technique_id).toBe(techniqueById.get(step.technique_id)?.evidenceTier);
      expect(chain.weakestEvidenceTier).toBe(weakestEvidenceOf(chain.steps)?.evidenceTier);
    }
    for (const threat of report.ambientThreats) expect(threat.evidenceTier).toBe(techniqueById.get(threat.techniqueId)?.evidenceTier);
    for (const technique of report.themes.flatMap((theme) => theme.techniques)) expect(technique.evidenceTier).toBe(techniqueById.get(technique.techniqueId)?.evidenceTier);
  });

  it('orders catalog rows by severity, then by tier rank, and ambient threats by tier rank', () => {
    const catalogRows = report.riskRows.filter((row) => row.source === 'catalog' && row.catalogSeverity !== null);
    const keys = catalogRows.map((row) => [CATALOG_SEVERITIES.indexOf(row.catalogSeverity ?? 'low'), evidenceRankOf(row)]);
    const sorted = [...keys].sort((left, right) => left[0] - right[0] || left[1] - right[1]);
    expect(keys).toEqual(sorted);
    const ambientRanks = report.ambientThreats.map((threat) => evidenceRankOf(threat));
    expect(ambientRanks).toEqual([...ambientRanks].sort((left, right) => left - right));
  });
});

describe('components', () => {
  const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;
  const READS_STATUS = /\b(weakestE|e)videnceStatus\b/;
  /** A component may hand the status to the wording function or to the mark that calls it; it may not print it. */
  const PASSES_IT_ON = /describeEvidence\(|<EvidenceMark\b/;

  function listSourceFiles(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSourceFiles(entryPath);
      return SOURCE_FILE_PATTERN.test(entry.name) ? [entryPath] : [];
    });
  }

  it('never render the legacy evidence status directly', () => {
    const files = listSourceFiles('src/components');
    expect(files.length).toBeGreaterThan(0);
    const offending = files.flatMap((file) => fs.readFileSync(file, 'utf-8').split('\n')
      .map((line, index) => ({ line, where: `${file}:${index + 1}` }))
      .filter(({ line }) => READS_STATUS.test(line) && !PASSES_IT_ON.test(line))
      .map(({ where }) => where));
    expect(offending).toEqual([]);
  });
});
