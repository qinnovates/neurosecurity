import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { REPORT_LIMITATIONS, describePlacementCoverage, listLimitations } from '../build-report';
import { CHAIN_HYPOTHESIS_STATEMENT } from '../chain-types';
import { readDataFile } from './load-test-data';
import { PRESETS } from './preset-reports';

const LEGACY_EVIDENCE_WORDS = /\b(confirmed|proven)\b/i;
const rawPlacement = readDataFile('threat-model/technique-placement.json') as { placements: Record<string, unknown>; notPlaced: Record<string, unknown> };
const rawCatalog = readDataFile('qtara-registrar.json') as { techniques: unknown[] };

describe.each(PRESETS)('report limitations on the preset %s', (_id, { report }) => {
  it('state the share of the catalog with a placement decision, counted from the two data files', () => {
    const decided = Object.keys(rawPlacement.placements).length + Object.keys(rawPlacement.notPlaced).length;
    const sentence = `${decided} of ${rawCatalog.techniques.length} catalog techniques have a placement decision. The rest of the catalog is not assessed.`;
    expect(describePlacementCoverage(report.catalogCoverage)).toBe(sentence);
    expect(report.limitations).toContain(sentence);
    expect(report.limitations).toEqual(listLimitations(report.catalogCoverage));
    expect(report.limitations).toHaveLength(REPORT_LIMITATIONS.length + 1);
  });

  it('use no legacy evidence word', () => {
    for (const limitation of report.limitations) expect(limitation).not.toMatch(LEGACY_EVIDENCE_WORDS);
  });
});

describe('the chain sentence', () => {
  it('uses no legacy evidence word', () => {
    expect(CHAIN_HYPOTHESIS_STATEMENT).not.toMatch(LEGACY_EVIDENCE_WORDS);
  });

  it('is the sentence the Chains view prints, or the one it imports', () => {
    const chainsView = fs.readFileSync('src/components/threat-model/ChainsSection.tsx', 'utf-8');
    const printsItself = CHAIN_HYPOTHESIS_STATEMENT.split('. ').every((sentence) => chainsView.includes(sentence.replace(/\.$/, '')));
    expect(printsItself || chainsView.includes('CHAIN_HYPOTHESIS_STATEMENT')).toBe(true);
  });

  it('is the sentence the report prints', () => {
    const reportChains = fs.readFileSync('src/components/threat-model/ChainList.tsx', 'utf-8');
    expect(reportChains).toContain('{CHAIN_HYPOTHESIS_STATEMENT}');
    expect(reportChains).not.toMatch(LEGACY_EVIDENCE_WORDS);
  });
});
