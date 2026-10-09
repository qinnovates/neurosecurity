import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import atlas from '@shared/qif-brain-bci-atlas.json';
import {
  INFORMAL_REGION_NAMES,
  LEGACY_NAME_PATTERNS,
  REGION_TABLE_MARK,
  compareWithRecorded,
  findLegacyMarks,
  findPlacedRegions,
  listRepositoryFiles,
  scanFiles,
  scanLegacyGeometry,
  type RegionVocabulary,
} from '@/lib/legacy-geometry-scan';
import {
  RECORDED_LEGACY_FILES,
  RECORDED_LEGACY_GEOMETRY,
  RECORDED_NOT_GEOMETRY,
  RECORDED_STALE_BUILD_FILES,
} from './legacy-geometry-recorded';

/**
 * A ratchet on the old, hand-placed brain geometry. legacy-geometry-recorded.ts records
 * where it is today. Nothing may be added. When a later change removes an entry from the
 * code, this test fails until the entry is deleted from the record too, so the record only
 * ever shrinks.
 *
 * What the scan finds: the old constant names; any spelling of the old model's file name;
 * and a file in which three or more region names (ids and aliases from the atlas data, band
 * ids, and a short list of informal names) each have a numeric position within 160
 * characters. A name counts when it is a quoted string, a property key or a declared
 * variable. A position is a two- or three-number array, a Vector2 or Vector3, a
 * position.set call, or a named x, y, cx or cy.
 *
 * Known limits. The scan does NOT find:
 *   - a table with fewer than three regions, or with a position further than 160 characters from its name;
 *   - names or file names built at run time ('brain' + '.glb', a computed key, an id read from data),
 *     and model files under any other name;
 *   - positions that are not in one of the shapes above:
 *       four-number tuples, and tuples that hold an expression ([0, 8 * SCALE, 12]);
 *       signed numbers written with a space or a plus ([- 4, +6]);
 *       helper calls (at(0, 8, 12), vec3(0, 8, 12)) and translate(...);
 *       coordinates under other names (px/py/pz, left/top, lat/lon);
 *       percent or other strings ('40%'), numbers kept as strings;
 *       CSV columns, YAML block lists, separate arrays of names and positions joined by index;
 *   - band ids written in another letter case, and region names that are in neither the atlas data nor the informal list;
 *   - anything in a file listed in RECORDED_NOT_GEOMETRY, in a binary file, or in an extension the scan does not read;
 *   - geometry outside src/.
 *
 * Known false positives. The scan cannot tell a position from any other pair or triple of
 * numbers beside a region name, so it also marks:
 *   - region-to-colour triples ({ id: 'N7', c: [0.8, 0.55, 0.75] });
 *   - region-to-numeric-range pairs ({ thalamus: [100, 300] }).
 * New atlas code should key colours as hex strings ('#3b82f6'), which the scan ignores. A file
 * that cannot avoid these shapes goes in RECORDED_NOT_GEOMETRY with its reason.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const FIXTURE_DIRECTORY = 'src/components/__tests__/fixtures/legacy-geometry';
const STALE_BUILD_DIRECTORY = 'src/site/_astro';
const ALIAS_NOTE_PREFIX = '_';
/** The ratchet's own files name what they look for, so they are not scanned. */
const RATCHET_FILES = [
  'src/lib/legacy-geometry-scan.ts',
  'src/components/__tests__/legacy-geometry-ratchet.test.ts',
  'src/components/__tests__/legacy-geometry-recorded.ts',
  FIXTURE_DIRECTORY,
];

const vocabulary: RegionVocabulary = {
  regionNames: [
    ...atlas.brain_regions.map((region) => region.id),
    ...Object.keys(atlas.region_aliases).filter((alias) => !alias.startsWith(ALIAS_NOTE_PREFIX)),
    ...INFORMAL_REGION_NAMES,
  ],
  bandIds: atlas.qif_bands.map((band) => band.id),
};

describe('legacy geometry ratchet', () => {
  const found = scanLegacyGeometry(REPO_ROOT, vocabulary, RATCHET_FILES);
  const notGeometry = Object.keys(RECORDED_NOT_GEOMETRY);
  const geometryFound = Object.fromEntries(Object.entries(found).filter(([repoPath]) => !notGeometry.includes(repoPath)));
  const comparison = compareWithRecorded(geometryFound, RECORDED_LEGACY_GEOMETRY);

  it('finds no old geometry outside the recorded list (use the atlas data instead of adding a copy)', () => {
    expect(comparison.unrecorded).toEqual([]);
  });

  it('has no recorded entry that is already gone (delete it from RECORDED_LEGACY_GEOMETRY)', () => {
    expect(comparison.resolved).toEqual([]);
  });

  it('exempts only files the scan really does mark, and only as a region table (delete an entry that is no longer needed)', () => {
    expect(notGeometry.filter((repoPath) => JSON.stringify(found[repoPath]) !== JSON.stringify([REGION_TABLE_MARK]))).toEqual([]);
  });

  it('still has every recorded legacy file (delete a removed one from RECORDED_LEGACY_FILES)', () => {
    expect(RECORDED_LEGACY_FILES.filter((repoPath) => !existsSync(path.join(REPO_ROOT, repoPath)))).toEqual([]);
  });

  it('has exactly the recorded files in the stale committed build (none added; delete removed ones from the list)', () => {
    expect(listRepositoryFiles(REPO_ROOT, STALE_BUILD_DIRECTORY)).toEqual([...RECORDED_STALE_BUILD_FILES].sort());
  });

  it('reads region ids, aliases and bands from the atlas data', () => {
    expect(vocabulary.regionNames).toEqual(expect.arrayContaining(['pfc', 'thalamus', 'prefrontal_cortex']));
    expect(vocabulary.bandIds).toEqual(expect.arrayContaining(['N7', 'N1']));
  });

  it('only records marks the scan can produce', () => {
    const knownMarks = new Set([...Object.keys(LEGACY_NAME_PATTERNS), REGION_TABLE_MARK]);
    expect(Object.values(RECORDED_LEGACY_GEOMETRY).flat().filter((mark) => !knownMarks.has(mark))).toEqual([]);
  });
});

describe('the scan the ratchet relies on', () => {
  const marksOf = (source: string): string[] => findLegacyMarks(source, vocabulary);
  const TABLE = [REGION_TABLE_MARK];

  it('catches a new region table in a new file, under a name it has never seen', () => {
    const fixtures = [`${FIXTURE_DIRECTORY}/new-region-table.ts`, `${FIXTURE_DIRECTORY}/camera-presets.ts`];
    const found = scanFiles(REPO_ROOT, fixtures, vocabulary);
    expect(found).toEqual({ [`${FIXTURE_DIRECTORY}/new-region-table.ts`]: TABLE });
    expect(compareWithRecorded(found, RECORDED_LEGACY_GEOMETRY).unrecorded).toEqual([
      `${FIXTURE_DIRECTORY}/new-region-table.ts: ${REGION_TABLE_MARK}`,
    ]);
  });

  it.each([
    ['properties, minified, keyed by band', 'const a={N7:[0,8,10],N6:[0,2,5],N5:[0,3,8]};'],
    ['quoted keys as in JSON', '{"thalamus": [0, 0, 0], "amygdala": [-6.5, -6, 6], "pfc": [0, 8, 12]}'],
    ['named cx and cy', 'const p = {\n  pfc: { cx: 95, cy: 95 },\n  m1: { cx: 210, cy: 42 },\n  v1: { cx: 345, cy: 165 },\n};'],
    ['pairs for a Map', "new Map([['thalamus', [0, 0, 0]], ['amygdala', [-6, -6, 6]], ['pfc', [0, 8, 12]]])"],
    ['Map.set calls', "m.set('thalamus', [0, 0, 0]); m.set('amygdala', [-6, -6, 6]); m.set('vta', [1, -2, 3]);"],
    ['records with an id on one line', "[{ id: 'pfc', x: 95, y: 95 }, { id: 'm1', x: 210, y: 42 }, { id: 'v1', x: 3, y: 4 }]"],
    ['records over several lines', "[\n  {\n    id: 'pfc',\n    label: 'Prefrontal',\n    at: [0, 8, 12],\n  },\n  {\n    id: 'm1',\n    label: 'Motor',\n    at: [-3, 10, 5],\n  },\n  {\n    id: 'v1',\n    label: 'Visual',\n    at: [0, 3, -13],\n  },\n]"],
    ['position before the id', "[{ at: [0, 8, 12], id: 'pfc' }, { at: [-3, 10, 5], id: 'm1' }, { at: [0, 3, -13], id: 'v1' }]"],
    ['a position under any property name', "[{ region: 'thalamus', anchor: [0, 0, 0] }, { region: 'vta', anchor: [1, -2, 3] }, { region: 'stn', anchor: [2, 2, 2] }]"],
    ['a nested position object', "{ thalamus: { mesh: { position: [0, 0, 0] } }, vta: { mesh: { position: [1, -2, 3] } }, stn: { mesh: { position: [2, 2, 2] } } }"],
    ['Vector3 values', 'const p = { thalamus: new THREE.Vector3(0, 0, 0), vta: new Vector3(1, -2, 3), stn: new Vector3(2, 2, 2) };'],
    ['position.set beside a region name', "add('thalamus').position.set(0, 0, 0); add('vta').position.set(1, -2, 3); add('stn').position.set(2, 2, 2);"],
    ['upper-case region keys', 'const P = { THALAMUS: [0, 0, 0], VTA: [1, -2, 3], PFC: [0, 8, 12] };'],
    ['hemisphere-suffixed keys', 'const p = { thalamus_l: [-1, 0, 0], thalamus_r: [1, 0, 0], hippocampus_left: [-4, -4, 0], amygdalaR: [6, -6, 6] };'],
    ['variables named after regions', 'const thalamus = [0, 0, 0];\nconst vta = new Vector3(1, -2, 3);\nlet pfc = [0, 8, 12];'],
    ['flow-style YAML', 'thalamus: [0, 0, 0]\nvta: [1, -2, 3]\npfc: [0, 8, 12]\n'],
    ['records keyed by band with a nested pos', "const hotspots = {\n  N7: { pos: [0, 10, 6], size: 4.2 },\n  N6: { pos: [0, 1, 3], size: 3.2 },\n  N5: { pos: [0, 2, 6], size: 2.6 },\n};"],
  ])('catches a table written as %s', (_shape, source) => {
    expect(marksOf(source)).toEqual(TABLE);
  });

  it.each([
    ['one or two regions', 'const centre = { thalamus: [0, 0, 0], vta: [1, 2, 3] };'],
    ['tuples under other keys', 'const view = { position: [0, 3, 16], target: [0, 2, 0], up: [0, 1, 0] };'],
    ['regions used as plain values', 'const labels = { thalamus: "Thalamus", amygdala: "Amygdala", pfc: "PFC" };'],
    ['band sizes and an id list', 'const sizes = { N7: 3.0, N6: 2.2, N5: 1.8 }; const ids = ["pfc", "m1", "v1"];'],
    ['names that only contain a region name', 'const o = { subthalamus: [1, 2], my_pfc: [3, 4], obj.motor: 1, thalamusTint: [1, 2, 3] };'],
    ['identifiers that share a short region id', 'const f=(a1,v1,m1)=>a1?[1,2,3]:v1?[4,5,6]:m1?[7,8,9]:[0,0,0];'],
    ['a list of names followed by a list of numbers far away', `const order = ['thalamus', 'amygdala', 'pfc'];${' '.repeat(200)}const weights = [0.5, 0.25];`],
  ])('does not mark %s', (_shape, source) => {
    expect(marksOf(source)).toEqual([]);
  });

  it('marks a colour triple beside region names, which is why some files are exempted by name', () => {
    expect(marksOf("const shells = [{ id: 'N7', c: [0.8, 0.55, 0.75] }, { id: 'N4', c: [0.4, 0.95, 0.6] }, { id: 'N1', c: [0.3, 0.9, 0.5] }];")).toEqual(TABLE);
  });

  it('marks a numeric range beside region names, and ignores colours written as hex strings', () => {
    expect(marksOf('const latencyMs = { thalamus: [100, 300], pfc: [150, 400], m1: [20, 60] };')).toEqual(TABLE);
    expect(marksOf("const tint = { thalamus: '#3b82f6', pfc: '#ef4444', m1: '#f59e0b' };")).toEqual([]);
  });

  it('does not find the position shapes listed as known limits', () => {
    expect(marksOf('const p = { thalamus: [0, 0, 0, 1], vta: [1, -2, 3, 1], pfc: [0, 8, 12, 1] };')).toEqual([]);
    expect(marksOf('const p = { thalamus: [0, 8 * SCALE, 12], vta: [1, -2 * SCALE, 3], pfc: [0, 9 * SCALE, 12] };')).toEqual([]);
    expect(marksOf('const p = { thalamus: [- 4, +6], vta: [- 1, +2], pfc: [- 3, +8] };')).toEqual([]);
    expect(marksOf('const p = { thalamus: at(0, 0, 0), vta: vec3(1, -2, 3), pfc: at(0, 8, 12) };')).toEqual([]);
    expect(marksOf('const p = { thalamus: { px: 0, py: 0, pz: 0 }, vta: { px: 1, py: -2, pz: 3 }, pfc: { px: 0, py: 8, pz: 12 } };')).toEqual([]);
    expect(marksOf('const p = { thalamus: { left: 40, top: 55 }, vta: { left: 42, top: 61 }, pfc: { left: 20, top: 30 } };')).toEqual([]);
    expect(marksOf('const p = { thalamus: { lat: 4.1, lon: 5.2 }, vta: { lat: 4.2, lon: 6.1 }, pfc: { lat: 2.0, lon: 3.0 } };')).toEqual([]);
    expect(marksOf("const p = { thalamus: 'translate(40 55)', vta: 'translate(42 61)', pfc: 'translate(20 30)' };")).toEqual([]);
    expect(marksOf("const p = { thalamus: ['40%', '55%'], vta: ['42%', '61%'], pfc: ['20%', '30%'] };")).toEqual([]);
    expect(marksOf("load('/models/cortex-v2.glb');")).toEqual([]);
  });

  it('does not find the other shapes listed as known limits', () => {
    expect(marksOf('region,x,y,z\nthalamus,0,0,0\nvta,1,-2,3\npfc,0,8,12\n')).toEqual([]);
    expect(marksOf('thalamus:\n  - 0\n  - 0\n  - 0\nvta:\n  - 1\n  - -2\n  - 3\npfc:\n  - 0\n  - 8\n  - 12\n')).toEqual([]);
    expect(marksOf("const names = ['thalamus', 'vta', 'pfc'].map((name, index) => ({ [name]: positions[index] }));")).toEqual([]);
    expect(marksOf("load('/models/' + 'brain' + '.glb');")).toEqual([]);
    expect(marksOf('const a = { n7: [0, 8, 10], n6: [0, 2, 5], n5: [0, 3, 8] };')).toEqual([]);
  });

  it('marks each old name and any letter case of the old model file', () => {
    expect(marksOf('import { BRAIN_REGION_COORDS } from "./brain-regions";')).toEqual(['BRAIN_REGION_COORDS', 'brain-regions module']);
    expect(marksOf('const p = REGION_HOTSPOTS[id] ?? REGION_3D_POS[id];')).toEqual(['REGION_3D_POS', 'REGION_HOTSPOTS']);
    expect(marksOf("useGLTF('/models/brain.glb');")).toEqual(['brain.glb']);
    expect(marksOf("useGLTF('/models/Brain.GLB');")).toEqual(['brain.glb']);
    expect(marksOf('const MY_REGION_HOTSPOTS_V2 = 1; const brainXglb = 2;')).toEqual([]);
  });

  it('names the regions it found placed, for whoever has to judge a hit', () => {
    expect(findPlacedRegions('const p = { THALAMUS: [0, 0, 0], vta_l: [1, -2, 3], N7: [0, 8, 12] };', vocabulary)).toEqual(['n7', 'thalamus', 'vta']);
  });

  it('reports a recorded entry that has gone, so the list must shrink with the code', () => {
    const { unrecorded, resolved } = compareWithRecorded({}, { 'src/a.ts': ['brain.glb', REGION_TABLE_MARK] });
    expect(unrecorded).toEqual([]);
    expect(resolved).toEqual(['src/a.ts: brain.glb', `src/a.ts: ${REGION_TABLE_MARK}`]);
  });

  it('reports a new mark on a file that is already recorded for another', () => {
    const { unrecorded } = compareWithRecorded({ 'src/a.ts': ['brain.glb', REGION_TABLE_MARK] }, { 'src/a.ts': ['brain.glb'] });
    expect(unrecorded).toEqual([`src/a.ts: ${REGION_TABLE_MARK}`]);
  });

  it('refuses to scan with no region names', () => {
    expect(() => findPlacedRegions('x', { regionNames: [], bandIds: [] })).toThrow(/No region names/);
  });
});
