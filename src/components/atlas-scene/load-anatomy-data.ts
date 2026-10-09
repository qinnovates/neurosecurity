/**
 * The one place the anatomy feature imports data files. It validates every one
 * and builds the index and its evidence file. Call it at build time only (page
 * frontmatter or a static endpoint), so malformed data throws during
 * `npm run build`. Nothing it returns belongs in a page's HTML except the
 * index's path, length and digest.
 */

import registrar from '@shared/qtara-registrar.json';
import atlas from '@shared/qif-brain-bci-atlas.json';
import pathways from '@shared/qif-neural-pathways.json';
import cveMapping from '@shared/cve-technique-mapping.json';
import securityControls from '@shared/qif-security-controls.json';
import sources from '@shared/qif-anatomy-sources.json';
import verdicts from '@shared/qif-anatomy-verdicts.json';
import reviewLedger from '@shared/qif-anatomy-review-ledger.json';
import crosswalk from '@shared/qif-anatomy-crosswalk.json';
import techniqueRegions from '@shared/qif-anatomy-technique-regions.json';
import deviceGeometry from '@shared/qif-anatomy-device-geometry.json';
import regionEvidence from '@shared/qif-anatomy-region-evidence.json';
import h01Card from '@shared/qif-anatomy-h01-card.json';
import { parseAnatomyFiles, type AnatomyData } from '@/lib/anatomy/anatomy-inputs';
import { buildAnatomyBundle, type AnatomyBundle } from '@/lib/anatomy/build-anatomy-index';
import { parseH01Card, type H01Card } from '@/lib/anatomy/parse-h01-card';
import { parseRegionEvidence } from '@/lib/anatomy/parse-region-evidence';
import type { RegionEvidence } from '@/lib/anatomy/region-evidence-types';
import { assertLedgerRatchet } from '@/lib/anatomy/review-state';
import { buildExplorerCatalog, type ExplorerCatalog } from '@/lib/atlas-explorer/explorer-catalog';
import { buildEngineData } from '@/lib/threat-model/build-engine-data';

const ROOT_PREFIX = '/';
const MANIFEST_PATH = '/src/site/atlas-assets/manifest.json';

/**
 * The offline pipeline's outputs. They do not exist until the pipeline has run,
 * so they are matched by pattern: an absent file is simply not there, and a
 * present one is parsed like any other untrusted input.
 */
const manifestModules = import.meta.glob<unknown>('/src/site/atlas-assets/manifest.json', { eager: true, import: 'default' });
const labelTableModules = import.meta.glob<unknown>('/src/site/atlas-assets/*/labels-*.json', { eager: true, import: 'default' });

function toRepositoryPaths(modules: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(modules).map(([path, content]) => [path.slice(ROOT_PREFIX.length), content]));
}

/** Every anatomy data file, parsed and cross-checked. Throws AnatomyDataError on the first problem. */
export function loadAnatomyData(): AnatomyData {
  const { engineData } = buildEngineData({ registrar, atlas, cveMapping, securityControls });
  const data = parseAnatomyFiles({
    engineData,
    registrar,
    atlas,
    pathways,
    sources,
    verdicts,
    reviewLedger,
    crosswalk,
    techniqueRegions,
    deviceGeometry,
    manifest: manifestModules[MANIFEST_PATH] ?? null,
    labelTablesByPath: toRepositoryPaths(labelTableModules),
  });
  assertLedgerRatchet(data.ledger);
  return data;
}

export function loadAnatomyBundle(): AnatomyBundle {
  return buildAnatomyBundle(loadAnatomyData());
}

function loadEngineData(): ReturnType<typeof buildEngineData>['engineData'] {
  return buildEngineData({ registrar, atlas, cveMapping, securityControls }).engineData;
}

/** The literature statements filed under each region, parsed. Throws AnatomyDataError on the first problem. */
export function loadRegionEvidence(): RegionEvidence {
  return parseRegionEvidence(regionEvidence, new Set(loadEngineData().regions.map((region) => region.id)));
}

/** The H01 card and the sourced facts behind it, parsed. Throws AnatomyDataError on the first problem. */
export function loadH01Card(): H01Card {
  return parseH01Card(h01Card);
}

/** Band names, region descriptions and device-stage techniques for the explorer. Throws AnatomyDataError on the first problem. */
export function loadExplorerCatalog(): ExplorerCatalog {
  return buildExplorerCatalog(loadEngineData(), atlas);
}
