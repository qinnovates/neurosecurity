// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CuratedChains from '@/components/explore/CuratedChains';
import DeviceClasses from '@/components/explore/DeviceClasses';
import DeviceSpecifications from '@/components/explore/DeviceSpecifications';
import CatalogView from '@/components/explore/catalog/CatalogView';
import { curatedChains, engineData, inLab, referenceData } from '@/components/explore/__tests__/lab-harness';
import { describeRelationToDevice } from '@/components/monitor/MonitorMode';
import { describeAnalysisWindow, describeThresholdRule } from '@/components/monitor/SampleMonitor';
import { getKqlTables } from '@/lib/kql-tables';
import { buildThreatModelReport } from '@/lib/threat-model/build-report';
import { SUBMISSION_TYPES, type DeviceModel } from '@/lib/threat-model/device-model';
import { describeEvidence } from '@/lib/threat-model/evidence-levels';
import { buildModelFromIntake, defaultAnswersFor } from '@/lib/threat-model/intake-to-model';
import { applyLabTablePolicy } from '@/lib/threat-model/lab-table-policy';
import { buildQueryTables } from '@/lib/threat-model/query-tables';
import { listScopeEntries, summariseScope } from '@/lib/threat-model/scope-statement';
import ComplianceChecklist from '../../ComplianceChecklist';
import { ReportDocument } from '../../ReportView';

vi.mock('@/components/query/use-site-database', () => ({ useSiteDatabase: () => ({ tables: applyLabTablePolicy(getKqlTables()), error: null }) }));

afterEach(cleanup);

/**
 * Words that must not reach a reader of the Lab, as whole words, whatever file or data field
 * they come from. The source scan in honesty-guards.test.ts reads code; this reads what is
 * rendered and every string the views can print.
 */
const BANNED_WORDS: readonly { word: string; pattern: RegExp; rule: string }[] = [
  { word: 'confirmed', pattern: /\bconfirmed\b/gi, rule: 'A retired evidence word: evidence is worded by tier.' },
  { word: 'proven', pattern: /\bproven\b/gi, rule: 'A retired evidence word: a lab demonstration is not called proof.' },
  { word: 'siem', pattern: /\bsiem\b/gi, rule: 'The product is never called a SIEM.' },
  { word: 'scanner', pattern: /\bscanner\b/gi, rule: 'The product is never called a scanner.' },
  { word: 'detection system', pattern: /\bdetection system\b/gi, rule: 'The product is never called a detection system.' },
  { word: 'compliant', pattern: /\bcompliant\b/gi, rule: 'The checklist never says a device is compliant.' },
];

/**
 * Places a banned word is allowed to stand, each with why. A hit is excused only when its text
 * contains the exception's `text`; every exception must still be met by a hit, so one that no
 * longer applies fails the test until it is removed.
 */
const EXCEPTIONS: readonly { word: string; text: string; why: string }[] = [
  { word: 'scanner', text: 'LiDAR Scanner', why: 'The catalog\'s own name for a sensor inside a technique name; it names hardware, not this product.' },
];

/** Fields that hold a legacy status word for the engine's own use and are never printed; evidence-wording.test.ts holds components to that. */
const UNPRINTED_KEYS: ReadonlySet<string> = new Set(['evidenceStatus', 'weakestEvidenceStatus', 'evidenceBasis']);

interface Hit { word: string; where: string; text: string }

function findHits(text: string, where: string): Hit[] {
  return BANNED_WORDS.flatMap(({ word, pattern }) => [...text.matchAll(pattern)].map((match) => {
    const start = Math.max(0, (match.index ?? 0) - 40);
    return { word, where, text: text.slice(start, (match.index ?? 0) + word.length + 40) };
  }));
}

/** Every string anywhere inside a value, with the path to it, leaving out the unprinted fields. */
function collectStrings(value: unknown, where: string, found: [string, string][] = []): [string, string][] {
  if (typeof value === 'string') found.push([where, value]);
  else if (Array.isArray(value)) value.forEach((item, index) => collectStrings(item, `${where}[${index}]`, found));
  else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) if (!UNPRINTED_KEYS.has(key)) collectStrings(item, `${where}.${key}`, found);
  }
  return found;
}

function hitsIn(value: unknown, where: string): Hit[] {
  return collectStrings(value, where).flatMap(([path, text]) => findHits(text, path));
}

function isExcused(hit: Hit): boolean {
  return EXCEPTIONS.some((exception) => exception.word === hit.word && hit.text.includes(exception.text));
}

function unexcused(hits: readonly Hit[]): string[] {
  return hits.filter((hit) => !isExcused(hit)).map((hit) => `"${hit.word}" at ${hit.where}: …${hit.text}…`);
}

const presets = referenceData.archetypes.map((archetype) => {
  const model = buildModelFromIntake(defaultAnswersFor(archetype), archetype, engineData.registrarVersion);
  return [archetype.id, model] as const;
});
const reportOf = (model: DeviceModel) => buildThreatModelReport({ model, engineData, referenceData, generatedAt: '2026-10-09T00:00:00.000Z' });
const allHits: Hit[] = [];
const record = (hits: Hit[]): Hit[] => { allHits.push(...hits); return hits; };

describe('the guard itself', () => {
  it('finds each banned word as a whole word, in any letter case, and not inside another word', () => {
    expect(findHits('Status CONFIRMED by a scanner, a SIEM or a detection system; proven and compliant.', 'probe').map((hit) => hit.word).sort())
      .toEqual(['compliant', 'confirmed', 'detection system', 'proven', 'scanner', 'siem']);
    expect(findHits('Siemens unconfirmed noncompliant scanners improvenly', 'probe')).toEqual([]);
  });

  it('would have caught the two sentences the report used to print', () => {
    expect(findHits('Only catalog techniques with confirmed or demonstrated evidence have a placement decision.', 'old limitation')).toHaveLength(1);
    expect(findHits('using only techniques with confirmed or demonstrated evidence.', 'old chain sentence')).toHaveLength(1);
  });
});

describe.each(presets)('words rendered for the preset %s', (_id, model) => {
  const report = reportOf(model);

  it('the report document, with its register, scope lists, chains, checklist and CVE list', () => {
    const { container } = render(<ReportDocument report={report} engineData={engineData} referenceData={referenceData} regionNames={['Region']} />);
    expect(container.textContent?.length).toBeGreaterThan(5000);
    expect(unexcused(record(findHits(container.textContent ?? '', 'report document')))).toEqual([]);
    const attributes = [...container.querySelectorAll('[aria-label], [title]')].map((element) => `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''}`).join('\n');
    expect(unexcused(record(findHits(attributes, 'report document, labels and titles')))).toEqual([]);
  });

  it.each(SUBMISSION_TYPES)('the checklist under the submission type %s', (submissionType) => {
    const typed = reportOf({ ...model, submissionType });
    const { container } = render(<ComplianceChecklist assessment={typed.cyberDeviceAssessment} items={typed.complianceItems} />);
    expect(unexcused(record(findHits(container.textContent ?? '', `checklist ${submissionType}`)))).toEqual([]);
  });

  it('every string of the report the Model views are drawn from', () => {
    expect(unexcused(record(hitsIn(report, 'report')))).toEqual([]);
  });

  it('every cell of every Query table', () => {
    const tables = { ...applyLabTablePolicy(getKqlTables()), ...buildQueryTables(report, engineData, referenceData.placementRules) };
    expect(Object.keys(tables).length).toBeGreaterThan(10);
    expect(unexcused(record(hitsIn(tables, 'query')))).toEqual([]);
  });

  it('where each technique stands, with its reasons and conditions, and the Monitor\'s sentence about the device', () => {
    expect(unexcused(record(hitsIn(listScopeEntries(summariseScope(model, engineData, referenceData)), 'scope')))).toEqual([]);
    expect(unexcused(record(findHits(describeRelationToDevice(model), 'monitor')))).toEqual([]);
  });
});

describe('words rendered whatever the device', () => {
  it('the catalog: every technique, tactic and CVE record, and every evidence line', () => {
    expect(unexcused(record(hitsIn({ techniques: engineData.techniques, tactics: engineData.tactics, cves: engineData.precedentCves }, 'catalog')))).toEqual([]);
    const evidenceLines = engineData.techniques.flatMap((technique) => [describeEvidence(technique), describeEvidence(technique, { isDeviceRow: true })]);
    expect(unexcused(record(hitsIn(evidenceLines, 'evidence lines')))).toEqual([]);
  });

  it('Explore: Start, Techniques and Published device specifications', () => {
    for (const [name, view] of [['start', <DeviceClasses key="start" />], ['techniques', <CatalogView key="catalog" />], ['specifications', <DeviceSpecifications key="specs" onOpenStart={() => undefined} />]] as const) {
      const { container } = inLab(view);
      expect(container.textContent?.length, name).toBeGreaterThan(200);
      expect(unexcused(record(findHits(container.textContent ?? '', `explore ${name}`))), name).toEqual([]);
      cleanup();
    }
  });

  it('Explore: every authored chain, opened', () => {
    const { container } = inLab(<CuratedChains />);
    for (const chain of curatedChains) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(chain.chain_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));
      expect(unexcused(record(findHits(container.textContent ?? '', `authored chain ${chain.chain_id}`))), chain.chain_id).toEqual([]);
    }
  });

  it('Monitor: the rule and the analysis window, at the sample rates it is given', () => {
    for (const rate of [100, 250, 500]) {
      expect(unexcused(record(findHits(`${describeThresholdRule(75, rate)} ${describeAnalysisWindow(rate)}`, 'monitor')))).toEqual([]);
    }
  });

  // Runs last: by now every surface above has recorded what it found.
  it('meets every listed exception, so the list cannot keep an entry that no longer applies', () => {
    for (const exception of EXCEPTIONS) {
      expect(allHits.some((hit) => hit.word === exception.word && hit.text.includes(exception.text)), `${exception.word}: ${exception.text}`).toBe(true);
    }
    expect(EXCEPTIONS).toHaveLength(1);
  });
});
