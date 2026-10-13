import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAnatomyFiles } from '@/lib/anatomy/anatomy-inputs';
import { buildAnatomyBundle } from '@/lib/anatomy/build-anatomy-index';
import { buildRawFiles } from '@/lib/anatomy/__tests__/raw-files-fixture';
import { buildAnatomyTables } from '@/lib/anatomy/anatomy-tables';
import { getKqlTables } from '@/lib/kql-tables';
import { ANATOMY_TABLE_NAMES } from '@/lib/anatomy/table-names';
import {
  ANATOMY_DATA_FILE_KEY_MARKERS, ANATOMY_PAYLOAD_MARKERS, ANATOMY_TABLE_KEY_MARKERS, ANATOMY_TABLE_VALUE_MARKERS, UNMARKED_ANATOMY_COLUMN_NAMES,
  findAnatomyPayload, findAnatomyPayloadInScript,
} from '../../../scripts/find-anatomy-payload.mjs';
import { loadAnatomyBundle } from '../load-anatomy-data';

/** The committed seed data, and a fixture build that has rows, links and assets, so every section is populated. */
const seed = loadAnatomyBundle();
const populated = buildAnatomyBundle(parseAnatomyFiles(buildRawFiles()));
const index = JSON.parse(populated.indexJson) as Record<string, unknown[]>;
const evidence = JSON.parse(populated.evidenceJson) as Record<string, unknown[]>;
const seedIndex = JSON.parse(seed.indexJson) as Record<string, unknown[]>;
/** The exported tables: the committed ones, and a fixture build whose roles cover the ones the fixture's links use. */
const seedTables = Object.fromEntries(ANATOMY_TABLE_NAMES.map((name) => [name, getKqlTables()[name]]));
const FIXTURE_CURATION = { techniques: { 'QIF-T9001': { links: [{ term: 'stn', role: 'pathway_stage' }, { term: 'thalamus', role: 'delivery_route' }, { term: 'motor_strip', role: 'action_target' }] } } };
const populatedTables = buildAnatomyTables(parseAnatomyFiles(buildRawFiles()), FIXTURE_CURATION);
/** The projection an independent verifier embedded in the Lab page with every gate green: four renamed keys per term. */
const renamedTerms = seedTables.anatomy_technique_terms.map((row) => ({ technique: row.technique_id, word: row.named_term, role: row.ai_assigned_term_role, region: row.single_region_id || row.other_match_region_id }));

const DATA_FILE_PATHS = [
  ...fs.readdirSync('datalake').filter((name) => /^qif-anatomy-.*\.json$/.test(name)).map((name) => `datalake/${name}`),
  'src/site/atlas-assets/manifest.json',
];

function listKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(listKeys);
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...listKeys(child)]);
}

const dataFileKeys = new Set(DATA_FILE_PATHS.flatMap((filePath) => listKeys(JSON.parse(fs.readFileSync(filePath, 'utf-8')))));

const pageWith = (body: string): string => `<!doctype html><html><head><title>TARA Lab</title></head><body>${body}</body></html>`;
const escapeAttribute = (text: string): string => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const asScript = (value: unknown): string => pageWith(`<script type="application/json">${JSON.stringify(value)}</script>`);
const asIslandProp = (value: unknown): string => pageWith(`<astro-island props="${escapeAttribute(JSON.stringify({ model: [0, value] }))}"></astro-island>`);

/** Renames every key to a short one, as a hand-made view model would, and keeps every value. */
function shortenKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shortenKeys);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(Object.entries(value).map(([, child], position) => [`k${position}`, shortenKeys(child)]));
}

function renameKey(record: unknown, from: string, to: string): unknown {
  const { [from]: moved, ...rest } = record as Record<string, unknown>;
  return { ...rest, [to]: moved };
}

const PROJECTIONS: Array<[string, unknown]> = [
  ['the whole index', index],
  ['the whole evidence file', evidence],
  ['the techniques alone', index.techniques],
  ['one technique\'s links alone', (index.techniques[0] as { links: unknown[] }).links],
  ['the structures alone', index.structures],
  ['one structure\'s owners alone', (index.structures[0] as { owners: unknown[] }).owners],
  ['the subjects alone', index.subjects],
  ['the layers alone', index.layers],
  ['the layers of the seed build alone', seedIndex.layers],
  ['the sources alone', index.sources],
  ['the sources with one key renamed', index.sources.map((source) => renameKey(source, 'clearance_reason', 'why'))],
  ['the sources of the seed build with two keys renamed', seedIndex.sources.map((source) => renameKey(renameKey(source, 'clearance_reason', 'why'), 'stated_license_id', 'stated'))],
  ['the assets alone', index.assets],
  ['a view model of the assets with every key shortened', shortenKeys(index.assets)],
  ['the licence verdicts alone', evidence.verdicts],
  ['the crosswalk evidence alone', evidence.crosswalk_rows],
  ['the link evidence alone', evidence.technique_links],
  ['the techniques of the seed build alone', seedIndex.techniques],
  ['the subjects of the seed build alone', seedIndex.subjects],
  ['a view model of the structures with every key shortened', shortenKeys(index.structures)],
  ['a view model of the techniques with every key shortened', shortenKeys(index.techniques)],
  ['a view model of the seed subjects with every key shortened', shortenKeys(seedIndex.subjects)],
  ['a view model of the seed sources with every key shortened', shortenKeys(seedIndex.sources)],
  ['a view model of the seed layers with every key shortened', shortenKeys(seedIndex.layers)],
  ...ANATOMY_TABLE_NAMES.map((name): [string, unknown] => [`the ${name} table`, seedTables[name]]),
  ['the term table of a fixture build with every key shortened', shortenKeys(populatedTables.anatomy_technique_terms)],
  ['the crosswalk table of a fixture build with every key shortened', shortenKeys(populatedTables.anatomy_crosswalk)],
  ['the term table projected to four renamed keys (technique, word, role, region)', renamedTerms],
  ['one such projected term', renamedTerms.slice(0, 1)],
];

describe('findAnatomyPayload', () => {
  it('uses only markers that occur in a built index or evidence file', () => {
    const served = seed.indexJson + seed.evidenceJson + populated.indexJson + populated.evidenceJson + 'datalake/qif-anatomy-sources.json';
    expect(ANATOMY_PAYLOAD_MARKERS.length).toBeGreaterThan(10);
    expect(ANATOMY_PAYLOAD_MARKERS.filter((marker: string) => !served.includes(marker))).toEqual([]);
  });

  it('puts every column of the exported tables in exactly one list: a key marker, or a name left unmarked on purpose', () => {
    const columns = [...new Set(ANATOMY_TABLE_NAMES.flatMap((name) => Object.keys(seedTables[name][0])))].sort();
    expect([...ANATOMY_TABLE_KEY_MARKERS, ...UNMARKED_ANATOMY_COLUMN_NAMES].sort()).toEqual(columns);
    const perTable = ANATOMY_TABLE_NAMES.map((name) => Object.keys(seedTables[name][0]).filter((column) => ANATOMY_TABLE_KEY_MARKERS.includes(column)).length);
    expect(Math.min(...perTable)).toBeGreaterThanOrEqual(3);
  });

  it('marks only names that are several words and that nothing but the tables uses', () => {
    const otherTables = getKqlTables();
    const otherColumns = new Set(Object.keys(otherTables).filter((name) => !name.startsWith('anatomy_')).flatMap((name) => Object.keys(otherTables[name][0] ?? {})));
    const servedKeys = new Set([...listKeys(seedIndex), ...listKeys(JSON.parse(seed.evidenceJson)), ...listKeys(index), ...listKeys(evidence)]);
    expect(ANATOMY_TABLE_KEY_MARKERS.filter((marker: string) => !marker.includes('_') || otherColumns.has(marker) || servedKeys.has(marker))).toEqual([]);
    expect(ANATOMY_DATA_FILE_KEY_MARKERS.filter((marker: string) => !marker.includes('_') || servedKeys.has(marker) || !dataFileKeys.has(marker))).toEqual([]);
    expect(ANATOMY_TABLE_VALUE_MARKERS.filter((value: string) => !JSON.stringify(seedTables).includes(`"${value}"`))).toEqual([]);
  });

  it('finds nothing in a page that carries only the index pin', () => {
    expect(findAnatomyPayload(asIslandProp(seed.indexPin))).toEqual([]);
    expect(findAnatomyPayload(asScript(populated.indexPin))).toEqual([]);
    expect(findAnatomyPayload(pageWith('<h1>TARA Lab</h1><p>Threat analysis and risk assessment for neural devices.</p>'))).toEqual([]);
  });

  it.each(PROJECTIONS)('finds %s inlined in a script tag', (_name, projection) => {
    expect(findAnatomyPayload(asScript(projection)).length).toBeGreaterThan(0);
  });

  it.each(PROJECTIONS)('finds %s serialised into an island prop, where every quote is an entity', (_name, projection) => {
    expect(findAnatomyPayload(asIslandProp(projection)).length).toBeGreaterThan(0);
  });

  it('decodes quote entities and script-string escapes: the key-and-value marker is found only after decoding', () => {
    const quotedMarker = '"state":"ai_drafted_unreviewed"';
    expect(ANATOMY_PAYLOAD_MARKERS).toContain(quotedMarker);
    const reviewStates = index.subjects.map((subject) => (subject as { review_state: unknown }).review_state);
    const encodings = [
      asIslandProp(reviewStates),
      pageWith(`<script>window.__states = ${JSON.stringify(JSON.stringify(reviewStates))};</script>`),
      pageWith(`<div data-states="${JSON.stringify(reviewStates).replaceAll('"', '&#34;')}"></div>`),
      pageWith(`<div data-states="${JSON.stringify(reviewStates).replaceAll('"', '&#x22;')}"></div>`),
    ];
    for (const page of encodings) {
      expect(page).not.toContain(quotedMarker);
      expect(findAnatomyPayload(page)).toContain(quotedMarker);
    }
  });

  it('finds a single anatomy data file name', () => {
    expect(findAnatomyPayload(pageWith('<a href="/datalake/qif-anatomy-verdicts.json">x</a>'))).toEqual(['qif-anatomy-']);
  });
});

/** How a bundler writes data into a chunk: an object literal with bare keys, or a JSON string handed to JSON.parse. */
const asObjectLiteral = (value: unknown): string => `const data=${JSON.stringify(value).replace(/"([A-Za-z_$][\w$]*)":/g, '$1:')};export{data as default};`;
const asParsedJson = (value: unknown): string => `const data=JSON.parse(${JSON.stringify(JSON.stringify(value))});export{data as default};`;

describe('findAnatomyPayloadInScript', () => {
  it.each(ANATOMY_TABLE_NAMES)('finds the %s table bundled into a script, as an object literal or as parsed JSON', (name) => {
    expect(findAnatomyPayloadInScript(asObjectLiteral(seedTables[name])).length).toBeGreaterThanOrEqual(3);
    expect(findAnatomyPayloadInScript(asParsedJson(seedTables[name])).length).toBeGreaterThanOrEqual(3);
  });

  it('finds the whole generated query-table file bundled into a script', () => {
    expect(findAnatomyPayloadInScript(asParsedJson(getKqlTables()))).toEqual(expect.arrayContaining(['single_region_match', 'mapping_review_state', 'handled_as_license_id', 'named_as_acted_on']));
  });

  it.each(['datalake/qif-anatomy-sources.json', 'datalake/qif-anatomy-crosswalk.json', 'datalake/qif-anatomy-technique-regions.json', 'src/site/atlas-assets/manifest.json'])('finds %s bundled into a script', (filePath) => {
    expect(findAnatomyPayloadInScript(asParsedJson(JSON.parse(fs.readFileSync(filePath, 'utf-8')))).length).toBeGreaterThan(0);
  });

  it('is not tripped by the real three.js build, whose names hold the tables\' ordinary words', () => {
    const three = fs.readFileSync('node_modules/three/build/three.core.js', 'utf-8') + fs.readFileSync('node_modules/three/build/three.module.js', 'utf-8');
    expect(three).toContain('HemisphereLight');
    expect(findAnatomyPayloadInScript(three)).toEqual([]);
  });

  it('is not tripped by the registrar or the CVE mapping bundled into a script', () => {
    const registrar = fs.readFileSync('datalake/qtara-registrar.json', 'utf-8');
    const cveMapping = fs.readFileSync('datalake/cve-technique-mapping.json', 'utf-8');
    expect(registrar).toMatch(/grant(ed|s)/);
    expect(cveMapping).toMatch(/"(urls|source_id|grant)"/);
    expect(findAnatomyPayloadInScript(asParsedJson(JSON.parse(registrar)))).toEqual([]);
    expect(findAnatomyPayloadInScript(asObjectLiteral(JSON.parse(cveMapping)))).toEqual([]);
  });

  it('is not tripped by a script that reads the anatomy index: its field names are not table markers', () => {
    const indexReader = 'function mark(s){return{review_state:s.review_state,check_status:s.check_status,position_check:s.position_check,hemisphere:s.hemisphere,structure_key:s.key}}';
    expect(findAnatomyPayloadInScript(indexReader)).toEqual([]);
    expect(findAnatomyPayloadInScript(asParsedJson(seedIndex))).toEqual([]);
  });

  it('matches a marker only as a whole key or a whole quoted value', () => {
    expect(findAnatomyPayloadInScript('const not_single_region_match_here=1;const text="single_region_match is a column";')).toEqual([]);
    expect(findAnatomyPayloadInScript('const row={single_region_match:!0};')).toEqual(['single_region_match']);
    expect(findAnatomyPayloadInScript("const row={'single_region_match' : true};")).toEqual(['single_region_match']);
    expect(findAnatomyPayloadInScript('const note="roles such as named_as_acted_on are AI-assigned";')).toEqual([]);
    expect(findAnatomyPayloadInScript('const role="named_as_acted_on";')).toEqual(['named_as_acted_on']);
  });

  it('cannot see a projection with no marked key or value, an array of bare values, or an encoded payload: the source walk is what stops those', () => {
    const terms = seedTables.anatomy_technique_terms;
    const threeFields = terms.map((row) => ({ technique: row.technique_id, word: row.named_term, region: row.single_region_id || row.other_match_region_id }));
    const bareValues = terms.map((row) => [row.technique_id, row.named_term, row.single_region_id]);
    const encoded = Buffer.from(JSON.stringify(terms)).toString('base64');
    expect(findAnatomyPayloadInScript(asObjectLiteral(threeFields))).toEqual([]);
    expect(findAnatomyPayload(asScript(bareValues))).toEqual([]);
    expect(findAnatomyPayloadInScript(`const packed="${encoded}";`)).toEqual([]);
  });
});
