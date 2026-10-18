import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TECHNIQUE_OUTCOME, describeLinks, listBandDisagreements, summariseDistribution } from '@shared/scripts/audit-technique-regions.mjs';
import { ENTRY_RATIONALES, LINK_ROLES } from '@shared/scripts/draft-technique-regions.mjs';
import { isTemplatedPathway } from '@shared/scripts/technique-region-candidates.mjs';
import { resolvePointer } from '@/lib/anatomy/source-ref';
import { parseAnatomyFiles, type AnatomyData, type RawAnatomyFiles } from '@/lib/anatomy/anatomy-inputs';
import type { AnatomyIndex } from '@/lib/anatomy/anatomy-index-types';
import { buildAnatomyBundle } from '@/lib/anatomy/build-anatomy-index';
import { REGISTRAR_FILE } from '@/lib/anatomy/parse-technique-regions';
import { TECHNIQUE_ID, buildRawFiles } from '@/lib/anatomy/__tests__/raw-files-fixture';
import { loadAnatomyBundle, loadAnatomyData } from '../load-anatomy-data';

/**
 * The drafted outcome, pinned. A change to any number is a change to what the
 * atlas shows and belongs in a reviewed diff with the curation record.
 */
const EXPECTED_LINKED_TECHNIQUES = 48;
/**
 * Every band-level technique, by reason. Pinned by identity so that moving one
 * technique to band level while another gains a link cannot leave the counts,
 * and the tests, unchanged.
 */
const EXPECTED_BAND_LEVEL_BY_REASON: Record<string, string[]> = {
  no_structure_named: [
    'QIF-T0001', 'QIF-T0002', 'QIF-T0003', 'QIF-T0005', 'QIF-T0006', 'QIF-T0008', 'QIF-T0011', 'QIF-T0014', 'QIF-T0022', 'QIF-T0023',
    'QIF-T0026', 'QIF-T0029', 'QIF-T0032', 'QIF-T0033', 'QIF-T0035', 'QIF-T0036', 'QIF-T0038', 'QIF-T0040', 'QIF-T0041', 'QIF-T0051',
    'QIF-T0052', 'QIF-T0053', 'QIF-T0055', 'QIF-T0056', 'QIF-T0059', 'QIF-T0060', 'QIF-T0062', 'QIF-T0064', 'QIF-T0066', 'QIF-T0067',
    'QIF-T0068', 'QIF-T0069', 'QIF-T0074', 'QIF-T0085', 'QIF-T0089', 'QIF-T0092', 'QIF-T0095', 'QIF-T0097', 'QIF-T0099', 'QIF-T0120',
    'QIF-T0125', 'QIF-T0136', 'QIF-T0146', 'QIF-T0148', 'QIF-T0152', 'QIF-T0153', 'QIF-T0157', 'QIF-T0159', 'QIF-T0160', 'QIF-T0168',
  ],
  structure_named_only_as_context: ['QIF-T0009', 'QIF-T0025', 'QIF-T0027', 'QIF-T0070', 'QIF-T0139', 'QIF-T0140', 'QIF-T0158'],
  only_whole_structures_named: ['QIF-T0013', 'QIF-T0135'],
  text_contradicts_band_tags: ['QIF-T0104', 'QIF-T0105', 'QIF-T0106', 'QIF-T0107'],
};
const EXPECTED_BAND_LEVEL_TECHNIQUES = Object.values(EXPECTED_BAND_LEVEL_BY_REASON).flat().length;
const EXPECTED_OUTCOMES = {
  [TECHNIQUE_OUTCOME.LIT]: 12,
  [TECHNIQUE_OUTCOME.BAND_DISAGREES]: 9,
  [TECHNIQUE_OUTCOME.ALIAS_SCOPE]: 4,
  [TECHNIQUE_OUTCOME.UNRESOLVED]: 23,
};
/**
 * Every link, as `technique:term`. Pinned by identity so that swapping one
 * term for another word leaves no test unchanged, whatever it resolves to.
 */
const EXPECTED_LINK_TERMS = [
  'QIF-T0010:cortical', 'QIF-T0012:cochlea', 'QIF-T0030:motor cortex', 'QIF-T0034:hippocampal',
  'QIF-T0034:PFC', 'QIF-T0034:DLPFC', 'QIF-T0037:basal ganglia', 'QIF-T0037:PFC',
  'QIF-T0039:insula', 'QIF-T0039:TPJ', 'QIF-T0039:mPFC', 'QIF-T0039:PFC',
  'QIF-T0054:hippocampal', 'QIF-T0065:visual cortex', 'QIF-T0065:prefrontal cortex', 'QIF-T0073:temporal cortex',
  'QIF-T0100:auditory nerve', 'QIF-T0100:cortex', 'QIF-T0100:auditory cortex', 'QIF-T0100:cochlear',
  'QIF-T0103:visual cortex', 'QIF-T0103:retina', 'QIF-T0103:optic nerve', 'QIF-T0103:V1',
  'QIF-T0111:vestibular nerve', 'QIF-T0111:vestibular nuclei', 'QIF-T0111:cortical', 'QIF-T0112:vestibular organ',
  'QIF-T0112:vestibular nerve', 'QIF-T0112:vestibular nuclei', 'QIF-T0112:oculomotor nuclei', 'QIF-T0112:VOR arc',
  'QIF-T0113:CN VIII', 'QIF-T0113:cochlea', 'QIF-T0113:vestibule', 'QIF-T0113:vestibular/cochlear nuclei',
  'QIF-T0114:vestibular organ', 'QIF-T0114:vestibular nerve', 'QIF-T0114:vestibular nuclei', 'QIF-T0114:cortical',
  'QIF-T0115:cortical', 'QIF-T0116:nucleus_accumbens', 'QIF-T0116:VTA', 'QIF-T0116:prefrontal',
  'QIF-T0116:reward network', 'QIF-T0117:hippocampus', 'QIF-T0117:cortical', 'QIF-T0117:declarative memory systems',
  "QIF-T0118:Broca's area", 'QIF-T0118:corticobulbar_tract', 'QIF-T0118:cranial motor nuclei', 'QIF-T0119:amygdala',
  'QIF-T0119:PFC', 'QIF-T0119:default mode network', 'QIF-T0121:thalamic sleep nuclei', 'QIF-T0121:cortical',
  'QIF-T0122:amygdala', 'QIF-T0122:hippocampus', 'QIF-T0123:motor cortex', 'QIF-T0123:primary_motor_cortex',
  'QIF-T0123:corticospinal tract', 'QIF-T0123:motor neurons', 'QIF-T0124:hippocampal', 'QIF-T0124:PFC',
  'QIF-T0124:default mode network', 'QIF-T0126:visual cortex', 'QIF-T0127:amygdala', 'QIF-T0127:bed_nucleus_stria_terminalis',
  'QIF-T0127:hypothalamus', 'QIF-T0127:PAG', 'QIF-T0127:autonomic nervous system', 'QIF-T0128:ventral striatum',
  'QIF-T0128:orbitofrontal cortex', 'QIF-T0128:subcallosal_cingulate', 'QIF-T0128:reward network', 'QIF-T0129:amygdala',
  'QIF-T0129:insula', 'QIF-T0129:ACC', 'QIF-T0129:prefrontal', 'QIF-T0130:anterior_insula',
  'QIF-T0130:TPJ', 'QIF-T0130:mirror_neuron_system', 'QIF-T0130:social cognition network', 'QIF-T0131:motor cortex',
  'QIF-T0131:M1_larynx', 'QIF-T0131:ventral premotor cortex', 'QIF-T0131:corticobulbar tract', 'QIF-T0131:laryngeal motor neurons',
  "QIF-T0132:Wernicke's area", 'QIF-T0132:auditory association cortex', 'QIF-T0132:posterior_STG', 'QIF-T0132:language comprehension network',
  'QIF-T0133:primary visual cortex', 'QIF-T0133:visual_cortex', 'QIF-T0133:thalamic relay', 'QIF-T0134:auditory nerve',
  'QIF-T0134:cochlear nucleus', 'QIF-T0137:VTA', 'QIF-T0138:VTA', 'QIF-T0141:VTA',
  'QIF-T0141:SNc', 'QIF-T0142:cortical', 'QIF-T0143:cortical', 'QIF-T0144:M1',
  'QIF-T0145:M1', 'QIF-T0147:thalamus', 'QIF-T0149:vagal afferents', 'QIF-T0149:NTS',
  'QIF-T0149:nucleus basalis of Meynert', 'QIF-T0149:cortical', 'QIF-T0150:auricular branch of vagus nerve', 'QIF-T0150:NTS',
  'QIF-T0151:SMA', 'QIF-T0154:vagal afferents', 'QIF-T0154:NTS', 'QIF-T0154:locus coeruleus',
  'QIF-T0154:dorsal raphe nucleus', 'QIF-T0154:brainstem', 'QIF-T0155:dorsal raphe nucleus', 'QIF-T0156:dorsal raphe',
  'QIF-T0156:spinal', 'QIF-T0156:brainstem', 'QIF-T0161:cortex',
];
const EXPECTED_LINKS = EXPECTED_LINK_TERMS.length;
const EXPECTED_LINK_RESOLUTIONS = { id: 20, synonym: 3, whole_to_part: 9, part_to_whole: 2, unresolved: 89 };
/**
 * Every link that lights a region, as `technique:term->region`. Pinned by
 * identity: short region ids (m1, a1, acc, sma, ant) resolve whatever their
 * letter case, so a re-drafted or shortened term could light a region while
 * every count stayed the same.
 */
const EXPECTED_LIGHTING_LINKS = [
  'QIF-T0034:PFC->pfc', 'QIF-T0037:PFC->pfc', 'QIF-T0039:insula->insula', 'QIF-T0039:PFC->pfc', 'QIF-T0065:prefrontal cortex->pfc',
  'QIF-T0103:V1->v1', 'QIF-T0116:VTA->vta', 'QIF-T0117:hippocampus->hippocampus', 'QIF-T0122:hippocampus->hippocampus',
  'QIF-T0123:primary_motor_cortex->m1', 'QIF-T0124:PFC->pfc', 'QIF-T0129:insula->insula', 'QIF-T0129:ACC->acc', 'QIF-T0133:primary visual cortex->v1',
];
/** Links to a region whose band is not among the technique's band tags: `technique:term`. Kept and listed, never enforced. */
const EXPECTED_BAND_DISAGREEMENTS = [
  'QIF-T0119:PFC', 'QIF-T0127:hypothalamus', 'QIF-T0127:PAG', 'QIF-T0137:VTA', 'QIF-T0138:VTA', 'QIF-T0141:VTA',
  'QIF-T0144:M1', 'QIF-T0145:M1', 'QIF-T0147:thalamus', 'QIF-T0151:SMA', 'QIF-T0161:cortex',
];
const NEURAL_BAND_PREFIX = 'N';

/** What the audit script says of one link. The script is plain JavaScript, so its result is typed here. */
interface DescribedLink {
  technique_id: string;
  term: string;
  region_id: string | null;
  band_agrees: boolean;
  lights: boolean;
}
const UNREVIEWED_STATE = 'ai_drafted_unreviewed';

function listNeuralIds(data: AnatomyData): string[] {
  return data.engineData.techniques.filter((technique) => technique.bandIds.some((bandId) => bandId.startsWith(NEURAL_BAND_PREFIX))).map((technique) => technique.id);
}

/** Everything wrong with the drafted technique entries, one line each. Empty means the content holds. */
function listContentProblems(data: AnatomyData, index: AnatomyIndex): string[] {
  const neuralIds = listNeuralIds(data);
  const entries = data.techniqueRegions.techniques;
  const links = Object.entries(entries).flatMap(([techniqueId, entry]) => entry.links.map((link) => ({ techniqueId, link })));
  return [
    ...neuralIds.filter((techniqueId) => entries[techniqueId] === undefined).map((techniqueId) => `${techniqueId}: has a neural band and no entry`),
    ...Object.keys(entries).filter((techniqueId) => !neuralIds.includes(techniqueId)).map((techniqueId) => `${techniqueId}: has an entry and no neural band`),
    ...Object.entries(entries).filter(([, entry]) => entry.rationale.trim() === '').map(([techniqueId]) => `${techniqueId}: has no rationale`),
    ...links.filter(({ link }) => link.evidence.rationale.trim() === '').map(({ techniqueId, link }) => `${techniqueId}:${link.term}: has no rationale`),
    ...links.filter(({ link }) => !link.evidence.source_ref.quote.includes(link.term)).map(({ techniqueId, link }) => `${techniqueId}:${link.term}: the quote does not contain the term`),
    ...links.filter(({ techniqueId, link }) => link.evidence.source_ref.file !== REGISTRAR_FILE || !link.evidence.source_ref.pointer.startsWith(`/techniques/${techniqueId}/`))
      .map(({ techniqueId, link }) => `${techniqueId}:${link.term}: is not quoted from this technique's own registrar entry`),
    ...links.filter(({ link }) => link.evidence.claim_basis !== 'catalog_text' || link.evidence.check_status !== 'unchecked' || link.drafted_by !== 'ai')
      .map(({ techniqueId, link }) => `${techniqueId}:${link.term}: is not an unchecked AI draft of catalog text`),
    ...index.techniques.flatMap((technique) => technique.links.filter((link) => link.quote_state !== 'quote_found')
      .map((link) => `${technique.id}:${link.term}: the quote is not at its pointer (${link.quote_state})`)),
  ];
}

function buildFixture(overrides: Partial<RawAnatomyFiles> = {}): { data: AnatomyData; index: AnatomyIndex } {
  const data = parseAnatomyFiles(buildRawFiles(overrides));
  return { data, index: buildAnatomyBundle(data).index };
}

describe('listContentProblems on deliberately bad fixtures', () => {
  it('reports a neural-band technique that has no entry', () => {
    const { data, index } = buildFixture();
    expect(listContentProblems(data, index)).toContain('QIF-T9002: has a neural band and no entry');
    expect(listContentProblems(data, index).filter((problem) => problem.includes('no entry'))).toHaveLength(1);
  });

  it('reports a quote that is no longer at its pointer, for every link that cites it', () => {
    const registrar = { techniques: [{ id: TECHNIQUE_ID, tara: { dsm5: { pathway: 'The text was rewritten.' } } }] };
    const { data, index } = buildFixture({ registrar });
    expect(listContentProblems(data, index).filter((problem) => problem.includes('the quote is not at its pointer'))).toEqual([
      `${TECHNIQUE_ID}:stn: the quote is not at its pointer (quote_missing)`,
      `${TECHNIQUE_ID}:thalamus: the quote is not at its pointer (quote_missing)`,
      `${TECHNIQUE_ID}:motor_strip: the quote is not at its pointer (quote_missing)`,
    ]);
  });

  it('reports a link that is marked checked, since no person has checked any', () => {
    const { data, index } = buildFixture();
    const [first, second] = data.techniqueRegions.techniques[TECHNIQUE_ID].links;
    first.evidence.check_status = 'unchecked';
    second.evidence.check_status = 'supports';
    expect(listContentProblems(data, index)).toContain(`${TECHNIQUE_ID}:thalamus: is not an unchecked AI draft of catalog text`);
    expect(listContentProblems(data, index)).not.toContain(`${TECHNIQUE_ID}:stn: is not an unchecked AI draft of catalog text`);
  });

  it('reports an entry for a technique with no neural band, which the parser also refuses', () => {
    const { data, index } = buildFixture();
    data.techniqueRegions.techniques['QIF-T9005'] = { scope: 'band_level', rationale: 'no_structure_named: fixture.', links: [] };
    expect(listContentProblems(data, index)).toContain('QIF-T9005: has an entry and no neural band');
    const raw = buildRawFiles();
    const techniques = { ...(raw.techniqueRegions as { techniques: object }).techniques, 'QIF-T9005': { scope: 'band_level', rationale: 'no_structure_named: fixture.', links: [] } };
    expect(() => parseAnatomyFiles({ ...raw, techniqueRegions: { ...(raw.techniqueRegions as object), techniques } })).toThrow(/"QIF-T9005" is not a registrar technique with a neural band/);
  });
});

describe('drafted technique region links (guards on the committed file)', () => {
  const data = loadAnatomyData();
  const { index } = loadAnatomyBundle();
  const entries = data.techniqueRegions.techniques;
  const indexLinks = index.techniques.flatMap((technique) => technique.links.map((link) => ({ technique, link })));
  const registrar: unknown = JSON.parse(readFileSync(REGISTRAR_FILE, 'utf-8'));
  const described: DescribedLink[] = describeLinks(data.techniqueRegions, registrar, data.atlas);

  it('has exactly one entry for every neural-band technique and none for any other, with nothing wrong in any entry', () => {
    expect(listNeuralIds(data).length).toBeGreaterThan(0);
    expect(Object.keys(entries)).toEqual(listNeuralIds(data));
    expect(listContentProblems(data, index)).toEqual([]);
  });

  it('holds the pinned number of linked and band-level techniques, and each band-level reason', () => {
    const distribution = summariseDistribution(data.techniqueRegions, described);
    expect(distribution.linked).toBe(EXPECTED_LINKED_TECHNIQUES);
    expect(distribution.band_level).toBe(EXPECTED_BAND_LEVEL_TECHNIQUES);
    const bandLevelByReason: Record<string, string[]> = {};
    for (const [techniqueId, entry] of Object.entries(entries).filter(([, candidate]) => candidate.scope === 'band_level')) {
      (bandLevelByReason[entry.rationale.split(':')[0]] ??= []).push(techniqueId);
    }
    expect(bandLevelByReason).toEqual(EXPECTED_BAND_LEVEL_BY_REASON);
    expect(distribution.linked + distribution.band_level).toBe(listNeuralIds(data).length);
    expect(index.techniques.filter((technique) => technique.scope === 'band_level')).toHaveLength(EXPECTED_BAND_LEVEL_TECHNIQUES);
  });

  it('holds the pinned outcome per technique and resolution per link', () => {
    const distribution = summariseDistribution(data.techniqueRegions, described);
    expect(distribution.outcomes).toEqual(EXPECTED_OUTCOMES);
    expect(Object.entries(entries).flatMap(([techniqueId, entry]) => entry.links.map((link) => `${techniqueId}:${link.term}`))).toEqual(EXPECTED_LINK_TERMS);
    expect(distribution.links).toBe(EXPECTED_LINKS);
    expect(distribution.link_resolutions).toEqual(EXPECTED_LINK_RESOLUTIONS);
  });

  it('lights exactly the pinned links in the built index, at least one of them by id', () => {
    const lit = indexLinks.filter(({ link }) => link.lit);
    expect(lit.some(({ link }) => link.resolution === 'id')).toBe(true);
    expect(lit.map(({ technique, link }) => `${technique.id}:${link.term}->${link.resolved_region_id}`)).toEqual(EXPECTED_LIGHTING_LINKS);
    expect(lit.filter(({ link }) => !['id', 'synonym'].includes(link.resolution) || !link.band_agrees)).toEqual([]);
    expect(new Set(lit.map(({ technique }) => technique.id)).size).toBe(EXPECTED_OUTCOMES[TECHNIQUE_OUTCOME.LIT]);
  });

  it('holds no free prose: every rationale is one of the fixed sentences, with only the term and field name filled in', () => {
    const fieldNameOf = (pointer: string): string => pointer.split('/').slice(3).join('.');
    const roleSentences = (term: string, pointer: string): string[] => Object.values(LINK_ROLES as Record<string, (term: string, fieldName: string) => string>)
      .map((render) => render(term, fieldNameOf(pointer)));
    const entrySentences = Object.entries(ENTRY_RATIONALES as Record<string, string>)
      .flatMap(([reason, sentence]) => (reason === 'regions' ? [sentence] : [`${reason}: ${sentence}`, `${reason}: ${sentence} Its generated band summary is not counted.`]));
    const freeProse = Object.entries(entries).flatMap(([techniqueId, entry]) => [
      ...(entrySentences.includes(entry.rationale) ? [] : [techniqueId]),
      ...entry.links.filter((link) => !roleSentences(link.term, link.evidence.source_ref.pointer).includes(link.evidence.rationale)).map((link) => `${techniqueId}:${link.term}`),
    ]);
    expect(freeProse).toEqual([]);
    expect(roleSentences('PFC', '/techniques/QIF-T0037/notes')).not.toContain('Named as the target. Independent verification by a neurologist found this correct.');
  });

  it('quotes no link from a generated band summary, which names a band\'s examples and not the technique\'s target', () => {
    const pathwayLinks = Object.entries(entries).flatMap(([techniqueId, entry]) => entry.links.map((link) => ({ techniqueId, link })))
      .filter(({ link }) => link.evidence.source_ref.pointer.endsWith('/tara/dsm5/pathway'));
    expect(pathwayLinks.length).toBeGreaterThan(0);
    expect(pathwayLinks.filter(({ link }) => isTemplatedPathway(String(resolvePointer(registrar, link.evidence.source_ref.pointer))))
      .map(({ techniqueId, link }) => `${techniqueId}:${link.term}`)).toEqual([]);
    expect(isTemplatedPathway(String(resolvePointer(registrar, '/techniques/QIF-T0037/tara/dsm5/pathway')))).toBe(true);
  });

  it('agrees with the audit script on what every term resolves to, whether its band agrees and whether it lights', () => {
    const fromIndex = indexLinks.map(({ technique, link }) => [technique.id, link.term, link.resolved_region_id, link.band_agrees, link.lit]);
    expect(described.map((link) => [link.technique_id, link.term, link.region_id, link.band_agrees, link.lights])).toEqual(fromIndex);
    expect(fromIndex).toHaveLength(EXPECTED_LINKS);
  });

  it('reports, without enforcing, the links to a region outside the technique\'s band tags', () => {
    const disagreements = (listBandDisagreements(described) as DescribedLink[]).map((link) => `${link.technique_id}:${link.term}`);
    expect(disagreements).toEqual(EXPECTED_BAND_DISAGREEMENTS);
    expect(indexLinks.filter(({ link }) => link.resolved_region_id !== null && !link.band_agrees && link.lit)).toEqual([]);
  });

  it('never lights a term that reaches a region only through a whole or a part', () => {
    const scoped = indexLinks.filter(({ link }) => ['whole_to_part', 'part_to_whole'].includes(link.resolution));
    expect(scoped.length).toBeGreaterThan(0);
    expect(scoped.filter(({ link }) => link.lit)).toEqual([]);
    expect(scoped.map(({ link }) => link.term)).toContain('amygdala');
  });

  it('marks every link AI-drafted and unreviewed while the ledger holds no review of one', () => {
    expect(indexLinks.length).toBeGreaterThan(0);
    expect(indexLinks.filter(({ link }) => link.review_state.state !== UNREVIEWED_STATE || link.check_status !== 'unchecked')).toEqual([]);
  });
});
