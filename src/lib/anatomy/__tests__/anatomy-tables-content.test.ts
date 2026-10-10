// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import curation from '@shared/scripts/technique-region-curation.json';
import { LINK_ROLES, renderLinkRationale } from '@shared/scripts/draft-technique-regions.mjs';
import { ANATOMY_PRESETS } from '@/components/bci/anatomy-presets';
import { loadAnatomyBundle, loadAnatomyData } from '@/components/atlas-scene/load-anatomy-data';
import { ANATOMY_DATASET_DESCRIPTIONS } from '@/components/data-studio/anatomy-dataset-descriptions';
import { buildIndexes, executeQuery } from '@/lib/kql-engine';
import { getAvailableTableNames, getKqlTables } from '@/lib/kql-tables';
import { ANATOMY_TABLE_NAMES, ANATOMY_TABLE_PREFIX, buildAnatomyTables } from '../anatomy-tables';
import { LABEL_TABLES_BY_PATH, loadAnatomyTables } from '../load-anatomy-tables';
import { ANATOMY_INDEX_STATUS, CROSSWALK_STATUS, SOURCES_STATUS, TECHNIQUE_REGIONS_STATUS, VERDICTS_STATUS } from '../status-sentences';
import { DRAFT_COLUMNS, type AnatomyRow } from '../table-columns';

const ASSET_DIRECTORY = 'src/site/atlas-assets';
const LABEL_TABLE_PATTERN = /^labels-[a-z0-9_]+\.json$/;
const SDK_DIRECTORY = 'datalake/qtara/src/qtara';
const API_DIRECTORY = 'src/pages/api';
/** Column names that would state a drafted reading as a fact. */
const OVERCLAIMING_COLUMN_PATTERN = /^(target|targets|target_region|target_regions|region_id|region_ids|affected_region|attacks_region)$/;
const ANATOMY_REFERENCE_PATTERN = /qif-anatomy-|anatomy_technique|anatomy-tables|technique-region/;

const data = loadAnatomyData();
const { index } = loadAnatomyBundle();
const tables = loadAnatomyTables();
const kqlTables = getKqlTables();
const columnsOf = (rows: readonly AnatomyRow[]): string[] => Object.keys(rows[0]);
const distinct = (rows: readonly AnatomyRow[], column: string): string[] => [...new Set(rows.map((row) => String(row[column])))];
const countWhere = (rows: readonly AnatomyRow[], test: (row: AnatomyRow) => boolean): number => rows.filter(test).length;

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
    expect(getAvailableTableNames().filter((name) => name.startsWith(ANATOMY_TABLE_PREFIX)).sort()).toEqual([...ANATOMY_TABLE_NAMES].sort());
    expect(Object.fromEntries(ANATOMY_TABLE_NAMES.map((name) => [name, kqlTables[name]]))).toEqual(tables);
  });
});

describe('no anatomy table lacks its review state', () => {
  const statusSentences = [ANATOMY_INDEX_STATUS, CROSSWALK_STATUS, TECHNIQUE_REGIONS_STATUS, `${SOURCES_STATUS} ${VERDICTS_STATUS}`];

  it('has every draft column on every anatomy table in the query tables', () => {
    const anatomyNames = Object.keys(kqlTables).filter((name) => name.startsWith(ANATOMY_TABLE_PREFIX));
    expect(anatomyNames.length).toBe(ANATOMY_TABLE_NAMES.length);
    expect(anatomyNames.flatMap((name) => DRAFT_COLUMNS.filter((column) => !Object.hasOwn(kqlTables[name][0], column)).map((column) => `${name}.${column}`))).toEqual([]);
  });

  it('marks every row AI-drafted and unreviewed, with one of the status sentences the files must carry', () => {
    const rows = ANATOMY_TABLE_NAMES.flatMap((name) => tables[name]);
    expect(rows.length).toBeGreaterThan(0);
    expect(countWhere(rows, (row) => row.drafted_by !== 'ai' || row.review_state !== 'ai_drafted_unreviewed' || row.review_mark !== 'AI-drafted, unreviewed')).toBe(0);
    expect(countWhere(rows, (row) => !statusSentences.includes(String(row.status_sentence)))).toBe(0);
    expect(distinct(rows, 'status_sentence').sort()).toEqual([...statusSentences].sort());
  });

  it('has no column whose name states a drafted reading as a fact', () => {
    expect(ANATOMY_TABLE_NAMES.flatMap((name) => columnsOf(tables[name]).filter((column) => OVERCLAIMING_COLUMN_PATTERN.test(column)))).toEqual([]);
  });
});

describe('row counts tie back to the source files', () => {
  it('has one source row per registered source, each with a verdict and none confirmed by a person', () => {
    expect(tables.anatomy_sources).toHaveLength(data.sources.sources.length);
    expect(distinct(tables.anatomy_sources, 'source_id')).toEqual(data.sources.sources.map((source) => source.id));
    expect(countWhere(tables.anatomy_sources, (row) => row.human_confirmed !== false || row.licence_read_by !== 'ai' || row.verdict === '')).toBe(0);
    expect(countWhere(tables.anatomy_sources, (row) => row.buildable === true)).toBe(index.sources.filter((source) => source.buildable).length);
  });

  it('has one structure per label of the shipped label tables and one row per shipped shape', () => {
    const labelKeys = [...data.labelTables.values()].flatMap((table) => table.labels.map((label) => `${table.atlas}:${label.id}`));
    const shapeCount = (data.manifest?.assets ?? []).reduce((count, asset) => count + asset.nodes.length, 0);
    expect(labelKeys.length).toBeGreaterThan(0);
    expect(distinct(tables.anatomy_structures, 'structure_key').sort()).toEqual([...labelKeys].sort());
    expect(distinct(tables.anatomy_structures, 'structure_key')).toHaveLength(index.structures.length);
    expect(tables.anatomy_structures).toHaveLength(shapeCount);
    expect(countWhere(tables.anatomy_structures, (row) => !/^[0-9a-f]{64}$/.test(String(row.asset_sha256)) || row.position_check === '')).toBe(0);
  });

  it('covers every QIF region in the crosswalk: a correspondence row or a no-geometry record for each', () => {
    const regionRows = tables.anatomy_crosswalk.filter((row) => row.subject_kind === 'region');
    expect(tables.anatomy_crosswalk).toHaveLength(data.crosswalk.rows.length + data.crosswalk.no_geometry.length);
    expect(distinct(regionRows, 'subject_id').sort()).toEqual(data.engineData.regions.map((region) => region.id).sort());
    expect(distinct(regionRows, 'subject_id')).toHaveLength(kqlTables.brain_regions.length);
    expect(countWhere(tables.anatomy_crosswalk, (row) => row.row_kind === 'no_geometry')).toBe(data.crosswalk.no_geometry.length);
  });

  it('has one scope row per technique entry and one term row per drafted link', () => {
    const entries = Object.values(data.techniqueRegions.techniques);
    expect(entries.length).toBeGreaterThan(0);
    expect(tables.anatomy_technique_scopes).toHaveLength(entries.length);
    expect(distinct(tables.anatomy_technique_scopes, 'technique_id').sort()).toEqual(Object.keys(data.techniqueRegions.techniques).sort());
    expect(tables.anatomy_technique_terms).toHaveLength(entries.reduce((count, entry) => count + entry.links.length, 0));
    expect(tables.anatomy_technique_terms.length).toBeGreaterThan(0);
  });
});

describe('a term row never reads as a target', () => {
  const terms = tables.anatomy_technique_terms;

  it('quotes the catalog text that holds the term, on every row', () => {
    expect(countWhere(terms, (row) => row.quoted_text === '' || !String(row.quoted_text).includes(String(row.named_term)) || row.quote_state !== 'quote_found')).toBe(0);
    expect(countWhere(tables.anatomy_crosswalk, (row) => row.row_kind === 'atlas_correspondence' && (row.quoted_text === '' || row.rationale === ''))).toBe(0);
  });

  it('carries the index\'s own resolution and lighting for every link', () => {
    const indexed = index.techniques.flatMap((technique) => technique.links.map((link) => [technique.id, link.term, link.resolution, link.resolved_region_id ?? '', link.band_agrees, link.lit]));
    expect(terms.map((row) => [row.technique_id, row.named_term, row.resolution, row.resolved_region_id, row.band_agrees, row.lights_region])).toEqual(indexed);
  });

  it('lights a region only for an id or synonym resolution that agrees with the band tags, and names no region for an unlisted word', () => {
    expect(countWhere(terms, (row) => row.lights_region === true && (!['id', 'synonym'].includes(String(row.resolution)) || row.band_agrees !== true || row.resolved_region_id === ''))).toBe(0);
    expect(countWhere(terms, (row) => (row.resolution === 'unclassified') !== (row.resolved_region_id === ''))).toBe(0);
    expect(countWhere(terms, (row) => row.lights_region === false)).toBeGreaterThan(countWhere(terms, (row) => row.lights_region === true));
  });

  it('gives each term the role whose sentence the generator wrote into the data file', () => {
    const toPointer = (field: AnatomyRow[string]): string => `/${String(field).replaceAll('.', '/')}`;
    expect(distinct(terms, 'term_role').filter((role) => !Object.hasOwn(LINK_ROLES, role))).toEqual([]);
    expect(terms.filter((row) => renderLinkRationale(row.term_role, row.named_term, toPointer(row.quoted_field)) !== row.rationale)).toEqual([]);
  });

  it('agrees with the scope table on how many techniques light a region', () => {
    const lightingTechniques = distinct(terms.filter((row) => row.lights_region === true), 'technique_id');
    expect(countWhere(tables.anatomy_technique_scopes, (row) => Number(row.lit_region_count) > 0)).toBe(lightingTechniques.length);
    expect(countWhere(tables.anatomy_technique_scopes, (row) => row.scope === 'band_level' && (row.band_level_reason === '' || row.named_term_count !== 0))).toBe(0);
  });
});

describe('Data Studio descriptions and presets', () => {
  const descriptionOf = (name: typeof ANATOMY_TABLE_NAMES[number]): string => ANATOMY_DATASET_DESCRIPTIONS[name].description;
  const { anatomy_crosswalk: crosswalk, anatomy_technique_terms: terms, anatomy_technique_scopes: scopes } = tables;

  it('says of every anatomy table that it is AI-drafted and unreviewed', () => {
    expect(Object.keys(ANATOMY_DATASET_DESCRIPTIONS).sort()).toEqual([...ANATOMY_TABLE_NAMES].sort());
    expect(ANATOMY_TABLE_NAMES.filter((name) => !descriptionOf(name).includes('AI-drafted and unreviewed'))).toEqual([]);
  });

  it('states counts that match the data', () => {
    const correspondences = crosswalk.filter((row) => row.row_kind === 'atlas_correspondence');
    expect(descriptionOf('anatomy_sources')).toContain(`The ${tables.anatomy_sources.length} upstream sources registered`);
    expect(descriptionOf('anatomy_structures')).toContain(`The ${distinct(tables.anatomy_structures, 'structure_key').length} atlas labels shipped`);
    expect(descriptionOf('anatomy_structures')).toContain(`(${countWhere(tables.anatomy_structures, (row) => row.has_mesh === false)} rows are location markers with no mesh)`);
    expect(descriptionOf('anatomy_crosswalk')).toContain(`the ${distinct(crosswalk, 'subject_id').length} QIF brain regions`);
    expect(descriptionOf('anatomy_crosswalk')).toContain(`${distinct(correspondences, 'subject_id').length} regions have a row and ${crosswalk.length - correspondences.length} have a record`);
    expect(descriptionOf('anatomy_crosswalk')).toContain(`only ${countWhere(correspondences, (row) => row.extent_match === 'same')} of ${correspondences.length} rows`);
    expect(descriptionOf('anatomy_technique_terms')).toContain(`only ${countWhere(terms, (row) => row.lights_region === true)} of ${terms.length} terms`);
    expect(descriptionOf('anatomy_technique_scopes')).toContain(`only ${countWhere(scopes, (row) => Number(row.lit_region_count) > 0)} of ${scopes.length} techniques have a term that resolves to one region in agreement with their band tags`);
    expect(descriptionOf('anatomy_technique_scopes')).toContain(`${countWhere(scopes, (row) => row.scope === 'band_level')} stay at band level`);
  });

  it('runs every preset against the real tables and returns the review state on every row', () => {
    const indexes = buildIndexes(kqlTables);
    expect(ANATOMY_PRESETS.length).toBeGreaterThan(0);
    for (const preset of ANATOMY_PRESETS) {
      const { rows, error } = executeQuery(preset.query, kqlTables, indexes);
      expect(error).toBeNull();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.filter((row) => row.review_state !== 'ai_drafted_unreviewed')).toEqual([]);
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
