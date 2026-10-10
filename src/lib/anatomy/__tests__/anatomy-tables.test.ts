import { describe, expect, it } from 'vitest';
import { parseAnatomyFiles, type RawAnatomyFiles } from '../anatomy-inputs';
import { ANATOMY_TABLE_NAMES, ANATOMY_TABLE_PREFIX, buildAnatomyTables, type AnatomyTables } from '../anatomy-tables';
import type { AnatomyEvidence } from '../build-anatomy-evidence';
import { buildAnatomyBundle } from '../build-anatomy-index';
import { AnatomyDataError } from '../errors';
import type { LedgerEntry } from '../parse-review-ledger';
import { readBandLevelReason } from '../parse-technique-regions';
import { reviewStateOfLicenceReading } from '../review-state';
import { CROSSWALK_STATUS, SOURCES_STATUS, TECHNIQUE_REGIONS_STATUS, VERDICTS_STATUS } from '../status-sentences';
import { DRAFT_COLUMNS, EVIDENCE_COLUMNS, type AnatomyRow } from '../table-columns';
import { toQuotedField } from '../technique-tables';
import { CURATION_FILE, readTermRoles } from '../term-roles';
import { FIXTURE_ASSET_ID, buildAsset, buildManifest, buildNode } from './manifest-fixtures';
import { FIXTURE_ATLAS_ID } from './anatomy-fixtures';
import { PATHWAY_TEXT, TECHNIQUE_ID, TRACTS_SOURCE_ID, buildLedgerFile, buildRawFiles } from './raw-files-fixture';

const CURATION = {
  techniques: {
    [TECHNIQUE_ID]: { links: [{ term: 'stn', role: 'pathway_stage' }, { term: 'thalamus', role: 'pathway_stage' }, { term: 'motor_strip', role: 'action_target' }] },
    'QIF-T9002': { band_level: 'no_structure_named', skipped: [] },
  },
};
const STN_LINK_KEY = `${TECHNIQUE_ID}:stn`;
const STN_ROW_KEY = `region:stn:${FIXTURE_ATLAS_ID}:`;
const UNREVIEWED = { drafted_by: 'ai', review_state: 'ai_drafted_unreviewed', review_mark: 'AI-drafted, unreviewed', reviewed_by_role: '', reviewed_on: '' };

const build = (overrides: Partial<RawAnatomyFiles> = {}, curation: unknown = CURATION): AnatomyTables =>
  buildAnatomyTables(parseAnatomyFiles(buildRawFiles(overrides)), curation);
const rowWhere = (rows: readonly AnatomyRow[], column: string, value: string): AnatomyRow => rows.find((row) => row[column] === value) as AnatomyRow;

function reviewEntry(key: string, reviewerId = 'owner-1'): LedgerEntry {
  const evidence = JSON.parse(buildAnatomyBundle(parseAnatomyFiles(buildRawFiles())).evidenceJson) as AnatomyEvidence;
  const item = [...evidence.crosswalk_rows, ...evidence.technique_links, ...evidence.no_geometry].find((candidate) => candidate.key === key);
  return { kind: 'row_review', key, digest: (item as { digest: string }).digest, reviewer_id: reviewerId, reviewed_on: '2026-10-09' };
}

describe('buildAnatomyTables: every table carries the draft state', () => {
  const tables = build();

  it('builds exactly the named tables, each non-empty and under the shared prefix', () => {
    expect(Object.keys(tables)).toEqual([...ANATOMY_TABLE_NAMES]);
    expect(ANATOMY_TABLE_NAMES.filter((name) => !name.startsWith(ANATOMY_TABLE_PREFIX) || tables[name].length === 0)).toEqual([]);
  });

  it('gives every row of every table its drafter, review state, mark and status sentence, none of them empty', () => {
    const mandatory = ['drafted_by', 'review_state', 'review_mark', 'status_sentence'];
    const lacking = ANATOMY_TABLE_NAMES.flatMap((name) => tables[name]
      .filter((row) => DRAFT_COLUMNS.some((column) => typeof row[column] !== 'string') || mandatory.some((column) => row[column] === ''))
      .map(() => name));
    expect(lacking).toEqual([]);
    expect(tables.anatomy_crosswalk[0]).toMatchObject({ ...UNREVIEWED, status_sentence: CROSSWALK_STATUS });
    expect(tables.anatomy_technique_terms[0]).toMatchObject({ ...UNREVIEWED, status_sentence: TECHNIQUE_REGIONS_STATUS });
    expect(tables.anatomy_sources[0]).toMatchObject({ ...UNREVIEWED, status_sentence: `${SOURCES_STATUS} ${VERDICTS_STATUS}` });
  });

  it('gives every row of one table the same columns, so a parquet file has one schema', () => {
    const ragged = ANATOMY_TABLE_NAMES.filter((name) => tables[name].some((row) => Object.keys(row).join() !== Object.keys(tables[name][0]).join()));
    expect(ragged).toEqual([]);
  });

  it('shows a review only on the row the ledger entry covers, with the reviewer\'s role and the date', () => {
    const reviewed = build({ reviewLedger: buildLedgerFile([reviewEntry(STN_LINK_KEY), reviewEntry(STN_ROW_KEY, 'neuroanatomist-1')]) });
    const reviewedOn = { review_state: 'reviewed', reviewed_on: '2026-10-09' };
    expect(rowWhere(reviewed.anatomy_technique_terms, 'named_term', 'stn')).toMatchObject({ ...reviewedOn, review_mark: 'Reviewed by owner, 2026-10-09', reviewed_by_role: 'owner' });
    expect(rowWhere(reviewed.anatomy_technique_terms, 'named_term', 'thalamus')).toMatchObject(UNREVIEWED);
    expect(rowWhere(reviewed.anatomy_crosswalk, 'subject_id', 'stn')).toMatchObject({ ...reviewedOn, reviewed_by_role: 'neuroanatomist' });
    expect(rowWhere(reviewed.anatomy_crosswalk, 'subject_id', 'thalamus')).toMatchObject(UNREVIEWED);
    expect(rowWhere(reviewed.anatomy_technique_scopes, 'technique_id', TECHNIQUE_ID)).toMatchObject(UNREVIEWED);
  });
});

describe('buildAnatomyTables: sources', () => {
  const { anatomy_sources: sources } = build();

  it('lists each source with the publisher\'s quoted terms, who read them and whether it may build', () => {
    expect(sources.map((row) => row.source_id)).toEqual([FIXTURE_ATLAS_ID, TRACTS_SOURCE_ID]);
    expect(sources[0]).toMatchObject({ licence_read_by: 'ai', human_confirmed: false, cleared: true, buildable: true, blockers: '', template_space: 'FixtureSpace' });
    expect(sources[0].quoted_terms).not.toBe('');
    expect(sources[1]).toMatchObject({ cleared: false, buildable: false, grant: 'interpretation', unlocks_when: 'A written confirmation.' });
    expect(sources[1].blockers).toContain('not_cleared');
  });

  it('reads every licence reading as unreviewed, since none can be confirmed', () => {
    expect(reviewStateOfLicenceReading({ human_confirmed: false })).toEqual({ state: 'ai_drafted_unreviewed' });
  });
});

describe('buildAnatomyTables: structures', () => {
  const { anatomy_structures: structures } = build();

  it('has one row per shipped shape, with its asset, digest, size class and position check', () => {
    expect(rowWhere(structures, 'label_id', '7')).toMatchObject({
      structure_key: `${FIXTURE_ATLAS_ID}:7`, label_name: 'Fixture Nucleus', hemisphere: 'both', hemispheres_drawn: 'unknown', size_class: 'resolved',
      has_mesh: true, asset_id: FIXTURE_ASSET_ID, owner_subject_keys: 'region:stn', owner_count: 1, visual_check_state: 'not_done',
    });
    expect(String(rowWhere(structures, 'label_id', '7').asset_sha256)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps a label a record names that has no shape, with nulls where a shape would be measured', () => {
    expect(rowWhere(structures, 'label_id', '8')).toMatchObject({ owner_subject_keys: 'region:thalamus, region:vim', asset_id: '', has_mesh: false, vertex_count: null, centroid_x_mm: null });
  });

  it('keeps a shipped shape that no record maps to, still marked unreviewed', () => {
    expect(rowWhere(structures, 'label_id', '12')).toMatchObject({ owner_count: 0, owner_subject_keys: '', ...UNREVIEWED });
  });

  it('writes one row per side when a label is drawn on both', () => {
    const side = (hemisphere: 'left' | 'right') => buildNode({ extras: { atlas: FIXTURE_ATLAS_ID, label_id: '7', hemisphere } });
    const bothSides = [side('left'), side('right')];
    const rows = build({ manifest: buildManifest([buildAsset({ nodes: bothSides })]) }).anatomy_structures.filter((row) => row.label_id === '7');
    expect(rows.map((row) => row.hemisphere)).toEqual(['left', 'right']);
  });
});

describe('buildAnatomyTables: crosswalk', () => {
  const tables = build();
  const { anatomy_crosswalk: crosswalk } = tables;
  const { index } = buildAnatomyBundle(parseAnatomyFiles(buildRawFiles()));

  it('holds the rows valid for the current addressing and the no-geometry records, and nothing for an undrafted record', () => {
    expect(crosswalk.map((row) => `${row.row_kind}:${row.subject_id}`)).toEqual([
      'atlas_correspondence:stn', 'atlas_correspondence:thalamus', 'atlas_correspondence:vim', 'atlas_correspondence:m1', 'atlas_correspondence:pmc', 'no_geometry:cervical_cord',
    ]);
  });

  it('carries the quoted words, the label names and the grade of each correspondence', () => {
    const stn = rowWhere(crosswalk, 'subject_id', 'stn');
    expect(stn).toMatchObject({ review_key: STN_ROW_KEY, atlas: FIXTURE_ATLAS_ID, atlas_label_ids: '7', atlas_label_names: 'Fixture Nucleus', extent_match: 'same', quote_state: 'quote_found', check_status: 'unchecked' });
    expect(EVIDENCE_COLUMNS.filter((column) => stn[column] === '')).toEqual([]);
  });

  it('gives each row the geometry state the index gives its subject', () => {
    const stateOf = (id: string): string | undefined => index.subjects.find((subject) => subject.id === id)?.geometry.state;
    expect(crosswalk.filter((row) => row.subject_geometry_state !== stateOf(String(row.subject_id)))).toEqual([]);
    expect(rowWhere(crosswalk, 'subject_id', 'thalamus').subject_geometry_state).toBe('not_built');
  });

  it('states a no-geometry record\'s reason and its source, and claims nothing about an atlas', () => {
    expect(rowWhere(crosswalk, 'subject_id', 'cervical_cord')).toMatchObject({
      subject_geometry_state: 'no_geometry', subject_geometry_reason: 'The only spinal cord template found states no licence.',
      subject_geometry_reason_source: 'datalake/qif-anatomy-sources.json considered_and_refused: pam50', atlas: '', extent_match: '', definition_contested: null, quoted_text: '',
    });
  });
});

describe('buildAnatomyTables: technique terms and scopes', () => {
  const tables = build();
  const { anatomy_technique_terms: terms, anatomy_technique_scopes: scopes } = tables;
  const { index } = buildAnatomyBundle(parseAnatomyFiles(buildRawFiles()));

  it('carries the catalog\'s word, the quoted text, its field and its role on every term', () => {
    expect(rowWhere(terms, 'named_term', 'stn')).toMatchObject({
      technique_id: TECHNIQUE_ID, term_role: 'pathway_stage', quoted_text: PATHWAY_TEXT, quoted_field: 'tara.dsm5.pathway',
      quoted_pointer: `/techniques/${TECHNIQUE_ID}/tara/dsm5/pathway`, claim_basis: 'catalog_text', review_key: STN_LINK_KEY,
    });
    expect(rowWhere(terms, 'named_term', 'motor_strip').term_role).toBe('action_target');
  });

  it('takes resolution, band agreement and lighting from the index, link for link', () => {
    const indexed = index.techniques.flatMap((technique) => technique.links.map((link) =>
      [technique.id, link.term, link.resolution, link.resolved_region_id ?? '', link.band_agrees, link.lit, link.quote_state, link.check_status]));
    expect(terms.map((row) => [row.technique_id, row.named_term, row.resolution, row.resolved_region_id, row.band_agrees, row.lights_region, row.quote_state, row.check_status])).toEqual(indexed);
    expect(terms.map((row) => [row.named_term, row.resolution, row.lights_region])).toEqual([['stn', 'id', true], ['thalamus', 'id', false], ['motor_strip', 'whole_to_part', false]]);
  });

  it('unlights a term whose quoted words are gone, and says the quote is missing', () => {
    const registrar = { techniques: [{ id: TECHNIQUE_ID, tara: { dsm5: { pathway: 'The text was rewritten.' } } }] };
    const stale = build({ registrar });
    expect(rowWhere(stale.anatomy_technique_terms, 'named_term', 'stn')).toMatchObject({ quote_state: 'quote_missing', lights_region: false, check_status: 'unchecked' });
    expect(rowWhere(stale.anatomy_technique_scopes, 'technique_id', TECHNIQUE_ID)).toMatchObject({ lit_region_ids: '', lit_region_count: 0 });
  });

  it('summarises each drafted technique, and has no row for a technique with no entry', () => {
    expect(scopes).toHaveLength(1);
    expect(scopes[0]).toMatchObject({ technique_id: TECHNIQUE_ID, scope: 'regions', band_level_reason: '', named_term_count: 3, lighting_term_count: 1, lit_region_ids: 'stn', lit_region_count: 1 });
  });

  it('states a band-level entry\'s reason and lights nothing for it', () => {
    const rationale = 'no_structure_named: No field of this technique\'s registrar text names a structure.';
    const bandLevel = build({ techniqueRegions: { schema_version: 2, status: TECHNIQUE_REGIONS_STATUS, techniques: { 'QIF-T9002': { scope: 'band_level', rationale, links: [] } } } });
    expect(bandLevel.anatomy_technique_terms).toEqual([]);
    expect(bandLevel.anatomy_technique_scopes).toEqual([expect.objectContaining({ technique_id: 'QIF-T9002', scope: 'band_level', band_level_reason: 'no_structure_named', rationale, lit_region_count: 0, ...UNREVIEWED })]);
  });
});

describe('table helpers', () => {
  it('reads the reason a band-level rationale opens with, and none from any other entry', () => {
    expect(readBandLevelReason({ scope: 'band_level', rationale: 'text_contradicts_band_tags: The pathway text says there is none.' })).toBe('text_contradicts_band_tags');
    expect(readBandLevelReason({ scope: 'band_level', rationale: 'because: free prose' })).toBeNull();
    expect(readBandLevelReason({ scope: 'regions', rationale: 'no_structure_named: not a band-level entry' })).toBeNull();
  });

  it('names the registrar field a pointer addresses', () => {
    expect(toQuotedField('/techniques/QIF-T0127/tara/dsm5/pathway')).toBe('tara.dsm5.pathway');
    expect(toQuotedField('/techniques/QIF-T0010/notes')).toBe('notes');
  });

  it('reads each curated link\'s role by its ledger key', () => {
    expect([...readTermRoles(CURATION)]).toEqual([[STN_LINK_KEY, 'pathway_stage'], [`${TECHNIQUE_ID}:thalamus`, 'pathway_stage'], [`${TECHNIQUE_ID}:motor_strip`, 'action_target']]);
  });

  it('stops when a drafted link has no curated role, or the curation record is malformed', () => {
    const withoutStn = { techniques: { [TECHNIQUE_ID]: { links: [{ term: 'thalamus', role: 'pathway_stage' }] } } };
    expect(() => build({}, withoutStn)).toThrow(AnatomyDataError);
    expect(() => build({}, withoutStn)).toThrow(`${CURATION_FILE}: techniques.${TECHNIQUE_ID}.links: no curated link holds the term "stn"`);
    expect(() => readTermRoles({ techniques: { [TECHNIQUE_ID]: { links: [{ term: 'stn', role: 'Targets the region' }] } } })).toThrow('is not a role');
    expect(() => readTermRoles({ techniques: { [TECHNIQUE_ID]: { links: [{ role: 'pathway_stage' }] } } })).toThrow('expected a link with a term');
    expect(() => readTermRoles([])).toThrow('expected an object keyed by technique id');
  });
});
