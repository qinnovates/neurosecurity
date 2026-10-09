import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import atlas from '@shared/qif-brain-bci-atlas.json';
import {
  INFORMAL_REGION_NAMES,
  LEGACY_NAME_PATTERNS,
  REGION_TABLE_MARK,
  buildRegionEntryPattern,
  compareWithRecorded,
  findLegacyMarks,
  listRepositoryFiles,
  scanFiles,
  scanLegacyGeometry,
} from './legacy-geometry-scan';

/**
 * A ratchet on the old, hand-placed brain geometry. The lists below record where it is
 * today. Nothing may be added. When a later change removes an entry from the code, this
 * test fails until the entry is deleted here too, so the lists only ever shrink; the
 * last removal leaves them empty.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const FIXTURE_DIRECTORY = 'src/components/__tests__/fixtures/legacy-geometry';
const STALE_BUILD_DIRECTORY = 'src/site/_astro';
const ALIAS_NOTE_PREFIX = '_';

/** Files under src/ (tests excluded) that hold old geometry or refer to the old model, and how. */
const RECORDED_LEGACY_GEOMETRY: Record<string, readonly string[]> = {
  'src/components/ThreatAtlasViz.tsx': [REGION_TABLE_MARK],
  'src/components/atlas/brainmap/BrainSvg.tsx': ['BRAIN_REGION_COORDS', 'brain-regions module'],
  'src/components/atlas/brainmap/brain-regions.ts': ['BRAIN_REGION_COORDS', REGION_TABLE_MARK],
  'src/components/brain/BrainVisualization.tsx': ['REGION_HOTSPOTS', 'brain.glb', REGION_TABLE_MARK],
  'src/components/neurosim/NeuroSIM.tsx': ['REGION_3D_POS', 'brain.glb', REGION_TABLE_MARK],
  'src/components/threat-model/TargetRegionsPanel.tsx': ['BRAIN_REGION_COORDS', 'brain-regions module'],
  'src/scripts/strip-glb-textures.mjs': ['brain.glb'],
  'src/site/_astro/BrainVisualization.DCSk5yMy.js': ['brain.glb', REGION_TABLE_MARK],
  'src/site/brain-capture.html': ['brain.glb'],
};

/** Old files that are to be deleted outright, whatever they contain. */
const RECORDED_LEGACY_FILES: readonly string[] = [
  'src/components/atlas/brainmap/brain-regions.ts',
  'src/site/brain-capture.html',
  'src/site/models/brain.glb',
];

/** A build committed by mistake long ago. It is copied into every new build; no file may join it. */
const RECORDED_STALE_BUILD_FILES: readonly string[] = [
  'src/site/_astro/AtlasDashboard.Boq6WiaI.js',
  'src/site/_astro/BciDashboard.C_MLwdHu.js',
  'src/site/_astro/BciExplorer.C5mjSt0M.js',
  'src/site/_astro/BciKql.BznQ5HW6.js',
  'src/site/_astro/BciLandscape.DID2-QvJ.js',
  'src/site/_astro/BrainVisualization.BhQMtTjC.js',
  'src/site/_astro/BrainVisualization.DAb2QKYQ.js',
  'src/site/_astro/BrainVisualization.DCSk5yMy.js',
  'src/site/_astro/ClientRouter.astro_astro_type_script_index_0_lang.CDGfc0hd.js',
  'src/site/_astro/ClinicalDomainCards.eszQM-eb.js',
  'src/site/_astro/HeroParticles.CepCdBQT.js',
  'src/site/_astro/Hourglass3D.DmtWt39w.js',
  'src/site/_astro/NeurorightCards.BvCM403E.js',
  'src/site/_astro/OrbitControls.BDibDrBQ.js',
  'src/site/_astro/Search.astro_astro_type_script_index_0_lang.mkdr79ir.js',
  'src/site/_astro/SwimlaneTImeline.Dv4hm0ws.js',
  'src/site/_astro/TaraVisualization.CH97vkN3.js',
  'src/site/_astro/about.BooKFJOI.css',
  'src/site/_astro/client.CQJou1yw.js',
  'src/site/_astro/explorer.Ckb6QSlO.css',
  'src/site/_astro/index.Bb8JjhAW.js',
  'src/site/_astro/index.DeO6U63H.js',
  'src/site/_astro/jsx-runtime.D_zvdyIk.js',
  'src/site/_astro/preload-helper.BlTxHScW.js',
  'src/site/_astro/react-three-fiber.esm.BeQ3Cg2x.js',
  'src/site/_astro/vera-engine.BaibVlOG_ZoFGm7.webp',
];

const regionKeys: string[] = [
  ...atlas.brain_regions.map((region) => region.id),
  ...Object.keys(atlas.region_aliases).filter((alias) => !alias.startsWith(ALIAS_NOTE_PREFIX)),
  ...atlas.qif_bands.map((band) => band.id),
  ...INFORMAL_REGION_NAMES,
];

describe('legacy geometry ratchet', () => {
  const comparison = compareWithRecorded(scanLegacyGeometry(REPO_ROOT, regionKeys), RECORDED_LEGACY_GEOMETRY);

  it('finds no old geometry outside the recorded list (use the atlas data instead of adding a copy)', () => {
    expect(comparison.unrecorded).toEqual([]);
  });

  it('has no recorded entry that is already gone (delete it from RECORDED_LEGACY_GEOMETRY)', () => {
    expect(comparison.resolved).toEqual([]);
  });

  it('still has every recorded legacy file (delete a removed one from RECORDED_LEGACY_FILES)', () => {
    expect(RECORDED_LEGACY_FILES.filter((repoPath) => !existsSync(path.join(REPO_ROOT, repoPath)))).toEqual([]);
  });

  it('has exactly the recorded files in the stale committed build (none added; delete removed ones from the list)', () => {
    expect(listRepositoryFiles(REPO_ROOT, STALE_BUILD_DIRECTORY)).toEqual([...RECORDED_STALE_BUILD_FILES].sort());
  });

  it('reads region ids, aliases and bands from the atlas data', () => {
    expect(regionKeys).toEqual(expect.arrayContaining(['pfc', 'thalamus', 'prefrontal_cortex', 'N7']));
  });
});

describe('the scan the ratchet relies on', () => {
  const regionEntryPattern = buildRegionEntryPattern(regionKeys);
  const marksOf = (source: string): string[] => findLegacyMarks(source, regionEntryPattern);

  it('catches a new region-to-coordinate table in a new file, under a name it has never seen', () => {
    const found = scanFiles(REPO_ROOT, [`${FIXTURE_DIRECTORY}/new-region-table.ts`, `${FIXTURE_DIRECTORY}/camera-presets.ts`], regionKeys);
    expect(found).toEqual({ [`${FIXTURE_DIRECTORY}/new-region-table.ts`]: [REGION_TABLE_MARK] });
    expect(compareWithRecorded(found, RECORDED_LEGACY_GEOMETRY).unrecorded).toEqual([
      `${FIXTURE_DIRECTORY}/new-region-table.ts: ${REGION_TABLE_MARK}`,
    ]);
  });

  it('catches the table when minified, quoted as JSON, keyed by band, or written as x and y', () => {
    expect(marksOf('const a={N7:[0,8,10],N6:[0,2,5]};')).toEqual([REGION_TABLE_MARK]);
    expect(marksOf('{"thalamus": [0, 0, 0], "amygdala": [-6.5, -6, 6]}')).toEqual([REGION_TABLE_MARK]);
    expect(marksOf('const p = {\n  pfc: { cx: 95, cy: 95 },\n  m1: { cx: 210, cy: 42 },\n};')).toEqual([REGION_TABLE_MARK]);
    expect(marksOf('const p = { visual: { x: 1, y: 2 }, motor: { x: -3, y: 1e-2 } };')).toEqual([REGION_TABLE_MARK]);
  });

  it('catches the table written as pairs for a Map, or as records with an id', () => {
    expect(marksOf("new Map([['thalamus', [0, 0, 0]], ['amygdala', [-6, -6, 6]]])")).toEqual([REGION_TABLE_MARK]);
    expect(marksOf("[{ id: 'pfc', x: 95, y: 95 }, { id: 'm1', x: 210, y: 42 }]")).toEqual([REGION_TABLE_MARK]);
    expect(marksOf('[{"region":"thalamus","position":[0,0,0]},{"region":"vta","position":[1,-2,3]}]')).toEqual([REGION_TABLE_MARK]);
  });

  it('does not mark one coincidental entry, tuples under other keys, or a region used as a plain value', () => {
    expect(marksOf('const centre = { thalamus: [0, 0, 0] };')).toEqual([]);
    expect(marksOf('const view = { position: [0, 3, 16], target: [0, 2, 0] };')).toEqual([]);
    expect(marksOf('const labels = { thalamus: "Thalamus", amygdala: "Amygdala" };')).toEqual([]);
    expect(marksOf('const sizes = { N7: 3.0, N6: 2.2 }; const ids = ["pfc", "m1"];')).toEqual([]);
    expect(marksOf('const o = { subthalamus: [1, 2], my_pfc: [3, 4], obj.motor: 1 };')).toEqual([]);
    expect(marksOf("const order = ['thalamus', 'amygdala', 'pfc']; const weights = [0.5, 0.25];")).toEqual([]);
    expect(marksOf("const rows = [{ id: 'pfc', label: 'PFC' }, { id: 'm1', label: 'M1' }];")).toEqual([]);
    expect(marksOf("const shells = [{ id: 'N7', r: 0.82, c: [0.8, 0.55, 0.75] }, { id: 'N4', r: 0.96, c: [0.4, 0.95, 0.6] }];")).toEqual([]);
  });

  it('marks each old name and the old model file', () => {
    expect(marksOf('import { BRAIN_REGION_COORDS } from "./brain-regions";')).toEqual(['BRAIN_REGION_COORDS', 'brain-regions module']);
    expect(marksOf('const p = REGION_HOTSPOTS[id] ?? REGION_3D_POS[id];')).toEqual(['REGION_3D_POS', 'REGION_HOTSPOTS']);
    expect(marksOf("useGLTF('/models/brain.glb');")).toEqual(['brain.glb']);
    expect(marksOf('const MY_REGION_HOTSPOTS_V2 = 1; const brainXglb = 2;')).toEqual([]);
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

  it('refuses to build a pattern from no region keys', () => {
    expect(() => buildRegionEntryPattern([])).toThrow(/No region keys/);
  });

  it('only records marks the scan can produce', () => {
    const knownMarks = new Set([...Object.keys(LEGACY_NAME_PATTERNS), REGION_TABLE_MARK]);
    expect(Object.values(RECORDED_LEGACY_GEOMETRY).flat().filter((mark) => !knownMarks.has(mark))).toEqual([]);
  });
});
