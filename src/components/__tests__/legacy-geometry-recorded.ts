/**
 * The recorded state of the old, hand-placed brain geometry, read by
 * legacy-geometry-ratchet.test.ts. Nothing may be added here. Each later change that
 * removes an entry from the code deletes it here too; the last removal leaves every list empty.
 */

import { REGION_TABLE_MARK } from '@/lib/legacy-geometry-scan';

/** Files under src/ that hold old geometry or refer to the old model, and how. Tests are included. */
export const RECORDED_LEGACY_GEOMETRY: Record<string, readonly string[]> = {
  'src/components/ThreatAtlasViz.tsx': [REGION_TABLE_MARK],
  'src/components/__tests__/brain-model-asset.test.ts': ['brain.glb'],
  'src/components/atlas/brainmap/BrainSvg.tsx': ['BRAIN_REGION_COORDS', 'brain-regions module'],
  'src/components/atlas/brainmap/brain-regions.ts': ['BRAIN_REGION_COORDS', REGION_TABLE_MARK],
  'src/components/brain/BrainVisualization.tsx': ['REGION_HOTSPOTS', 'brain.glb', REGION_TABLE_MARK],
  'src/components/neurosim/NeuroSIM.tsx': ['REGION_3D_POS', 'brain.glb', REGION_TABLE_MARK],
  'src/components/threat-model/TargetRegionsPanel.tsx': ['BRAIN_REGION_COORDS', 'brain-regions module'],
  'src/lib/threat-model/__tests__/target-regions.test.ts': ['BRAIN_REGION_COORDS', 'brain-regions module'],
  'src/scripts/strip-glb-textures.mjs': ['brain.glb'],
  'src/site/_astro/BrainVisualization.DCSk5yMy.js': ['brain.glb', REGION_TABLE_MARK],
  'src/site/brain-capture.html': ['brain.glb', REGION_TABLE_MARK],
  // A prebuilt bundle: scalp electrode positions, each tagged with a region name.
  'src/site/brain-siem/assets/BrainSiemModule-Ck2DlkJb.js': [REGION_TABLE_MARK],
};

/**
 * Files the scan marks as a region table that are not one, each with the reason. The scan
 * cannot tell a colour triple from a position. A file listed here is not watched for a
 * real table, so the list must stay short; the test fails if an entry stops being needed.
 */
export const RECORDED_NOT_GEOMETRY: Record<string, string> = {
  'src/components/OniSpheres.tsx': 'band ids beside colour triples and shell radii; no positions',
};

/** Old files that are to be deleted outright, whatever they contain. */
export const RECORDED_LEGACY_FILES: readonly string[] = [
  'src/components/atlas/brainmap/brain-regions.ts',
  'src/site/brain-capture.html',
  'src/site/models/brain.glb',
];

/** A build committed by mistake long ago. It is copied into every new build; no file may join it. */
export const RECORDED_STALE_BUILD_FILES: readonly string[] = [
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
