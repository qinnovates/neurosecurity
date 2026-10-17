/**
 * The recorded state of the old, hand-placed brain geometry, read by
 * legacy-geometry-ratchet.test.ts. Nothing may be added here. Each later change that
 * removes an entry from the code deletes it here too; the last removal leaves every list empty.
 *
 * The site's own brain pictures are gone: every page that drew one now lists its data and links
 * to the atlas explorer (/atlas/anatomy/). What is still listed below is listed with the reason
 * it stays and what removes it.
 */

import { REGION_TABLE_MARK } from '@/lib/legacy-geometry-scan';

/** Files under src/ that hold old geometry or refer to the old model, and how. Tests are included. */
export const RECORDED_LEGACY_GEOMETRY: Record<string, readonly string[]> = {
  // STAYS, with this reason. A prebuilt bundle of a separate application (the signal monitor demonstration),
  // committed without its source. It holds scalp electrode positions in that application's own scene units,
  // each tagged with a lobe name: a hand-made electrode layout, not positions of brain regions. It cannot be
  // edited here, and deleting it means deleting the whole application, which the Lab's Monitor mode
  // (src/components/monitor/MonitorMode.tsx) shows. The open Lab redesign replaces that mode with a monitor
  // built from source; once it merges the Lab no longer shows /brain-siem/ and the directory can be deleted,
  // and this entry with it. The explorer's own electrode layout is built from the atlas data files and shares
  // nothing with this. The kept src/site/brain-siem/ bundle also contains BrainMapModule-*.js, which draws a 2D
  // head outline with electrodes and lobe labels, and BrainSiemModule draws a sphere head; the scanner does not
  // mark the first. Both go when src/site/brain-siem/ is replaced.
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
export const RECORDED_LEGACY_FILES: readonly string[] = [];

/**
 * What is left of a build committed by mistake long ago, which is copied into every new build. No file may join it.
 * None of the five holds brain geometry or leads to any: the 21 chunks that did, or that nothing loaded, are deleted.
 * These stay because 17 pages that exist only as committed HTML (under src/site/governance/, src/site/lab/ and
 * src/site/research/) still load them: their stylesheet, the page router, the search script with its one import,
 * and one image. They go when those pages are rebuilt from source or retired, which is a decision about the pages.
 */
export const RECORDED_STALE_BUILD_FILES: readonly string[] = [
  'src/site/_astro/ClientRouter.astro_astro_type_script_index_0_lang.CDGfc0hd.js',
  'src/site/_astro/Search.astro_astro_type_script_index_0_lang.mkdr79ir.js',
  'src/site/_astro/about.BooKFJOI.css',
  'src/site/_astro/preload-helper.BlTxHScW.js',
  'src/site/_astro/vera-engine.BaibVlOG_ZoFGm7.webp',
];
