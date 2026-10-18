import { describe, it, expect } from 'vitest';
import { NOT_DETERMINED_STATEMENT, NOT_EVALUATED_STATEMENT, assessCyberDevice, evaluateCompliance } from '../compliance-us';
import type { DeviceModel, ModelLink } from '../device-model';
import { buildModelFromIntake, defaultAnswersFor } from '../intake-to-model';
import { parseComplianceUs } from '../parse-compliance';
import { loadEngineBundle, loadReferenceData, readDataFile } from './load-test-data';

const bundle = loadEngineBundle();
const { archetypes, compliance } = loadReferenceData(bundle);
const rawCompliance = readDataFile('threat-model/compliance-us.json') as Record<string, unknown>;
const STATUTORY_IDS = compliance.requirements.filter((requirement) => requirement.force === 'statutory' && requirement.appliesTo === 'marketing').map((requirement) => requirement.id);

function presetModel(archetypeId: string, overrides: Partial<DeviceModel> = {}): DeviceModel {
  const archetype = archetypes.find((candidate) => candidate.id === archetypeId);
  if (archetype === undefined) throw new Error(`test setup: unknown archetype ${archetypeId}`);
  return { ...buildModelFromIntake(defaultAnswersFor(archetype), archetype, bundle.engineData.registrarVersion), ...overrides };
}

const withoutPayload = (link: ModelLink): ModelLink => ({ ...link, carriesNeuralData: false, carriesStimulationCommands: false, carriesSoftwareUpdates: false });

describe('the default submission type', () => {
  it.each(archetypes.map((archetype) => archetype.id))('is "none" for the preset %s, so nothing is assumed about the regulatory route', (archetypeId) => {
    expect(presetModel(archetypeId).submissionType).toBe('none');
  });

  it('leaves every item not evaluated, with the instruction to choose a type, and lists no trial-stage item', () => {
    const items = evaluateCompliance(presetModel('cortical-read-implant'), compliance);
    expect(items.length).toBe(compliance.requirements.filter((requirement) => requirement.appliesTo === 'marketing').length);
    for (const item of items) {
      expect(item.applicability).toBe('not_evaluated');
      expect(item.applicabilityReason).toBe(NOT_EVALUATED_STATEMENT);
    }
    expect(NOT_EVALUATED_STATEMENT).toBe('Not evaluated. Choose a submission type.');
  });
});

describe('assessCyberDevice', () => {
  it('counts only listed connections that carry data, commands or updates', () => {
    const model = presetModel('cortical-read-implant');
    const charger = model.links.find((link) => link.medium === 'inductive');
    if (charger === undefined) throw new Error('test setup: the preset no longer has an inductive link');
    const assessment = assessCyberDevice(model, compliance);
    expect(assessment.connectivity).toBe('meets');
    expect(assessment.internetCapableLinkIds).not.toContain(charger.id);
    expect(assessment.internetCapableLinkIds.length).toBe(model.links.length - 1);
  });

  it('does not make the negative call when the only listed connections carry nothing', () => {
    const model = presetModel('cortical-read-implant');
    const powerOnly = { ...model, links: model.links.map(withoutPayload) };
    const assessment = assessCyberDevice(powerOnly, compliance);
    expect(assessment.connectivity).toBe('not_determined');
    expect(assessment.internetCapableLinkIds).toEqual([]);
    expect(assessment.explanation).toContain(`${powerOnly.links.length} link(s) use a connection type on FDA's list but carry no`);
    expect(assessment.explanation).toContain(NOT_DETERMINED_STATEMENT);
  });

  it('does not make the negative call when the model has no listed connection', () => {
    const assessment = assessCyberDevice(presetModel('cortical-read-implant', { links: [] }), compliance);
    expect(assessment.connectivity).toBe('not_determined');
    expect(assessment.explanation).toContain(NOT_DETERMINED_STATEMENT);
    expect(assessment.explanation).not.toMatch(/does not meet|is not a cyber device/i);
  });

  it('takes its "illustrative, not exhaustive" wording from the quote stored in the data file', () => {
    expect(compliance.internetCapableMediaQuote).toContain('illustrative, not exhaustive');
    expect(NOT_DETERMINED_STATEMENT).toContain('illustrative, not exhaustive');
    expect(assessCyberDevice(presetModel('cortical-read-implant'), compliance).connectivityQuote).toBe((rawCompliance.internetCapableMedia as { quote: string }).quote);
  });

  it('carries the file\'s own status sentence and every listed source', () => {
    const assessment = assessCyberDevice(presetModel('noninvasive-eeg-headset'), compliance);
    expect(assessment.checklistStatus).toBe(rawCompliance.status);
    expect(assessment.checklistSources).toEqual(rawCompliance.sources);
  });
});

describe('statutory items in a marketing submission', () => {
  it.each(compliance.marketingSubmissionTypes)('are required under %s when a listed connection carries data', (submissionType) => {
    const items = evaluateCompliance(presetModel('cortical-read-implant', { submissionType }), compliance);
    for (const item of items.filter((candidate) => STATUTORY_IDS.includes(candidate.requirementId))) expect(item.applicability).toBe('required');
  });

  it.each(compliance.marketingSubmissionTypes)('are never "not required" under %s for want of a listed connection', (submissionType) => {
    const model = presetModel('cortical-read-implant', { submissionType });
    for (const links of [[], model.links.map(withoutPayload)]) {
      const statutory = evaluateCompliance({ ...model, links }, compliance).filter((item) => STATUTORY_IDS.includes(item.requirementId));
      expect(statutory).toHaveLength(STATUTORY_IDS.length);
      for (const item of statutory) {
        expect(item.applicability).toBe('not_determined');
        expect(item.applicabilityReason.startsWith(NOT_DETERMINED_STATEMENT)).toBe(true);
      }
    }
  });
});

describe('parseComplianceUs', () => {
  it('refuses a file without its status sentence or without the quote behind the media list', () => {
    expect(() => parseComplianceUs({ ...rawCompliance, status: '' })).toThrow(/"status"/);
    const media = rawCompliance.internetCapableMedia as Record<string, unknown>;
    expect(() => parseComplianceUs({ ...rawCompliance, internetCapableMedia: { ...media, quote: 'short' } })).toThrow(/internetCapableMedia\.quote/);
  });
});

describe('the reading note beside the connectivity count', () => {
  const rawNote = (rawCompliance.internetCapableMedia as { note: string }).note;

  it('is carried from the checklist file word for word', () => {
    expect(rawNote.length).toBeGreaterThan(20);
    expect(compliance.internetCapableMediaNote).toBe(rawNote);
  });

  it.each(archetypes.map((archetype) => archetype.id))('follows the count directly on the preset %s', (archetypeId) => {
    const assessment = assessCyberDevice(presetModel(archetypeId), compliance);
    const count = assessment.internetCapableLinkIds.length;
    expect(count).toBeGreaterThan(0);
    expect(assessment.explanation.startsWith(`${count} link(s) use a connection type FDA lists as able to connect to the internet. ${rawNote} `)).toBe(true);
  });

  it('is printed when no listed connection carries anything, where the reading decides the answer just the same', () => {
    const model = presetModel('cortical-read-implant');
    const assessment = assessCyberDevice({ ...model, links: model.links.map(withoutPayload) }, compliance);
    expect(assessment.connectivity).toBe('not_determined');
    expect(assessment.explanation).toContain(rawNote);
  });

  it('is left out, with nothing in its place, when the file has no note', () => {
    const assessment = assessCyberDevice(presetModel('cortical-read-implant'), { ...compliance, internetCapableMediaNote: null });
    expect(assessment.explanation).toMatch(/^\d+ link\(s\) use a connection type FDA lists as able to connect to the internet\. This tool assumes/);
  });
});
