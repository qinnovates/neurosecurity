// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import curation from '@shared/scripts/technique-region-curation.json';
import { LINK_ROLES, renderLinkRationale } from '@shared/scripts/draft-technique-regions.mjs';
import { ANATOMY_PRESETS } from '@/components/bci/anatomy-presets';
import { loadAnatomyBundle, loadAnatomyData } from '@/components/atlas-scene/load-anatomy-data';
import { buildIndexes, executeQuery } from '@/lib/kql-engine';
import { getAvailableTableNames, getKqlTables } from '@/lib/kql-tables';
import { buildAnatomyTables } from '../anatomy-tables';
import { describeAnatomyTables } from '../describe-tables';
import { LABEL_TABLES_BY_PATH, loadAnatomyTables } from '../load-anatomy-tables';
import { ANATOMY_INDEX_STATUS, CROSSWALK_STATUS, SOURCES_STATUS, TECHNIQUE_REGIONS_STATUS, VERDICTS_STATUS } from '../status-sentences';
import type { AnatomyRow } from '../table-columns';
import { ANATOMY_TABLE_NAMES, ANATOMY_TABLE_PREFIX, DRAFTER_COLUMN_BY_TABLE, MATCH_KINDS, isAnatomyTableName, listDraftColumns, type AnatomyTableName } from '../table-names';
import { EXPORTED_TERM_ROLES, type CurationRole } from '../term-roles';

const ASSET_DIRECTORY = 'src/site/atlas-assets';
const LABEL_TABLE_PATTERN = /^labels-[a-z0-9_]+\.json$/;
const SDK_DIRECTORY = 'datalake/qtara/src/qtara';
const API_DIRECTORY = 'src/pages/api';
const ANATOMY_REFERENCE_PATTERN = /qif-anatomy-|anatomy_technique|anatomy-tables|technique-region/;
/** Words that state a drafted reading as an effect on the brain. No column name and no vocabulary value may hold one. */
const OVERCLAIMING_WORD_PATTERN = /target|affect|attack|hits|cause/i;
/** The registrar's own field is called `target`; the role says the word sits in that field and nothing about what the technique does. */
const ALLOWED_OVERCLAIMING_VALUES = ['named_in_catalog_target_field'];
/**
 * Columns that carry someone else's words verbatim: the registrar's text, field names and technique names, the
 * publishers' label names and licence terms, and the drafter's stated reasons. They are evidence, not vocabulary.
 */
const VERBATIM_COLUMNS = [
  'quoted_text', 'quoted_field', 'quoted_pointer', 'quoted_terms', 'rationale', 'technique_name', 'named_term', 'name', 'label_name', 'atlas_label_names',
  'subject_name', 'subject_name_at_draft', 'subject_geometry_reason', 'subject_geometry_reason_source', 'clearance_reason', 'unlocks_when', 'route_note',
  'delineated_in', 'urls', 'terms_url', 'review_key',
];
const PREFIX_COPIES: Array<[file: string, pattern: RegExp]> = [
  ['src/scripts/generate-parquet.py', /^ANATOMY_TABLE_PREFIX = "([^"]+)"$/m],
  ['src/scripts/propagation-check.mjs', /^const ANATOMY_TABLE_PREFIX = '([^']+)';$/m],
];

const data = loadAnatomyData();
const { index } = loadAnatomyBundle();
const tables = loadAnatomyTables();
const kqlTables = getKqlTables();
const distinct = (rows: readonly AnatomyRow[], column: string): string[] => [...new Set(rows.map((row) => String(row[column])))];
const countWhere = (rows: readonly AnatomyRow[], test: (row: AnatomyRow) => boolean): number => rows.filter(test).length;
const everyRow = ANATOMY_TABLE_NAMES.flatMap((name) => tables[name]);

function listFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath.split(path.sep).join('/')];
  });
}

describe('anatomy tables built from the committed files', () => {
  it('builds the same tables through the query-table loader as through the atlas page\'s loader', () => {
    expect(tables).toEqual(buildAnatomyTables(data, curation));
  });

  it('names every label table the pipeline has shipped, so none is left out of the query tables', () => {
    const shipped = listFiles(ASSET_DIRECTORY).filter((filePath) => LABEL_TABLE_PATTERN.test(path.basename(filePath))).sort();
    expect(shipped.length).toBeGreaterThan(0);
    expect(Object.keys(LABEL_TABLES_BY_PATH).sort()).toEqual(shipped);
  });

  it('publishes every anatomy table in the query tables, and no other table under the anatomy prefix', () => {
    expect(getAvailableTableNames().filter(isAnatomyTableName).sort()).toEqual([...ANATOMY_TABLE_NAMES].sort());
    expect(Object.fromEntries(ANATOMY_TABLE_NAMES.map((name) => [name, kqlTables[name]]))).toEqual(tables);
  });

  it('holds one prefix: the copies in the parquet generator and the health check equal the library\'s', () => {
    const copies = PREFIX_COPIES.map(([file, pattern]) => pattern.exec(fs.readFileSync(file, 'utf-8'))?.[1]);
    expect(copies).toEqual(PREFIX_COPIES.map(() => ANATOMY_TABLE_PREFIX));
    expect(ANATOMY_TABLE_NAMES.filter((name) => !name.startsWith(ANATOMY_TABLE_PREFIX))).toEqual([]);
  });
});

describe('no anatomy table lacks its review state', () => {
  const statusSentences = [ANATOMY_INDEX_STATUS, CROSSWALK_STATUS, TECHNIQUE_REGIONS_STATUS, `${SOURCES_STATUS} ${VERDICTS_STATUS}`];

  it('opens every anatomy table in the query tables with the six draft-state columns, in order', () => {
    const anatomyNames = Object.keys(kqlTables).filter(isAnatomyTableName) as AnatomyTableName[];
    expect(anatomyNames.length).toBe(ANATOMY_TABLE_NAMES.length);
    expect(anatomyNames.filter((name) => Object.keys(kqlTables[name][0]).slice(0, listDraftColumns(name).length).join() !== listDraftColumns(name).join())).toEqual([]);
  });

  it('marks every row AI-drafted and unreviewed in a cell short enough for a preview, with one of the status sentences the files must carry', () => {
    const previewWidth = 60;
    expect(everyRow.length).toBeGreaterThan(0);
    expect(countWhere(everyRow, (row) => row.review_state !== 'ai_drafted_unreviewed' || row.review_mark !== 'AI-drafted, unreviewed')).toBe(0);
    expect('AI-drafted, unreviewed'.length).toBeLessThan(previewWidth);
    expect(countWhere(everyRow, (row) => !statusSentences.includes(String(row.status_sentence)))).toBe(0);
    expect(distinct(everyRow, 'status_sentence').sort()).toEqual([...statusSentences].sort());
  });

  it('names the drafter from each row\'s own source: every drafted row says ai, and only a row with nothing drafted is blank', () => {
    const drafterOf = (name: AnatomyTableName, row: AnatomyRow): unknown => row[DRAFTER_COLUMN_BY_TABLE[name]];
    const blank = ANATOMY_TABLE_NAMES.flatMap((name) => tables[name].filter((row) => drafterOf(name, row) !== 'ai').map((row) => [name, drafterOf(name, row), row.mapped_qif_record_count ?? row.named_term_count]));
    expect(blank.filter(([, drafter, draftedCount]) => drafter !== '' || draftedCount !== 0)).toEqual([]);
    expect(blank.filter(([name]) => name !== 'anatomy_structures' && name !== 'anatomy_technique_term_summary')).toEqual([]);
  });
});

describe('no column or vocabulary value states a drafted reading as an effect', () => {
  it('has no column name holding target, affect, attack, hits or cause', () => {
    expect(ANATOMY_TABLE_NAMES.flatMap((name) => Object.keys(tables[name][0]).filter((column) => OVERCLAIMING_WORD_PATTERN.test(column)).map((column) => `${name}.${column}`))).toEqual([]);
    expect(['target_region_id', 'affected_regions', 'attacks', 'hits_region', 'causes'].filter((column) => !OVERCLAIMING_WORD_PATTERN.test(column))).toEqual([]);
  });

  it('has no such word in any cell outside the columns that quote someone else\'s words, bar the one allowed role', () => {
    const offending = ANATOMY_TABLE_NAMES.flatMap((name) => tables[name].flatMap((row) => Object.entries(row)
      .filter(([column, cell]) => !VERBATIM_COLUMNS.includes(column) && typeof cell === 'string' && OVERCLAIMING_WORD_PATTERN.test(cell) && !ALLOWED_OVERCLAIMING_VALUES.includes(cell))
      .map(([column, cell]) => `${name}.${column}: ${cell}`)));
    expect([...new Set(offending)]).toEqual([]);
    expect(Object.values(EXPORTED_TERM_ROLES).filter((role) => OVERCLAIMING_WORD_PATTERN.test(role))).toEqual(ALLOWED_OVERCLAIMING_VALUES);
    expect(Object.values(MATCH_KINDS).filter((kind) => OVERCLAIMING_WORD_PATTERN.test(kind))).toEqual([]);
  });
});

describe('row counts tie back to the source files', () => {
  it('has one source row per registered source, each with a verdict and none confirmed by a person', () => {
    expect(tables.anatomy_sources).toHaveLength(data.sources.sources.length);
    expect(distinct(tables.anatomy_sources, 'source_id')).toEqual(data.sources.sources.map((source) => source.id));
    expect(countWhere(tables.anatomy_sources, (row) => row.human_confirmed !== false || row.license_read_by !== 'ai' || row.ai_verdict === '')).toBe(0);
  });

  it('has one structure per label of the shipped label tables and one row per shipped shape', () => {
    const labelKeys = [...data.labelTables.values()].flatMap((table) => table.labels.map((label) => `${table.atlas}:${label.id}`));
    const shapeCount = (data.manifest?.assets ?? []).reduce((count, asset) => count + asset.nodes.length, 0);
    expect(labelKeys.length).toBeGreaterThan(0);
    expect(distinct(tables.anatomy_structures, 'structure_key').sort()).toEqual([...labelKeys].sort());
    expect(tables.anatomy_structures).toHaveLength(shapeCount);
  });

  it('covers every QIF region in the crosswalk: a correspondence row or a no-geometry record for each', () => {
    const regionRows = tables.anatomy_crosswalk.filter((row) => row.subject_kind === 'region');
    expect(tables.anatomy_crosswalk).toHaveLength(data.crosswalk.rows.length + data.crosswalk.no_geometry.length);
    expect(distinct(regionRows, 'subject_id').sort()).toEqual(data.engineData.regions.map((region) => region.id).sort());
    expect(distinct(regionRows, 'subject_id')).toHaveLength(kqlTables.brain_regions.length);
    expect(countWhere(tables.anatomy_crosswalk, (row) => row.row_kind === 'no_geometry')).toBe(data.crosswalk.no_geometry.length);
  });

  it('has one summary row per technique entry and one term row per drafted link', () => {
    const entries = Object.values(data.techniqueRegions.techniques);
    expect(entries.length).toBeGreaterThan(0);
    expect(tables.anatomy_technique_term_summary).toHaveLength(entries.length);
    expect(distinct(tables.anatomy_technique_term_summary, 'technique_id').sort()).toEqual(Object.keys(data.techniqueRegions.techniques).sort());
    expect(tables.anatomy_technique_terms).toHaveLength(entries.reduce((count, entry) => count + entry.links.length, 0));
    expect(tables.anatomy_technique_terms.length).toBeGreaterThan(0);
  });
});

describe('every derived column equals the built index', () => {
  const assetsById = new Map(index.assets.map((asset) => [asset.id, asset]));
  const structuresByKey = new Map(index.structures.map((structure) => [structure.key, structure]));

  it('gives every source the index\'s verdict, licences, buildability and blockers', () => {
    const indexed = index.sources.map((source) => [source.id, source.verdict, source.stated_license_id, source.license_id, source.buildable, source.blockers.join(', '), source.clearance_reason]);
    expect(tables.anatomy_sources.map((row) => [row.source_id, row.ai_verdict, row.stated_license_id, row.handled_as_license_id, row.buildable, row.blockers, row.clearance_reason])).toEqual(indexed);
  });

  it('gives every crosswalk row its subject\'s geometry state and reason from the index', () => {
    const subjectOf = (row: AnatomyRow) => index.subjects.find((subject) => subject.kind === row.subject_kind && subject.id === row.subject_id);
    expect(tables.anatomy_crosswalk.length).toBeGreaterThan(0);
    expect(tables.anatomy_crosswalk.filter((row) => row.subject_geometry_state !== subjectOf(row)?.geometry.state || row.subject_geometry_reason !== (subjectOf(row)?.geometry.reason ?? ''))).toEqual([]);
    expect(distinct(tables.anatomy_crosswalk, 'subject_geometry_state').length).toBeGreaterThan(1);
  });

  it('says how a contained row is contained on exactly the contained rows, as the crosswalk file does', () => {
    const fileKinds = data.crosswalk.rows.map((row) => [row.subject_id, row.extent_match, row.contained_kind ?? '']);
    const correspondences = tables.anatomy_crosswalk.filter((row) => row.row_kind === 'atlas_correspondence');
    expect(correspondences.map((row) => [row.subject_id, row.extent_match, row.contained_kind])).toEqual(fileKinds);
    expect(correspondences.filter((row) => (row.extent_match === 'contained') !== (row.contained_kind !== ''))).toEqual([]);
  });

  it('names every crosswalk row\'s labels as the index names those structures, and says a shape is drawn only where a mesh ships', () => {
    const correspondences = tables.anatomy_crosswalk.filter((row) => row.row_kind === 'atlas_correspondence');
    const keysOf = (row: AnatomyRow): string[] => String(row.atlas_label_ids).split(', ').map((labelId) => `${row.atlas}:${labelId}`);
    const namesOf = (row: AnatomyRow): string => keysOf(row).map((key) => structuresByKey.get(key)?.name).join(' | ');
    const hasMesh = (row: AnatomyRow): boolean => keysOf(row).some((key) => (structuresByKey.get(key)?.nodes ?? []).some((node) => node.vertex_count > 0));
    expect(correspondences.length).toBeGreaterThan(0);
    expect(correspondences.filter((row) => row.atlas_label_names !== namesOf(row))).toEqual([]);
    expect(correspondences.filter((row) => row.has_drawn_shape !== hasMesh(row))).toEqual([]);
  });

  it('gives every structure row its asset\'s path, digest, licence and checks, and its mapped records, from the index', () => {
    const expected = index.structures.flatMap((structure) => structure.nodes.map((node) => {
      const asset = assetsById.get(node.asset_id);
      return [structure.key, structure.name, node.hemisphere, node.hemispheres_drawn, node.size_class, asset?.path, asset?.sha256, asset?.license_id, asset?.position_check, asset?.visual_check.state,
        structure.owners.map((owner) => `${owner.subject_kind}:${owner.subject_id}`).join(', '), structure.review_state.state, structure.check_status];
    }));
    expect(expected.length).toBeGreaterThan(0);
    expect(tables.anatomy_structures.map((row) => [row.structure_key, row.label_name, row.hemisphere, row.hemispheres_drawn, row.size_class, row.asset_path, row.asset_sha256, row.asset_license_id,
      row.position_check, row.visual_check_state, row.mapped_qif_record_keys, row.review_state, row.check_status])).toEqual(expected);
  });

  it('carries the index\'s own match and single-region flag for every link', () => {
    const indexed = index.techniques.flatMap((technique) => technique.links.map((link) =>
      [technique.id, link.term, MATCH_KINDS[link.resolution], link.lit ? link.resolved_region_id : '', link.lit ? '' : link.resolved_region_id ?? '', link.band_agrees, link.lit]));
    expect(tables.anatomy_technique_terms.map((row) => [row.technique_id, row.named_term, row.match_kind, row.single_region_id, row.alias_match_region_id, row.region_band_in_technique_bands, row.single_region_match])).toEqual(indexed);
  });

  it('counts each technique\'s terms as the index holds them', () => {
    const indexed = index.techniques.map((technique) => [technique.id, technique.scope, technique.links.length, technique.links.filter((link) => link.lit).length, technique.links.filter((link) => link.resolved_region_id === null).length]);
    const summary = tables.anatomy_technique_term_summary;
    expect(summary.map((row) => [row.technique_id, row.scope, row.named_term_count, row.single_region_term_count, row.no_region_term_count])).toEqual(indexed);
    const parts = ['single_region_term_count', 'region_in_other_band_term_count', 'stale_region_term_count', 'broader_or_narrower_term_count', 'no_region_term_count'];
    expect(summary.filter((row) => parts.reduce((sum, column) => sum + Number(row[column]), 0) !== row.named_term_count)).toEqual([]);
  });
});

describe('a term row never reads as a statement about a region', () => {
  const terms = tables.anatomy_technique_terms;

  it('quotes the catalog text that holds the term, on every row', () => {
    expect(countWhere(terms, (row) => row.quoted_text === '' || !String(row.quoted_text).includes(String(row.named_term)) || row.quote_state !== 'quote_found')).toBe(0);
    expect(countWhere(tables.anatomy_crosswalk, (row) => row.row_kind === 'atlas_correspondence' && (row.quoted_text === '' || row.rationale === ''))).toBe(0);
  });

  it('fills single_region_id on exactly the single-region matches, so a filter on it returns nothing else', () => {
    const { rows, error } = executeQuery('anatomy_technique_terms | where single_region_id != ""', kqlTables, buildIndexes(kqlTables));
    expect(error).toBeNull();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((row) => row.single_region_match !== true || !['region_id', 'synonym'].includes(String(row.match_kind)) || row.region_band_in_technique_bands !== true)).toEqual([]);
    expect(countWhere(terms, (row) => (row.single_region_id !== '') !== (row.single_region_match === true))).toBe(0);
  });

  it('never holds a region id in both columns, and holds none for a word the table does not list', () => {
    expect(countWhere(terms, (row) => row.single_region_id !== '' && row.alias_match_region_id !== '')).toBe(0);
    expect(countWhere(terms, (row) => (row.match_kind === 'no_region_in_table') !== (row.single_region_id === '' && row.alias_match_region_id === ''))).toBe(0);
    expect(countWhere(terms, (row) => row.single_region_match === false)).toBeGreaterThan(countWhere(terms, (row) => row.single_region_match === true));
  });

  it('gives each term the role whose sentence the generator wrote into the data file, under its exported name', () => {
    const toPointer = (field: AnatomyRow[string]): string => `/${String(field).replaceAll('.', '/')}`;
    const curationRoles = Object.keys(EXPORTED_TERM_ROLES) as CurationRole[];
    const curationRoleOf = (row: AnatomyRow): CurationRole | undefined => curationRoles.find((role) => EXPORTED_TERM_ROLES[role] === row.ai_assigned_term_role);
    expect(curationRoles.sort()).toEqual(Object.keys(LINK_ROLES).sort());
    expect(terms.filter((row) => curationRoleOf(row) === undefined || renderLinkRationale(curationRoleOf(row), row.named_term, toPointer(row.quoted_field)) !== row.rationale)).toEqual([]);
  });
});

describe('Data Studio descriptions and presets', () => {
  const descriptions = describeAnatomyTables(kqlTables);
  const descriptionOf = (name: AnatomyTableName): string => descriptions[name].description;
  const { anatomy_crosswalk: crosswalk, anatomy_technique_terms: terms, anatomy_technique_term_summary: summary } = tables;
  /** What each table must not be read as. Removing the clause from a description fails here. */
  const caveats: Record<AnatomyTableName, string> = {
    anatomy_sources: 'they are not legal advice or a clearance for your own use',
    anatomy_structures: 'a row is not a statement of where a QIF region is',
    anatomy_crosswalk: 'no neuroanatomist has checked them',
    anatomy_technique_terms: 'not a list of targets: a row says the text uses the word, not that the technique acts on a region',
    anatomy_technique_term_summary: 'a missing region is not evidence that a technique spares it',
  };

  it('says of every anatomy table that it is AI-drafted and unreviewed, and what it must not be read as', () => {
    expect(Object.keys(descriptions).sort()).toEqual([...ANATOMY_TABLE_NAMES].sort());
    expect(ANATOMY_TABLE_NAMES.filter((name) => !descriptionOf(name).includes('AI-drafted and unreviewed'))).toEqual([]);
    expect(ANATOMY_TABLE_NAMES.filter((name) => !descriptionOf(name).includes(caveats[name]))).toEqual([]);
  });

  it('computes every count it states from the rows', () => {
    const correspondences = crosswalk.filter((row) => row.row_kind === 'atlas_correspondence');
    const namesOneRegion = (row: AnatomyRow): boolean => ['region_id', 'synonym'].includes(String(row.match_kind));
    const single = countWhere(terms, (row) => row.single_region_match === true);
    const otherBand = countWhere(terms, (row) => namesOneRegion(row) && row.region_band_in_technique_bands === false);
    const none = countWhere(terms, (row) => row.match_kind === 'no_region_in_table');
    expect(single + otherBand + none).toBeLessThan(terms.length);
    expect(descriptionOf('anatomy_sources')).toContain(`The ${tables.anatomy_sources.length} upstream sources registered`);
    expect(descriptionOf('anatomy_structures')).toContain(`The ${distinct(tables.anatomy_structures, 'structure_key').length} atlas labels shipped`);
    expect(descriptionOf('anatomy_structures')).toContain(`(${countWhere(tables.anatomy_structures, (row) => row.has_drawn_shape === false)} rows are location markers with no drawn shape)`);
    expect(descriptionOf('anatomy_crosswalk')).toContain(`the ${distinct(crosswalk, 'subject_id').length} QIF brain regions`);
    expect(descriptionOf('anatomy_crosswalk')).toContain(`${distinct(correspondences, 'subject_id').length} regions have a row and ${crosswalk.length - correspondences.length} have a record`);
    const sameExtent = countWhere(correspondences, (row) => row.extent_match === 'same');
    expect(descriptionOf('anatomy_crosswalk')).toContain(sameExtent === 0 ? `none of the ${correspondences.length} rows grades the shape` : `only ${sameExtent} of ${correspondences.length} rows grade the shape`);
    expect(descriptionOf('anatomy_technique_terms')).toContain(
      `Only ${single} of ${terms.length} words match exactly one listed region whose band the technique also carries; ${otherBand} match a region in a band the technique does not carry, `
      + `${terms.length - single - otherBand - none} match only a broader or narrower region, and ${none} match none.`);
    expect(descriptionOf('anatomy_technique_term_summary')).toContain(`only ${countWhere(summary, (row) => Number(row.single_region_term_count) > 0)} of ${summary.length} techniques have a word`);
    expect(descriptionOf('anatomy_technique_term_summary')).toContain(`and ${countWhere(summary, (row) => row.named_term_count === 0)} have no word drafted`);
  });

  it('refuses to describe the tables when one is missing', () => {
    const { anatomy_crosswalk: _removed, ...rest } = kqlTables;
    expect(() => describeAnatomyTables(rest)).toThrow('anatomy_crosswalk: the query tables hold no rows for this anatomy table');
  });

  it('runs every preset against the real tables; each projects the review state, the match and the quoted words', () => {
    const indexes = buildIndexes(kqlTables);
    expect(ANATOMY_PRESETS.length).toBeGreaterThan(0);
    expect(ANATOMY_PRESETS.filter((preset) => /light/i.test(preset.label))).toEqual([]);
    for (const preset of ANATOMY_PRESETS) {
      const { rows, error } = executeQuery(preset.query, kqlTables, indexes);
      expect(error).toBeNull();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.filter((row) => row.review_state !== 'ai_drafted_unreviewed' || typeof row.quoted_text !== 'string' || row.quoted_text === '')).toEqual([]);
      expect(rows.filter((row) => typeof (row.match_kind ?? row.extent_match) !== 'string')).toEqual([]);
    }
  });
});

describe('region links stay out of the registrar\'s other exports', () => {
  it('adds no region column to the techniques table', () => {
    expect(Object.keys(kqlTables.techniques[0]).filter((column) => /region|anatomy|named_term/.test(column))).toEqual([]);
  });

  it('is not read by the Python SDK, the STIX export or the public API', () => {
    const exportFiles = [...listFiles(SDK_DIRECTORY).filter((filePath) => filePath.endsWith('.py')), ...listFiles(API_DIRECTORY)];
    expect(exportFiles.length).toBeGreaterThan(0);
    expect(exportFiles.filter((filePath) => ANATOMY_REFERENCE_PATTERN.test(fs.readFileSync(filePath, 'utf-8')))).toEqual([]);
    expect(fs.readdirSync(path.join(SDK_DIRECTORY, 'data')).filter((name) => name.includes('anatomy'))).toEqual([]);
  });
});
