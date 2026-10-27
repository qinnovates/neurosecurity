import { describe, expect, it } from 'vitest';
import { parseAnatomyFiles, type RawAnatomyFiles } from '../anatomy-inputs';
import { buildAnatomyTables, type AnatomyTables } from '../anatomy-tables';
import type { AnatomyEvidence } from '../build-anatomy-evidence';
import { buildAnatomyBundle } from '../build-anatomy-index';
import { AnatomyDataError } from '../errors';
import { parseReviewLedger, type LedgerEntry } from '../parse-review-ledger';
import { readBandLevelReason } from '../parse-technique-regions';
import { reviewStateOfLicenceReading } from '../review-state';
import { CROSSWALK_STATUS, SOURCES_STATUS, TECHNIQUE_REGIONS_STATUS, VERDICTS_STATUS } from '../status-sentences';
import { EVIDENCE_COLUMNS, type AnatomyRow } from '../table-columns';
import { ANATOMY_TABLE_NAMES, ANATOMY_TABLE_PREFIX, MATCH_KINDS, drafterColumn, listDraftColumns, reviewColumn } from '../table-names';
import { toQuotedField } from '../technique-tables';
import { CURATION_FILE, EXPORTED_TERM_ROLES, readTermRoles } from '../term-roles';
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
const UNREVIEWED = { review_state: 'ai_drafted_unreviewed', review_mark: 'AI-drafted, unreviewed', reviewed_by_role: '', reviewed_on: '' };

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

  it('opens every row of every table with the six draft-state columns, in order', () => {
    const misopened = ANATOMY_TABLE_NAMES.filter((name) => tables[name].some((row) => Object.keys(row).slice(0, listDraftColumns(name).length).join() !== listDraftColumns(name).join()));
    expect(misopened).toEqual([]);
    expect(listDraftColumns('anatomy_structures')).toEqual(['mapping_review_mark', 'mapping_review_state', 'mapping_reviewed_by_role', 'mapping_reviewed_on', 'mapping_drafted_by', 'status_sentence']);
    expect(listDraftColumns('anatomy_technique_terms')).toEqual(['review_mark', 'review_state', 'reviewed_by_role', 'reviewed_on', 'drafted_by', 'status_sentence']);
  });

  it('leaves no review mark, review state or status sentence empty on any row', () => {
    const mustBeFilled = (name: typeof ANATOMY_TABLE_NAMES[number]): string[] => [reviewColumn(name, 'review_mark'), reviewColumn(name, 'review_state'), 'status_sentence'];
    const unfilled = ANATOMY_TABLE_NAMES.flatMap((name) => tables[name].filter((row) => mustBeFilled(name).some((column) => typeof row[column] !== 'string' || row[column] === '')).map(() => name));
    expect(unfilled).toEqual([]);
    expect(tables.anatomy_crosswalk[0]).toMatchObject({ ...UNREVIEWED, drafted_by: 'ai', status_sentence: CROSSWALK_STATUS });
    expect(tables.anatomy_technique_terms[0]).toMatchObject({ ...UNREVIEWED, drafted_by: 'ai', status_sentence: TECHNIQUE_REGIONS_STATUS });
    expect(tables.anatomy_sources[0]).toMatchObject({ ...UNREVIEWED, drafted_by: 'ai', status_sentence: `${SOURCES_STATUS} ${VERDICTS_STATUS}` });
  });

  it('names the drafter from the drafted rows themselves, and names none where nothing was drafted', () => {
    expect(ANATOMY_TABLE_NAMES.map(drafterColumn)).toEqual(['drafted_by', 'mapping_drafted_by', 'drafted_by', 'drafted_by', 'terms_drafted_by']);
    expect(rowWhere(tables.anatomy_structures, 'label_id', '7').mapping_drafted_by).toBe('ai');
    expect(rowWhere(tables.anatomy_structures, 'label_id', '12').mapping_drafted_by).toBe('');
    expect(rowWhere(tables.anatomy_technique_term_summary, 'technique_id', TECHNIQUE_ID).terms_drafted_by).toBe('ai');
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
  });

  it('never reads a summary row as reviewed through its terms: it has no ledger key of its own', () => {
    const everyLink = ['stn', 'thalamus', 'motor_strip'].map((term) => reviewEntry(`${TECHNIQUE_ID}:${term}`));
    const reviewed = build({ reviewLedger: buildLedgerFile(everyLink) });
    expect(reviewed.anatomy_technique_terms.map((row) => row.review_state)).toEqual(['reviewed', 'reviewed', 'reviewed']);
    expect(rowWhere(reviewed.anatomy_technique_term_summary, 'technique_id', TECHNIQUE_ID)).toMatchObject({ ...UNREVIEWED, reviewed_term_count: 3 });
  });
});

describe('buildAnatomyTables: sources', () => {
  const { anatomy_sources: sources } = build();

  it('lists each source with the publisher\'s quoted terms, who read them and whether it may build', () => {
    expect(sources.map((row) => row.source_id)).toEqual([FIXTURE_ATLAS_ID, TRACTS_SOURCE_ID]);
    expect(sources[0]).toMatchObject({ license_read_by: 'ai', human_confirmed: false, ai_reading_permits_shipping: true, buildable: true, blockers: '', template_space: 'FixtureSpace' });
    expect(Object.keys(sources[0]).filter((column) => /licence|^verdict$|^cleared$|^license_id$/.test(column))).toEqual([]);
    expect(sources[0].quoted_terms).not.toBe('');
    expect(sources[1]).toMatchObject({ ai_reading_permits_shipping: false, buildable: false, grant: 'interpretation', unlocks_when: 'A written confirmation.', stated_license_id: 'cc-by-sa-4.0', handled_as_license_id: 'cc-by-sa-4.0' });
    expect(sources[1].blockers).toContain('not_cleared');
  });

  it('reads an unconfirmed licence reading as unreviewed', () => {
    const verdict = { human_confirmed: false as const, source_id: FIXTURE_ATLAS_ID, licence_digest: 'c'.repeat(64) };
    expect(reviewStateOfLicenceReading(verdict, parseReviewLedger(buildLedgerFile()))).toEqual({ state: 'ai_drafted_unreviewed' });
  });
});

describe('buildAnatomyTables: structures', () => {
  const { anatomy_structures: structures } = build();

  it('has one row per shipped shape, with its asset, digest, size class and position check', () => {
    expect(rowWhere(structures, 'label_id', '7')).toMatchObject({
      structure_key: `${FIXTURE_ATLAS_ID}:7`, label_name: 'Fixture Nucleus', hemisphere: 'both', hemispheres_drawn: 'unknown', size_class: 'resolved',
      has_drawn_shape: true, asset_id: FIXTURE_ASSET_ID, mapped_qif_record_keys: 'region:stn', mapped_qif_record_count: 1, visual_check_state: 'not_done',
    });
    expect(String(rowWhere(structures, 'label_id', '7').asset_sha256)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps a label a record names that has no shape, with nulls where a shape would be measured', () => {
    expect(rowWhere(structures, 'label_id', '8')).toMatchObject({ mapped_qif_record_keys: 'region:thalamus, region:vim', asset_id: '', has_drawn_shape: false, vertex_count: null, centroid_x_mm: null });
  });

  it('keeps a shipped shape that no record maps to, still marked unreviewed', () => {
    expect(rowWhere(structures, 'label_id', '12')).toMatchObject({ mapped_qif_record_count: 0, mapped_qif_record_keys: '', mapping_review_state: 'ai_drafted_unreviewed', mapping_review_mark: 'AI-drafted, unreviewed' });
  });

  it('says the mapping is reviewed, never the shape: the shape\'s own checks follow and stay as they were', () => {
    const reviewed = build({ reviewLedger: buildLedgerFile([reviewEntry(STN_ROW_KEY)]) }).anatomy_structures;
    const stn = rowWhere(reviewed, 'label_id', '7');
    expect(stn).toMatchObject({ mapping_review_state: 'reviewed', mapping_review_mark: 'Reviewed by owner, 2026-10-09', mapping_reviewed_by_role: 'owner', visual_check_state: 'not_done' });
    expect(Object.keys(stn).slice(0, 8)).toEqual([...listDraftColumns('anatomy_structures'), 'visual_check_state', 'position_check']);
    expect(Object.keys(stn).filter((column) => /^review|^drafted_by$/.test(column))).toEqual([]);
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
      subject_geometry_reason_source: 'datalake/qif-anatomy-sources.json considered_and_refused: pam50', atlas: '', extent_match: '', definition_contested: null, quoted_text: '', has_drawn_shape: false,
    });
  });
});

describe('buildAnatomyTables: technique terms and their summary', () => {
  const tables = build();
  const { anatomy_technique_terms: terms, anatomy_technique_term_summary: summary } = tables;
  const { index } = buildAnatomyBundle(parseAnatomyFiles(buildRawFiles()));

  it('carries the catalog\'s word, the quoted text, its field and the role an AI gave it on every term', () => {
    expect(rowWhere(terms, 'named_term', 'stn')).toMatchObject({
      technique_id: TECHNIQUE_ID, ai_assigned_term_role: 'named_as_pathway_stage', quoted_text: PATHWAY_TEXT, quoted_field: 'tara.dsm5.pathway',
      quoted_pointer: `/techniques/${TECHNIQUE_ID}/tara/dsm5/pathway`, claim_basis: 'catalog_text', review_key: STN_LINK_KEY,
    });
    expect(rowWhere(terms, 'named_term', 'motor_strip').ai_assigned_term_role).toBe('named_as_acted_on');
  });

  it('takes the match, the band test and the single-region flag from the index, link for link', () => {
    const indexed = index.techniques.flatMap((technique) => technique.links.map((link) =>
      [technique.id, link.term, MATCH_KINDS[link.resolution], link.band_agrees, link.lit, link.quote_state, link.check_status]));
    expect(terms.map((row) => [row.technique_id, row.named_term, row.match_kind, row.region_band_in_technique_bands, row.single_region_match, row.quote_state, row.check_status])).toEqual(indexed);
  });

  it('fills single_region_id only on a single-region match, and puts every other alias hit in its own column', () => {
    expect(terms.map((row) => [row.named_term, row.match_kind, row.single_region_match, row.single_region_id, row.other_match_region_id])).toEqual([
      ['stn', 'region_id', true, 'stn', ''],
      ['thalamus', 'region_id', false, '', 'thalamus'],
      ['motor_strip', 'term_is_broader_than_region', false, '', 'm1'],
    ]);
    expect(Object.keys(terms[0]).filter((column) => ['resolved_region_id', 'resolution', 'lights_region', 'band_agrees', 'term_role'].includes(column))).toEqual([]);
  });

  it('empties single_region_id when the quoted words are gone, and says the quote is missing', () => {
    const registrar = { techniques: [{ id: TECHNIQUE_ID, tara: { dsm5: { pathway: 'The text was rewritten.' } } }] };
    const stale = build({ registrar });
    expect(rowWhere(stale.anatomy_technique_terms, 'named_term', 'stn')).toMatchObject({ quote_state: 'quote_missing', single_region_match: false, single_region_id: '', other_match_region_id: 'stn', check_status: 'unchecked' });
    expect(rowWhere(stale.anatomy_technique_term_summary, 'technique_id', TECHNIQUE_ID)).toMatchObject({ single_region_term_count: 0, stale_region_term_count: 1 });
  });

  it('summarises each drafted technique in counts that add up, names no region, and has no row for a technique with no entry', () => {
    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({
      technique_id: TECHNIQUE_ID, scope: 'regions', band_level_reason: '', named_term_count: 3, single_region_term_count: 1,
      region_in_other_band_term_count: 1, stale_region_term_count: 0, broader_or_narrower_term_count: 1, no_region_term_count: 0, reviewed_term_count: 0,
    });
    expect(Object.keys(summary[0]).filter((column) => /region_id/.test(column))).toEqual([]);
  });

  it('states a band-level entry\'s reason, with every count at zero and no drafter of terms', () => {
    const rationale = 'no_structure_named: No field of this technique\'s registrar text names a structure.';
    const bandLevel = build({ techniqueRegions: { schema_version: 2, status: TECHNIQUE_REGIONS_STATUS, techniques: { 'QIF-T9002': { scope: 'band_level', rationale, links: [] } } } });
    expect(bandLevel.anatomy_technique_terms).toEqual([]);
    expect(bandLevel.anatomy_technique_term_summary).toEqual([expect.objectContaining({
      technique_id: 'QIF-T9002', scope: 'band_level', band_level_reason: 'no_structure_named', rationale, named_term_count: 0, single_region_term_count: 0, terms_drafted_by: '', ...UNREVIEWED,
    })]);
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

  it('reads each curated link\'s role by its ledger key, under the name it is exported with', () => {
    expect([...readTermRoles(CURATION)]).toEqual([[STN_LINK_KEY, 'named_as_pathway_stage'], [`${TECHNIQUE_ID}:thalamus`, 'named_as_pathway_stage'], [`${TECHNIQUE_ID}:motor_strip`, 'named_as_acted_on']]);
    expect(Object.values(EXPORTED_TERM_ROLES).filter((role) => !role.startsWith('named_') && !role.startsWith('adjective_'))).toEqual([]);
  });

  it('stops when a drafted link has no curated role, or the curation record is malformed', () => {
    const withoutStn = { techniques: { [TECHNIQUE_ID]: { links: [{ term: 'thalamus', role: 'pathway_stage' }] } } };
    expect(() => build({}, withoutStn)).toThrow(AnatomyDataError);
    expect(() => build({}, withoutStn)).toThrow(`${CURATION_FILE}: techniques.${TECHNIQUE_ID}.links: no curated link holds the term "stn"`);
    expect(() => readTermRoles({ techniques: { [TECHNIQUE_ID]: { links: [{ term: 'stn', role: 'attacks_region' }] } } })).toThrow('is not a role this build can export');
    expect(() => readTermRoles({ techniques: { [TECHNIQUE_ID]: { links: [{ role: 'pathway_stage' }] } } })).toThrow('expected a link with a term');
    expect(() => readTermRoles([])).toThrow('expected an object keyed by technique id');
  });
});
