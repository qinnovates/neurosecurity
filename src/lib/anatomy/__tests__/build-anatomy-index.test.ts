import { describe, expect, it } from 'vitest';
import { parseAnatomyFiles, type RawAnatomyFiles } from '../anatomy-inputs';
import type { AnatomyIndex, IndexStructure, IndexSubject } from '../anatomy-index-types';
import { buildAnatomyBundle, type AnatomyBundle } from '../build-anatomy-index';
import type { AnatomyEvidence } from '../build-anatomy-evidence';
import type { LedgerEntry } from '../parse-review-ledger';
import { sha256Hex } from '../row-digest';
import { ANATOMY_INDEX_STATUS } from '../status-sentences';
import { FIXTURE_ATLAS_ID, FIXTURE_SHA256 } from './anatomy-fixtures';
import { buildAsset, buildManifest } from './manifest-fixtures';
import { FIXTURE_ASSET_ID } from './manifest-fixtures';
import { PATHWAY_TEXT, TECHNIQUE_ID, TRACTS_SOURCE_ID, buildLedgerFile, buildRawFiles } from './raw-files-fixture';

const build = (overrides: Partial<RawAnatomyFiles> = {}): AnatomyBundle => buildAnatomyBundle(parseAnatomyFiles(buildRawFiles(overrides)));
const structureOf = (index: AnatomyIndex, labelId: string): IndexStructure => index.structures.find((structure) => structure.label_id === labelId) as IndexStructure;
const subjectOf = (index: AnatomyIndex, id: string): IndexSubject => index.subjects.find((subject) => subject.id === id) as IndexSubject;
const ownerIds = (structure: IndexStructure): string[] => structure.owners.map((owner) => `${owner.subject_id}:${owner.via}`);
const STN_ROW_KEY = `region:stn:${FIXTURE_ATLAS_ID}:`;
const UNREVIEWED_MARK = { state: 'ai_drafted_unreviewed', mark: 'AI-drafted, unreviewed' };

function reviewEntry(bundle: AnatomyBundle, key: string, reviewerId = 'owner-1'): LedgerEntry {
  const evidence = JSON.parse(bundle.evidenceJson) as AnatomyEvidence;
  const item = [...evidence.crosswalk_rows, ...evidence.technique_links, ...evidence.no_geometry].find((candidate) => candidate.key === key);
  return { kind: 'row_review', key, digest: (item as { digest: string }).digest, reviewer_id: reviewerId, reviewed_on: '2026-10-09' };
}

describe('buildAnatomyBundle: owners', () => {
  const { index } = build();

  it('gives each structure its full owner set, including subjects that reach it through a declared containment', () => {
    expect(ownerIds(structureOf(index, '7'))).toEqual(['stn:row']);
    expect(ownerIds(structureOf(index, '8'))).toEqual(['thalamus:row', 'vim:declared_child']);
    expect(ownerIds(structureOf(index, '9'))).toEqual(['vim:row', 'thalamus:declared_parent']);
    expect(ownerIds(structureOf(index, '10'))).toEqual(['m1:row', 'pmc:row']);
  });

  it('keeps a shipped shape that no record maps to, with no owner', () => {
    expect(structureOf(index, '12')).toMatchObject({ owners: [], nodes: [{ asset_id: FIXTURE_ASSET_ID, hemisphere: 'left', centroid_mm: [1, 2, 3] }] });
  });

  it('names structures from the atlas label table and links them to their mesh node', () => {
    expect(structureOf(index, '7')).toMatchObject({ name: 'Fixture Nucleus', nodes: [{ asset_id: FIXTURE_ASSET_ID, size_class: 'resolved' }] });
  });
});

describe('buildAnatomyBundle: subjects', () => {
  const { index } = build();

  it('derives each subject\'s band set and geometry state', () => {
    expect(subjectOf(index, 'stn')).toMatchObject({ band_ids: ['N5'], geometry: { state: 'drawn' }, structure_keys: [`${FIXTURE_ATLAS_ID}:7`] });
    expect(subjectOf(index, 'vim').geometry.state).toBe('contained');
    expect(subjectOf(index, 'thalamus').declared_children).toEqual(['vim']);
    expect(subjectOf(index, 'insula').geometry).toEqual({ state: 'not_mapped', reason: 'No correspondence to an atlas has been drafted for this record yet.', reason_source: null });
  });

  it('carries a no_geometry record\'s reason and its source', () => {
    expect(subjectOf(index, 'cervical_cord').geometry).toEqual({
      state: 'no_geometry',
      reason: 'The only spinal cord template found states no licence.',
      reason_source: 'datalake/qif-anatomy-sources.json considered_and_refused: pam50',
    });
  });

  it('fails closed on a row that is not valid for the current addressing: nothing is drawn and no structure is owned', () => {
    expect(subjectOf(index, 'cingulate').geometry).toEqual({ state: 'predates_addressing', reason: 'This correspondence predates the current addressing.', reason_source: null });
    expect(subjectOf(index, 'cingulate').structure_keys).toEqual([]);
    expect(index.structures.some((structure) => structure.label_id === '11')).toBe(false);
  });

  it('lists pathways and networks as subjects too', () => {
    expect(index.subjects.filter((subject) => subject.kind !== 'region').map((subject) => `${subject.kind}:${subject.id}`))
      .toEqual(['pathway:corticospinal', 'network:default_mode_network']);
  });
});

describe('buildAnatomyBundle: technique links', () => {
  const { index } = build();
  const technique = index.techniques.find((candidate) => candidate.id === TECHNIQUE_ID);
  const linkOf = (term: string): unknown => technique?.links.find((link) => link.term === term);

  it('resolves each stored term at build time and lights only id and synonym resolutions that agree with the band tags', () => {
    expect(linkOf('stn')).toMatchObject({ resolved_region_id: 'stn', resolution: 'id', band_agrees: true, lit: true });
    expect(linkOf('thalamus')).toMatchObject({ resolved_region_id: 'thalamus', resolution: 'id', band_agrees: false, lit: false });
    expect(linkOf('motor_strip')).toMatchObject({ resolved_region_id: 'm1', resolution: 'whole_to_part', band_agrees: true, lit: false });
  });

  it('carries the registrar\'s own NISS word and DSM cluster, and lists undrafted neural techniques without lighting anything', () => {
    expect(technique).toMatchObject({ niss_severity: 'high', dsm_cluster: 'mood_trauma', scope: 'regions' });
    expect(index.techniques.map((candidate) => [candidate.id, candidate.scope])).toEqual([[TECHNIQUE_ID, 'regions'], ['QIF-T9002', 'not_drafted']]);
  });

  it('demotes, unlights and lists a link whose quoted words no longer appear in the registrar', () => {
    const registrar = { techniques: [{ id: TECHNIQUE_ID, tara: { dsm5: { pathway: 'The text was rewritten.' } } }] };
    const stale = build({ registrar }).index;
    const staleLink = stale.techniques[0].links[0];
    expect(staleLink).toMatchObject({ quote_state: 'quote_missing', check_status: 'unchecked', lit: false });
    expect(stale.stale_evidence_keys).toContain(`${TECHNIQUE_ID}:stn`);
    expect(linkOf('stn')).toMatchObject({ quote_state: 'quote_found', check_status: 'partial' });
    expect(PATHWAY_TEXT).toContain('stn');
  });

  it('unlights a link that is not valid for the current addressing', () => {
    const atlas = { ...(buildRawFiles().atlas as object), _metadata: { addressing_version: 2 } };
    const moved = build({ atlas }).index;
    expect(moved.addressing_version).toBe(2);
    expect(moved.techniques[0].links.map((link) => [link.valid_for_current_addressing, link.lit])).toEqual([[false, false], [false, false], [false, false]]);
    expect(subjectOf(moved, 'stn').geometry.state).toBe('predates_addressing');
    expect(subjectOf(moved, 'cingulate').geometry.state).toBe('drawn');
  });
});

describe('buildAnatomyBundle: review state', () => {
  it('marks every drafted thing unreviewed while the ledger is empty', () => {
    const { index } = build();
    const states = [
      ...index.structures.map((structure) => structure.review_state), ...index.structures.flatMap((structure) => structure.owners.map((owner) => owner.review_state)),
      ...index.subjects.map((subject) => subject.review_state), ...index.techniques.flatMap((technique) => technique.links.map((link) => link.review_state)),
    ];
    expect(states.length).toBeGreaterThan(10);
    expect(states.filter((state) => state.state !== 'ai_drafted_unreviewed' || state.mark !== 'AI-drafted, unreviewed')).toEqual([]);
  });

  it('reads a row as reviewed by the owner once the ledger carries its digest, and shows it as the owner\'s review', () => {
    const reviewed = build({ reviewLedger: buildLedgerFile([reviewEntry(build(), STN_ROW_KEY)]) }).index;
    const expected = { state: 'reviewed', reviewer_role: 'owner', reviewed_on: '2026-10-09', mark: 'Reviewed by owner, 2026-10-09' };
    expect(structureOf(reviewed, '7').owners[0].review_state).toEqual(expected);
    expect(structureOf(reviewed, '7').review_state).toEqual(expected);
    expect(structureOf(reviewed, '8').review_state).toEqual(UNREVIEWED_MARK);
  });

  it('reads the row as unreviewed again, with no error, when one field of it is edited after review', () => {
    const ledger = buildLedgerFile([reviewEntry(build(), STN_ROW_KEY)]);
    const crosswalk = buildRawFiles().crosswalk as { rows: Array<Record<string, unknown>> };
    const editedRows = crosswalk.rows.map((row) => (row.subject_id === 'stn' ? { ...row, name_match: 'synonym' } : row));
    const edited = build({ reviewLedger: ledger, crosswalk: { ...crosswalk, rows: editedRows } }).index;
    expect(structureOf(edited, '7').owners[0].review_state).toEqual(UNREVIEWED_MARK);
  });

  it('reads the row as unreviewed again when the mesh that draws it is rebuilt', () => {
    const ledger = buildLedgerFile([reviewEntry(build(), STN_ROW_KEY)]);
    const rebuiltSha = 'c'.repeat(64);
    const manifest = buildManifest([buildAsset({ sha256: rebuiltSha, path: `open/deep-fixture.${rebuiltSha.slice(0, 12)}.glb` })]);
    expect(structureOf(build({ reviewLedger: ledger, manifest }).index, '7').owners[0].review_state).toEqual(UNREVIEWED_MARK);
  });

  it('gives a structure the worst state among its owners', () => {
    const first = build();
    const ledger = buildLedgerFile([reviewEntry(first, `region:m1:${FIXTURE_ATLAS_ID}:`, 'neuroanatomist-1')]);
    const mixed = structureOf(build({ reviewLedger: ledger }).index, '10');
    expect(mixed.owners.map((owner) => owner.review_state.state)).toEqual(['reviewed', 'ai_drafted_unreviewed']);
    expect(mixed.review_state).toEqual(UNREVIEWED_MARK);
  });

  it('un-reviews a link when the alias it resolves through is reclassified', () => {
    const linkKey = `${TECHNIQUE_ID}:motor_strip`;
    const ledger = buildLedgerFile([reviewEntry(build(), linkKey)]);
    const linkState = (index: AnatomyIndex): string => index.techniques[0].links[2].review_state.state;
    expect(linkState(build({ reviewLedger: ledger }).index)).toBe('reviewed');
    const atlas = { ...(buildRawFiles().atlas as object), region_alias_relations: { synonym: ['subthalamic_nucleus', 'motor_strip'], whole_to_part: [], part_to_whole: [] } };
    expect(linkState(build({ reviewLedger: ledger, atlas }).index)).toBe('ai_drafted_unreviewed');
  });

  it('records a visual check only for the exact asset bytes that were signed', () => {
    const signOff: LedgerEntry = { kind: 'visual_check', key: FIXTURE_ASSET_ID, digest: FIXTURE_SHA256, reviewer_id: 'owner-1', reviewed_on: '2026-10-09' };
    expect(build().index.assets[0].visual_check).toEqual({ state: 'not_done', role: null, reviewed_on: null });
    expect(build({ reviewLedger: buildLedgerFile([signOff]) }).index.assets[0].visual_check).toEqual({ state: 'signed', role: 'owner', reviewed_on: '2026-10-09' });
    const stale = { ...signOff, digest: 'd'.repeat(64) };
    expect(build({ reviewLedger: buildLedgerFile([stale]) }).index.assets[0].visual_check.state).toBe('not_done');
  });
});

describe('buildAnatomyBundle: layers, sources and pins', () => {
  const bundle = build();
  const { index } = bundle;
  const layerOf = (id: string): unknown => index.layers.find((layer) => layer.id === id);

  it('carries the fixed status sentence, the addressing version and the declared space', () => {
    expect(index).toMatchObject({ status: ANATOMY_INDEX_STATUS, addressing_version: 1, template_space: 'FixtureSpace', schema_version: 1 });
  });

  it('marks a layer available only when an asset exists for it', () => {
    expect(layerOf('deep')).toEqual({ id: 'deep', available: true, reason: null, source_ids: [FIXTURE_ATLAS_ID], asset_ids: [FIXTURE_ASSET_ID] });
  });

  it('marks an uncleared layer unavailable with the reason from its clearance record', () => {
    expect(layerOf('tracts')).toEqual({
      id: 'tracts', available: false, reason: 'The text cannot settle whether further terms pass through.', source_ids: [TRACTS_SOURCE_ID], asset_ids: [],
    });
  });

  it('gives every unavailable layer a reason, including one with no source at all', () => {
    expect(index.layers.map((layer) => layer.id)).toEqual(['outline', 'cortical', 'deep', 'tracts', 'networks', 'devices']);
    expect(index.layers.filter((layer) => !layer.available && (layer.reason ?? '').trim() === '')).toEqual([]);
    expect(layerOf('devices')).toMatchObject({ available: false, reason: 'No device geometry has been recorded for this build.' });
  });

  it('says for each source whether it may build, why not, and that no person confirmed the reading', () => {
    expect(index.sources.map((source) => [source.id, source.buildable, source.blockers, source.human_confirmed])).toEqual([
      [FIXTURE_ATLAS_ID, true, [], false],
      [TRACTS_SOURCE_ID, false, ['not_cleared', 'grant_not_explicit'], false],
    ]);
  });

  it('pins the evidence file by byte length and sha256, and the index by the same', () => {
    expect(index.evidence).toEqual({ path: '/atlas/anatomy-evidence.json', bytes: Buffer.byteLength(bundle.evidenceJson), sha256: sha256Hex(bundle.evidenceJson) });
    expect(bundle.indexPin).toEqual({ path: '/atlas/anatomy-index.json', bytes: Buffer.byteLength(bundle.indexJson), sha256: sha256Hex(bundle.indexJson) });
    expect(JSON.parse(bundle.indexJson)).toEqual(index);
  });

  it('builds the same bytes twice from the same inputs', () => {
    const again = build();
    expect([again.indexJson, again.evidenceJson]).toEqual([bundle.indexJson, bundle.evidenceJson]);
  });

  it('puts quotes and rationales in the evidence file, each with the key and digest a review must carry', () => {
    const evidence = JSON.parse(bundle.evidenceJson) as AnatomyEvidence;
    expect(evidence.status).toBe(ANATOMY_INDEX_STATUS);
    expect(evidence.crosswalk_rows.find((row) => row.key === STN_ROW_KEY)).toMatchObject({ quote_state: 'quote_found', evidence: { rationale: 'The atlas label and the QIF record carry the same name.' } });
    expect(evidence.technique_links.map((link) => link.key)).toEqual([`${TECHNIQUE_ID}:stn`, `${TECHNIQUE_ID}:thalamus`, `${TECHNIQUE_ID}:motor_strip`]);
    expect([...evidence.crosswalk_rows, ...evidence.technique_links, ...evidence.no_geometry].every((item) => /^[0-9a-f]{64}$/.test(item.digest))).toBe(true);
    expect(evidence.verdicts.map((verdict) => verdict.human_confirmed)).toEqual([false, false]);
    expect(bundle.indexJson).not.toContain('The atlas label and the QIF record carry the same name.');
  });

  it('builds with no manifest and no label table: nothing is drawn and every layer says why', () => {
    const empty = build({ manifest: null, labelTablesByPath: {}, crosswalk: { ...(buildRawFiles().crosswalk as object), rows: [], contains: [] } }).index;
    expect(empty.assets).toEqual([]);
    expect(empty.structures).toEqual([]);
    expect(empty.layers.filter((layer) => layer.available)).toEqual([]);
    expect(empty.layers.find((layer) => layer.id === 'deep')?.reason).toBe('No asset has been built for this layer yet.');
  });
});
