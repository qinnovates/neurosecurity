import { describe, expect, it } from 'vitest';
import type { TechniqueLink } from '../anatomy-types';
import { AnatomyDataError } from '../errors';
import { REGISTRAR_FILE, parseTechniqueRegions } from '../parse-technique-regions';
import { TECHNIQUE_REGIONS_STATUS } from '../status-sentences';

const TECHNIQUE_ID = 'QIF-T9001';
const NEURAL_TECHNIQUE_IDS = new Set([TECHNIQUE_ID, 'QIF-T9003']);
const POINTER = `/techniques/${TECHNIQUE_ID}/tara/dsm5/pathway`;

function buildLink(overrides: Partial<TechniqueLink> = {}): TechniqueLink {
  return {
    term: 'amygdala',
    valid_for_addressing: [1],
    evidence: {
      claim_basis: 'catalog_text',
      source_ref: { file: REGISTRAR_FILE, pointer: POINTER, quote: 'N3 (amygdala)' },
      check_status: 'unchecked',
      rationale: 'The text says amygdala; the atlas has no whole-amygdala record, only parts.',
    },
    drafted_by: 'ai',
    ...overrides,
  };
}

function buildFile(entry: unknown, techniqueId = TECHNIQUE_ID): Record<string, unknown> {
  return { schema_version: 2, status: TECHNIQUE_REGIONS_STATUS, techniques: { [techniqueId]: entry } };
}

const REGIONS_ENTRY = { scope: 'regions', rationale: 'The pathway text names one structure, recorded as written.', links: [buildLink()] };
const BAND_LEVEL_ENTRY = { scope: 'band_level', rationale: 'no_structure_named: the text describes a signal property only.', links: [] };
const parseEntry = (entry: unknown, techniqueId?: string): unknown => parseTechniqueRegions(buildFile(entry, techniqueId), NEURAL_TECHNIQUE_IDS);

describe('parseTechniqueRegions', () => {
  it('accepts an entry with links, a band-level entry and an empty file', () => {
    expect(parseTechniqueRegions(buildFile(REGIONS_ENTRY), NEURAL_TECHNIQUE_IDS).techniques[TECHNIQUE_ID].links).toHaveLength(1);
    expect(parseTechniqueRegions(buildFile(BAND_LEVEL_ENTRY), NEURAL_TECHNIQUE_IDS).techniques[TECHNIQUE_ID].scope).toBe('band_level');
    expect(parseTechniqueRegions({ schema_version: 2, status: TECHNIQUE_REGIONS_STATUS, techniques: {} }, NEURAL_TECHNIQUE_IDS).techniques).toEqual({});
  });

  it.each(['resolved_region_id', 'resolution', 'region_id'])('rejects the stored resolution field "%s" on a link', (key) => {
    const link = { ...buildLink(), [key]: 'bla' };
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [link] }))
      .toThrow(new RegExp(`links\\[0\\]\\.${key}: a link stores the catalog's word, never what it resolves to`));
  });

  it('rejects a link with no rationale and a technique entry with no rationale', () => {
    const { rationale: _omitted, ...evidence } = buildLink().evidence;
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [{ ...buildLink(), evidence }] })).toThrow(/links\[0\]\.evidence: missing key "rationale"/);
    const { rationale: _alsoOmitted, ...entry } = REGIONS_ENTRY;
    expect(() => parseEntry(entry)).toThrow(/techniques\.QIF-T9001: missing key "rationale"/);
  });

  it('rejects a band_level entry that has links', () => {
    expect(() => parseEntry({ ...BAND_LEVEL_ENTRY, links: [buildLink()] }))
      .toThrow(/techniques\.QIF-T9001\.links: a band_level entry says no region could be drafted, so it cannot hold links/);
  });

  it('rejects a band_level rationale that does not start with a listed reason', () => {
    expect(() => parseEntry({ ...BAND_LEVEL_ENTRY, rationale: 'Nothing obvious was named.' }))
      .toThrow(/rationale: a band_level rationale must start with one of: no_structure_named, only_whole_structures_named, text_contradicts_band_tags/);
  });

  it('rejects a regions entry with no links', () => {
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [] })).toThrow(/links: a regions entry must hold at least one link/);
  });

  it('rejects an entry for a technique that is not in the registrar or has no neural band', () => {
    expect(() => parseEntry(REGIONS_ENTRY, 'QIF-T0000')).toThrow(/techniques\.QIF-T0000: "QIF-T0000" is not a registrar technique with a neural band/);
  });

  it('rejects a term that its own quote does not contain', () => {
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [buildLink({ term: 'hippocampus' })] }))
      .toThrow(/links\[0\]\.term: the quoted words "N3 \(amygdala\)" do not contain the term "hippocampus"/);
  });

  it('rejects catalog text cited from another file or from another technique', () => {
    const elsewhere = { ...buildLink().evidence, source_ref: { file: 'datalake/qif-neural-pathways.json', pointer: POINTER, quote: 'N3 (amygdala)' } };
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [buildLink({ evidence: elsewhere })] })).toThrow(/source_ref: catalog text must be cited from this technique's own registrar entry/);
    const otherTechnique = { ...buildLink().evidence, source_ref: { file: REGISTRAR_FILE, pointer: '/techniques/QIF-T9003/attack', quote: 'N3 (amygdala)' } };
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [buildLink({ evidence: otherTechnique })] })).toThrow(/source_ref: catalog text must be cited from this technique's own registrar entry/);
  });

  it.each(['analyst_inference', 'catalog_parameter', 'atlas_label', 'literature'])('rejects a link whose claim basis is "%s": a link may rest only on the catalog\'s words', (claimBasis) => {
    const evidence = { ...buildLink().evidence, claim_basis: claimBasis, ...(claimBasis === 'literature' ? { evidence_method: 'review' } : {}) };
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [{ ...buildLink(), evidence }] }))
      .toThrow(/links\[0\]\.evidence\.claim_basis: a technique link may rest only on the catalog's own words/);
  });

  it('rejects one term linked twice for a technique, and a link valid for no addressing version', () => {
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [buildLink(), buildLink()] })).toThrow(/term "amygdala" appears twice/);
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [buildLink({ valid_for_addressing: [] })] })).toThrow(/valid_for_addressing/);
  });

  it('rejects a review field, a band key, human_status and a drafter other than AI', () => {
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [{ ...buildLink(), human_review: 'owner-1' }] })).toThrow(/unexpected key "human_review"/);
    expect(() => parseEntry({ ...REGIONS_ENTRY, band_ids: ['N6'] })).toThrow(/must not store a QIF band/);
    const evidence = { ...buildLink().evidence, human_status: 'demonstrated' };
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [{ ...buildLink(), evidence }] })).toThrow(/human_status/);
    expect(() => parseEntry({ ...REGIONS_ENTRY, links: [{ ...buildLink(), drafted_by: 'human' }] })).toThrow(/drafted_by/);
  });

  it('rejects an unknown schema version and a softened status sentence', () => {
    expect(() => parseTechniqueRegions({ ...buildFile(REGIONS_ENTRY), schema_version: 1 }, NEURAL_TECHNIQUE_IDS)).toThrow(/schema_version/);
    expect(() => parseTechniqueRegions({ ...buildFile(REGIONS_ENTRY), status: 'Verified links.' }, NEURAL_TECHNIQUE_IDS)).toThrow(/status/);
  });

  it('throws the typed error', () => {
    expect(() => parseTechniqueRegions(undefined, NEURAL_TECHNIQUE_IDS)).toThrow(AnatomyDataError);
  });
});
