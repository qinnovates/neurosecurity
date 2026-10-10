import { describe, expect, it } from 'vitest';
import { AnatomyDataError } from '../errors';
import { parseCrosswalk } from '../parse-crosswalk';
import {
  NO_GEOMETRY_RECORD, UNCLEARED_ATLAS_ID, UNREAD_ATLAS_ID, buildCrosswalkContext, buildCrosswalkFile, buildDrawnRow, buildRow,
  type CrosswalkFileParts,
} from './crosswalk-fixtures';

const CONTEXT = buildCrosswalkContext();
const parseParts = (fileParts: CrosswalkFileParts): unknown => parseCrosswalk(buildCrosswalkFile(fileParts), CONTEXT);
const M1_ROW = { subject_id: 'm1', subject_name_at_draft: 'Primary Motor Cortex' } as const;
const PMC_ROW = { subject_id: 'pmc', subject_name_at_draft: 'Premotor Cortex' } as const;
const THALAMUS_ROW = { subject_id: 'thalamus', subject_name_at_draft: 'Thalamus' } as const;
const VIM_ROW = { subject_id: 'vim', subject_name_at_draft: 'Ventral Intermediate Nucleus (Thalamus)' } as const;

describe('parseCrosswalk: file shape', () => {
  it('accepts a valid crosswalk', () => {
    expect(parseCrosswalk(buildCrosswalkFile(), CONTEXT).rows).toHaveLength(1);
  });

  it('accepts a file with no rows', () => {
    expect(parseCrosswalk(buildCrosswalkFile({ rows: [], no_geometry: [NO_GEOMETRY_RECORD] }), CONTEXT).no_geometry).toHaveLength(1);
  });

  it('rejects an unknown schema version, a softened status sentence and a band key', () => {
    expect(() => parseCrosswalk({ ...buildCrosswalkFile(), schema_version: 3 }, CONTEXT)).toThrow(/schema_version: version 3 is not one this build understands/);
    expect(() => parseCrosswalk({ ...buildCrosswalkFile(), status: 'Checked.' }, CONTEXT)).toThrow(/status: the status sentence differs/);
    expect(() => parseParts({ rows: [{ ...buildRow(), qif_band: 'N5' }] })).toThrow(/rows\[0\]\.qif_band: this file must not store a QIF band/);
  });

  it('rejects a review field on a row and a reviewer list in the file', () => {
    expect(() => parseParts({ rows: [{ ...buildRow(), human_review: { reviewer: 'owner-1' } }] })).toThrow(/rows\[0\]: unexpected key "human_review"/);
    expect(() => parseCrosswalk({ ...buildCrosswalkFile(), reviewers: [] }, CONTEXT)).toThrow(/unexpected key "reviewers"/);
  });

  it('rejects a row that claims a drafter other than AI', () => {
    expect(() => parseParts({ rows: [{ ...buildRow(), drafted_by: 'human' }] })).toThrow(/rows\[0\]\.drafted_by: "human" is not an allowed value/);
  });

  it('rejects the projection-only field human_status in a row\'s evidence', () => {
    const evidence = { ...buildRow().evidence, human_status: 'demonstrated' };
    expect(() => parseParts({ rows: [{ ...buildRow(), evidence }] })).toThrow(/rows\[0\]\.evidence\.human_status/);
  });

  it('throws the typed error', () => {
    expect(() => parseCrosswalk('not a crosswalk', CONTEXT)).toThrow(AnatomyDataError);
  });
});

describe('parseCrosswalk: subjects', () => {
  it('rejects an alias used as a subject id', () => {
    expect(() => parseParts({ rows: [buildRow({ subject_id: 'subthalamic_nucleus' })] }))
      .toThrow(/rows\[0\]\.subject_id: "subthalamic_nucleus" is an alias, not a canonical region id/);
  });

  it('rejects a subject the QIF files do not hold, and an unknown subject kind', () => {
    expect(() => parseParts({ rows: [buildRow({ subject_id: 'claustrum' })] })).toThrow(/"claustrum" is not a region id/);
    expect(() => parseParts({ rows: [{ ...buildRow(), subject_kind: 'tract' }] })).toThrow(/subject_kind: "tract" is not an allowed value/);
  });

  it('rejects a row whose recorded name differs from the QIF record\'s current name', () => {
    expect(() => parseParts({ rows: [buildRow({ subject_name_at_draft: 'Subthalamic nucleus (STN)' })] }))
      .toThrow(/subject_name_at_draft: the row was drafted for "Subthalamic nucleus \(STN\)" but region "stn" is now named "Subthalamic Nucleus"/);
  });

  it('rejects a row valid for no addressing version, or for one that is not a positive whole number', () => {
    expect(() => parseParts({ rows: [buildRow({ valid_for_addressing: [] })] })).toThrow(/valid_for_addressing: a row must be valid for at least one addressing version/);
    expect(() => parseParts({ rows: [buildRow({ valid_for_addressing: [0] })] })).toThrow(/valid_for_addressing/);
    expect(() => parseParts({ rows: [buildRow({ valid_for_addressing: [1, 1] })] })).toThrow(/appears twice/);
  });

  it('rejects two rows with one key', () => {
    expect(() => parseParts({ rows: [buildRow({ extent_match: 'approximate' }), buildRow({ extent_match: 'approximate' })] }))
      .toThrow(/row "region:stn:fixture_atlas:" appears twice/);
  });
});

describe('parseCrosswalk: parts', () => {
  const cingulate = { subject_id: 'cingulate', subject_name_at_draft: 'Cingulate Gyrus (Posterior)', extent_match: 'approximate' } as const;

  it('accepts a listed part', () => {
    expect(parseCrosswalk(buildCrosswalkFile({ rows: [buildRow({ ...cingulate, part: 'posterior_cingulate' })] }), CONTEXT).rows[0].part).toBe('posterior_cingulate');
  });

  it('rejects a part the file does not list', () => {
    expect(() => parseParts({ rows: [buildRow({ ...cingulate, part: 'retrosplenial' })] })).toThrow(/part: "retrosplenial" is not in this file's parts list/);
  });

  it('rejects a drawing row on a part whose fate is undecided', () => {
    expect(() => parseParts({ rows: [buildRow({ ...cingulate, part: 'precuneus' })] }))
      .toThrow(/draws: part "precuneus" is undecided, so no row on it may draw/);
    expect(parseCrosswalk(buildCrosswalkFile({ rows: [buildRow({ ...cingulate, part: 'precuneus', draws: false })] }), CONTEXT).rows).toHaveLength(1);
  });

  it('rejects a part listed twice', () => {
    const parts = [{ id: 'precuneus', expected_v2_id: 'undecided' }, { id: 'precuneus', expected_v2_id: 'precuneus' }];
    expect(() => parseParts({ parts, rows: [] })).toThrow(/part id "precuneus" appears twice/);
  });
});

describe('parseCrosswalk: atlas labels', () => {
  it('rejects a label id that is not in the atlas\'s label table', () => {
    expect(() => parseParts({ rows: [buildRow({ atlas_ids: ['7', '99'] })] })).toThrow(/atlas_ids: "99" is not a label of "fixture_atlas"/);
  });

  it('rejects a row on an atlas with no label table, or outside the registry, and a row naming no label', () => {
    const context = buildCrosswalkContext({ labelTables: new Map() });
    expect(() => parseCrosswalk(buildCrosswalkFile(), context)).toThrow(/atlas: "fixture_atlas" has no label table yet/);
    expect(() => parseParts({ rows: [buildRow({ atlas: 'stray_atlas' })] })).toThrow(/atlas: "stray_atlas" is not a source in the registry/);
    expect(() => parseParts({ rows: [buildRow({ atlas_ids: [] })] })).toThrow(/atlas_ids: a row must name at least one label/);
  });

  it('rejects "same" on an atlas an expert drew onto a template', () => {
    expect(() => parseParts({ rows: [buildDrawnRow({ extent_match: 'same' })] }))
      .toThrow(/extent_match: "fixture_drawn_atlas" is an expert drawing on a template, so no row on it may be "same"/);
  });

  it('rejects "same" on an atlas whose delineation basis nobody has read', () => {
    expect(() => parseParts({ rows: [buildRow({ atlas: UNREAD_ATLAS_ID, atlas_ids: ['30'] })] }))
      .toThrow(/delineation_basis: the registry does not yet record how "unread_atlas" was delineated/);
  });

  it('rejects a delineation basis that differs from the registry\'s', () => {
    expect(() => parseParts({ rows: [buildRow({ delineation_basis: 'histology' })] }))
      .toThrow(/delineation_basis: "histology" is not the basis "manual_mri" the registry records for "fixture_atlas"/);
  });

  it('rejects a row graded "none" that still names labels: the shape is not the structure, so the row owns nothing', () => {
    expect(() => parseParts({ rows: [buildRow({ extent_match: 'none', draws: false })] }))
      .toThrow(/atlas_ids: a row graded "none" says no shape stands for the subject, so it must list no label/);
  });

  it('accepts a "none" row with no labels, even before the atlas has a label table, and never lets it draw', () => {
    const context = buildCrosswalkContext({ labelTables: new Map() });
    const noneRow = buildRow({ extent_match: 'none', atlas_ids: [], draws: false, name_match: 'none' });
    expect(parseCrosswalk(buildCrosswalkFile({ rows: [noneRow] }), context).rows[0].atlas_ids).toEqual([]);
    expect(() => parseParts({ rows: [{ ...noneRow, draws: true }] })).toThrow(/draws: a row whose extent_match is "none" has nothing to draw/);
  });

  it('rejects one subject naming the same label in two rows, in either order', () => {
    const cingulate = { subject_id: 'cingulate', subject_name_at_draft: 'Cingulate Gyrus (Posterior)' } as const;
    const whole = buildRow({ ...cingulate, extent_match: 'approximate' });
    const part = buildRow({ ...cingulate, part: 'posterior_cingulate', extent_match: 'contained' });
    for (const rows of [[whole, part], [part, whole]]) {
      expect(() => parseParts({ rows })).toThrow(/region "cingulate" names label "fixture_atlas:7" in two rows/);
    }
  });

  it('rejects a drawing row on an atlas that is not buildable', () => {
    expect(() => parseParts({ rows: [buildRow({ atlas: UNCLEARED_ATLAS_ID, atlas_ids: ['40'] })] }))
      .toThrow(/draws: "uncleared_atlas" is not buildable, so nothing may be drawn from it/);
  });
});

describe('parseCrosswalk: who shares a shape', () => {
  it('rejects one label graded "same" for two subjects', () => {
    expect(() => parseParts({ rows: [buildRow(), buildRow(THALAMUS_ROW)] }))
      .toThrow(/label "fixture_atlas:7" is graded "same" for both "stn" and "thalamus"/);
  });

  it('rejects "same" on a label that a second, unrelated subject also names', () => {
    expect(() => parseParts({ rows: [buildRow(), buildRow({ ...M1_ROW, extent_match: 'contained' })] }))
      .toThrow(/label "fixture_atlas:7" is graded "same" for "stn" but "m1" also names it and is not its declared parent or child/);
  });

  it('allows "same" beside a declared child, and still refuses two "same" rows for a parent and its child', () => {
    const contains = [{ parent: 'thalamus', child: 'vim' }];
    const rows = [buildRow(THALAMUS_ROW), buildRow({ ...VIM_ROW, extent_match: 'contained' })];
    expect(parseCrosswalk(buildCrosswalkFile({ rows, contains }), CONTEXT).contains).toEqual(contains);
    expect(() => parseParts({ rows: [buildRow(THALAMUS_ROW), buildRow(VIM_ROW)], contains })).toThrow(/is graded "same" for both "thalamus" and "vim"/);
  });

  it('allows two subjects that are both inside one shape', () => {
    const rows = [buildDrawnRow({ ...M1_ROW, extent_match: 'contained' }), buildDrawnRow({ ...PMC_ROW, extent_match: 'contained' })];
    expect(parseCrosswalk(buildCrosswalkFile({ rows }), CONTEXT).rows).toHaveLength(2);
  });

  it('rejects a subject whose drawing rows name two atlases', () => {
    const rows = [buildRow({ extent_match: 'approximate' }), buildDrawnRow()];
    expect(() => parseParts({ rows })).toThrow(/region "stn" draws from both "fixture_atlas" and "fixture_drawn_atlas"/);
  });
});

describe('parseCrosswalk: contains and no_geometry', () => {
  it('rejects a containment between unknown regions, of a region in itself, stated twice, or in a loop', () => {
    expect(() => parseParts({ contains: [{ parent: 'thalamus', child: 'claustrum' }] })).toThrow(/contains\[0\]\.child: "claustrum" is not a region id/);
    expect(() => parseParts({ contains: [{ parent: 'vim', child: 'vim' }] })).toThrow(/a region cannot contain itself/);
    expect(() => parseParts({ contains: [{ parent: 'thalamus', child: 'vim' }, { parent: 'thalamus', child: 'vim' }] })).toThrow(/appears twice/);
    expect(() => parseParts({ contains: [{ parent: 'thalamus', child: 'vim' }, { parent: 'vim', child: 'thalamus' }] }))
      .toThrow(/"vim" and "thalamus" contain each other/);
  });

  it('rejects two no_geometry records for one subject, and one with no reason or no source for it', () => {
    expect(() => parseParts({ rows: [], no_geometry: [NO_GEOMETRY_RECORD, NO_GEOMETRY_RECORD] })).toThrow(/no_geometry record for "region:cervical_cord" appears twice/);
    const { reason_source: _omitted, ...withoutSource } = NO_GEOMETRY_RECORD;
    expect(() => parseParts({ rows: [], no_geometry: [withoutSource] })).toThrow(/no_geometry\[0\]: missing key "reason_source"/);
    expect(() => parseParts({ rows: [], no_geometry: [{ ...NO_GEOMETRY_RECORD, reason: '' }] })).toThrow(/no_geometry\[0\]\.reason/);
  });

  it('rejects a subject that has both a no_geometry record and a drawing row', () => {
    const row = buildRow({ subject_id: 'cervical_cord', subject_name_at_draft: 'Cervical Spinal Cord', extent_match: 'approximate' });
    expect(() => parseParts({ rows: [row], no_geometry: [NO_GEOMETRY_RECORD] }))
      .toThrow(/region "cervical_cord" has a no_geometry record and a drawing row/);
  });

  it('rejects an alias in a no_geometry record', () => {
    expect(() => parseParts({ rows: [], no_geometry: [{ ...NO_GEOMETRY_RECORD, subject_id: 'subthalamic_nucleus' }] })).toThrow(/is an alias, not a canonical region id/);
  });
});
