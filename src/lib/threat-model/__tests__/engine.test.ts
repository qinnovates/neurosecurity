import { describe, it, expect } from 'vitest';
import { TaraChainsFormatError, isAttackChain, parseTaraChains } from '../../../components/atlas/load-tara-chains';
import { buildThreatModelReport } from '../build-report';
import { DEFAULT_EVIDENCE_STATUSES } from '../catalog-types';
import { GENERATED_CHAIN_ID_PREFIX } from '../chain-types';
import type { DeviceModel } from '../device-model';
import { DEFAULT_CHAIN_OPTIONS } from '../generate-chains';
import { buildModelFromIntake, defaultAnswersFor, type IntakeAnswers } from '../intake-to-model';
import { parseDeviceModelText } from '../parse-device-model';
import type { ThreatModelReport } from '../report-types';
import { loadEngineBundle, loadReferenceData, readDataFile } from './load-test-data';

const bundle = loadEngineBundle();
const { engineData } = bundle;
const referenceData = loadReferenceData(bundle);
const techniqueById = new Map(engineData.techniques.map((technique) => [technique.id, technique]));
const GENERATED_AT = '2026-10-06T00:00:00Z';
const ARCHETYPE_IDS = ['noninvasive-eeg-headset', 'cortical-read-implant', 'subcortical-stimulator'] as const;
const WRITE_ONLY_TECHNIQUE_IDS = ['QIF-T0001', 'QIF-T0029', 'QIF-T0067'];

function buildModel(archetypeId: string, overrides: Partial<IntakeAnswers> = {}): DeviceModel {
  const archetype = referenceData.archetypes.find((candidate) => candidate.id === archetypeId);
  if (archetype === undefined) throw new Error(`test setup: unknown archetype ${archetypeId}`);
  return buildModelFromIntake({ ...defaultAnswersFor(archetype), ...overrides }, archetype, engineData.registrarVersion);
}

function reportFor(model: DeviceModel, chainOptions = DEFAULT_CHAIN_OPTIONS): ThreatModelReport {
  return buildThreatModelReport({ model, engineData, referenceData, generatedAt: GENERATED_AT, chainOptions });
}

function matchedTechniqueIds(report: ThreatModelReport): Set<string> {
  return new Set(report.riskRows.filter((row) => row.source === 'catalog').map((row) => row.techniqueId as string));
}

describe.each(ARCHETYPE_IDS)('report for %s', (archetypeId) => {
  const model = buildModel(archetypeId);
  const report = reportFor(model);

  it('gives every component and link exactly one stated outcome', () => {
    const elementIds = [...model.components.map((component) => component.id), ...model.links.map((link) => link.id)];
    expect(report.elementOutcomes.map((outcome) => outcome.elementId)).toEqual(elementIds);
    for (const outcome of report.elementOutcomes) {
      if (outcome.kind === 'matched') expect(outcome.matches.length).toBeGreaterThan(0);
      if (outcome.kind === 'not_applicable') expect(outcome.exclusions.length).toBeGreaterThan(0);
      if (outcome.kind === 'not_modelled') expect(outcome.detail.length).toBeGreaterThan(0);
    }
  });

  it('gives every matched technique a reason and an evidence status', () => {
    for (const outcome of report.elementOutcomes) {
      if (outcome.kind !== 'matched') continue;
      for (const match of outcome.matches) {
        expect(match.reasons.length).toBeGreaterThan(0);
        expect(match.reasons[0].detail.length).toBeGreaterThan(10);
      }
    }
    for (const row of report.riskRows.filter((candidate) => candidate.source === 'catalog')) {
      expect(row.evidenceStatus).toBeTruthy();
    }
  });

  it('labels every chain as generated, with a reserved id and a basis on each edge', () => {
    expect(report.chainResult.chains.length).toBeGreaterThan(0);
    for (const chain of report.chainResult.chains) {
      expect(chain.origin).toBe('generated');
      expect(chain.chain_id.startsWith(GENERATED_CHAIN_ID_PREFIX)).toBe(true);
      expect(chain.edges).toHaveLength(chain.steps.length - 1);
      expect(isAttackChain(chain)).toBe(true);
      expect(new Set(chain.steps.map((step) => step.technique_id)).size).toBe(chain.steps.length);
      expect(chain.steps.length).toBeLessThanOrEqual(DEFAULT_CHAIN_OPTIONS.maxSteps);
    }
  });

  it('keeps emerging and theoretical techniques out of chains by default', () => {
    for (const chain of report.chainResult.chains) {
      for (const step of chain.steps) {
        expect(DEFAULT_EVIDENCE_STATUSES).toContain(techniqueById.get(step.technique_id)?.evidenceStatus);
      }
    }
  });

  it('places chain steps only on elements where the technique was matched', () => {
    const matchedPairs = new Set(report.elementOutcomes.flatMap((outcome) =>
      (outcome.kind === 'matched' ? outcome.matches.map((match) => `${match.elementId}|${match.techniqueId}`) : [])));
    for (const chain of report.chainResult.chains) {
      for (const step of chain.steps) expect(matchedPairs.has(`${step.elementId}|${step.technique_id}`)).toBe(true);
    }
  });

  it('never shows a technique without a CVSS vector as scored, and keeps baseline rows unscored', () => {
    for (const row of report.riskRows) {
      if (row.source === 'stride') {
        expect(row.cvssBaseVector).toBeNull();
        expect(row.catalogSeverity).toBeNull();
      } else {
        expect(row.cvssBaseVector).toBe(techniqueById.get(row.techniqueId as string)?.cvssBaseVector ?? null);
      }
    }
  });

  it('is deterministic', () => {
    expect(reportFor(buildModel(archetypeId))).toEqual(report);
  });

  it('survives an export and import round trip unchanged', () => {
    const regionIds = new Set(engineData.regions.map((region) => region.id));
    const reimported = parseDeviceModelText(JSON.stringify(model), regionIds);
    expect(reportFor(reimported)).toEqual(report);
  });
});

describe('read and write preconditions', () => {
  it('never matches a stimulation technique on a read-only device', () => {
    for (const archetypeId of ['noninvasive-eeg-headset', 'cortical-read-implant']) {
      const matched = matchedTechniqueIds(reportFor(buildModel(archetypeId)));
      for (const techniqueId of WRITE_ONLY_TECHNIQUE_IDS) expect(matched.has(techniqueId), `${archetypeId} ${techniqueId}`).toBe(false);
    }
  });

  it('matches stimulation techniques on a device that can stimulate, and says why they are excluded when it cannot', () => {
    expect(matchedTechniqueIds(reportFor(buildModel('subcortical-stimulator'))).has('QIF-T0001')).toBe(true);
    const readOnly = reportFor(buildModel('subcortical-stimulator', { direction: 'read' }));
    expect(matchedTechniqueIds(readOnly).has('QIF-T0001')).toBe(false);
  });

  it('drops techniques that need a cortical target when the device has none', () => {
    const cortical = matchedTechniqueIds(reportFor(buildModel('cortical-read-implant')));
    const subcortical = matchedTechniqueIds(reportFor(buildModel('cortical-read-implant', { targetRegionIds: ['stn'] })));
    expect(cortical.has('QIF-T0035')).toBe(true);
    expect(subcortical.has('QIF-T0035')).toBe(false);
  });

  it('removes a component together with its links and the techniques placed on it', () => {
    const withoutCloud = buildModel('cortical-read-implant', { removedComponentIds: ['cloud'] });
    expect(withoutCloud.components.some((component) => component.id === 'cloud')).toBe(false);
    expect(withoutCloud.links.some((link) => link.toComponentId === 'cloud' || link.fromComponentId === 'cloud')).toBe(false);
    expect(matchedTechniqueIds(reportFor(withoutCloud)).has('QIF-T0044')).toBe(false);
  });

  it('cannot remove the neural interface', () => {
    const model = buildModel('cortical-read-implant', { removedComponentIds: ['implant'] });
    expect(model.components.filter((component) => component.isNeuralInterface)).toHaveLength(1);
  });
});

describe('chain generation limits', () => {
  it('shows no chains, with a reason, when the evidence filter excludes everything', () => {
    const result = reportFor(buildModel('subcortical-stimulator'), { ...DEFAULT_CHAIN_OPTIONS, allowedEvidenceStatuses: [] }).chainResult;
    expect(result.chains).toEqual([]);
    expect(result.emptyReason).toMatch(/No technique placed on this model/);
  });

  it('flags truncation when the node budget runs out', () => {
    const result = reportFor(buildModel('subcortical-stimulator'), { ...DEFAULT_CHAIN_OPTIONS, nodeBudget: 1 }).chainResult;
    expect(result.wasTruncated).toBe(true);
  });

  it('honours the chain and step limits', () => {
    const result = reportFor(buildModel('cortical-read-implant'), { ...DEFAULT_CHAIN_OPTIONS, maxChains: 2, maxSteps: 3 }).chainResult;
    expect(result.chains.length).toBeLessThanOrEqual(2);
    for (const chain of result.chains) expect(chain.steps.length).toBeLessThanOrEqual(3);
  });
});

describe('curated chain file', () => {
  const knownTechniqueIds = new Set(engineData.techniques.map((technique) => technique.id));

  it('rejects a chain that uses the generated id prefix', () => {
    const generated = reportFor(buildModel('subcortical-stimulator')).chainResult.chains[0];
    expect(() => parseTaraChains({ version: '1.0', chains: [generated] }, knownTechniqueIds)).toThrow(TaraChainsFormatError);
    expect(() => parseTaraChains({ version: '1.0', chains: [generated] }, knownTechniqueIds)).toThrow(/reserved for machine-generated/);
  });

  it('still accepts the hand-written chain', () => {
    expect(parseTaraChains(readDataFile('tara-chains.json'), knownTechniqueIds).length).toBeGreaterThan(0);
  });
});

describe('risk decisions', () => {
  it('carries a saved status and note onto the matching row', () => {
    const model = buildModel('subcortical-stimulator');
    const target = reportFor(model).riskRows[0];
    model.riskDecisions = [{ riskId: target.riskId, status: 'mitigated', note: 'Link is authenticated.' }];
    const row = reportFor(model).riskRows.find((candidate) => candidate.riskId === target.riskId);
    expect(row).toMatchObject({ status: 'mitigated', note: 'Link is authenticated.' });
  });

  it('keeps and flags a decision whose technique has left the catalog', () => {
    const model = buildModel('subcortical-stimulator');
    model.riskDecisions = [{ riskId: 'implant::QIF-T9999', status: 'accepted', note: 'Reviewed in March.' }];
    const row = reportFor(model).riskRows.find((candidate) => candidate.riskId === 'implant::QIF-T9999');
    expect(row).toMatchObject({ catalogState: 'missing', status: 'accepted', note: 'Reviewed in March.' });
  });
});

describe('US requirements checklist', () => {
  const statutoryIds = ['US-524B-B1', 'US-524B-B2', 'US-524B-B3'];

  it('marks statutory items required for a connected device in a marketing submission', () => {
    const report = reportFor(buildModel('cortical-read-implant', { submissionType: '510k' }));
    expect(report.cyberDeviceAssessment.isCyberDevice).toBe(true);
    for (const item of report.complianceItems.filter((candidate) => statutoryIds.includes(candidate.requirementId))) {
      expect(item.applicability).toBe('required');
    }
  });

  it('marks statutory items not required for a trial-stage device and lists the trial-stage recommendations', () => {
    const report = reportFor(buildModel('cortical-read-implant', { submissionType: 'ide' }));
    for (const item of report.complianceItems.filter((candidate) => statutoryIds.includes(candidate.requirementId))) {
      expect(item.applicability).toBe('not_required');
      expect(item.applicabilityReason).toMatch(/investigational device exemption/);
    }
    const trialItems = report.complianceItems.filter((candidate) => candidate.requirementId.startsWith('US-FDA-IDE-'));
    expect(trialItems).toHaveLength(5);
    expect(trialItems.every((item) => item.applicability === 'recommended')).toBe(true);
  });

  it('omits trial-stage items for a marketing submission', () => {
    const report = reportFor(buildModel('cortical-read-implant', { submissionType: 'pma' }));
    expect(report.complianceItems.some((item) => item.requirementId.startsWith('US-FDA-IDE-'))).toBe(false);
  });

  it('gives every item a source, a date read, and a quote, and never claims compliance', () => {
    const report = reportFor(buildModel('subcortical-stimulator'));
    for (const item of report.complianceItems) {
      expect(item.sourceUrl.startsWith('https://')).toBe(true);
      expect(item.dateRead).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.supportingQuote.length).toBeGreaterThanOrEqual(20);
    }
    expect(JSON.stringify(report)).not.toMatch(/\b(is|are) compliant\b|ensures? compliance/i);
  });
});

describe('coverage statement', () => {
  it('accounts for every catalog technique as placed, not placed, or not reviewed', () => {
    const { catalogCoverage } = reportFor(buildModel('cortical-read-implant'));
    const notPlaced = Object.values(catalogCoverage.notPlacedByCategory).reduce((sum, count) => sum + count, 0);
    expect(catalogCoverage.placedTechniques + notPlaced + catalogCoverage.notReviewedTechniques).toBe(catalogCoverage.totalTechniques);
    expect(catalogCoverage.notReviewedTechniques).toBeGreaterThan(0);
  });
});
