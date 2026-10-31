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
import sources from '@shared/qif-anatomy-sources.json';
import verdicts from '@shared/qif-anatomy-verdicts.json';
import reviewLedger from '@shared/qif-anatomy-review-ledger.json';
import crosswalk from '@shared/qif-anatomy-crosswalk.json';
import techniqueRegions from '@shared/qif-anatomy-technique-regions.json';
import deviceGeometry from '@shared/qif-anatomy-device-geometry.json';
import regionEvidence from '@shared/qif-anatomy-region-evidence.json';
import h01Card from '@shared/qif-anatomy-h01-card.json';
import taraChains from '@shared/tara-chains.json';
import landscape from '@shared/bci-landscape.json';
import securityControls from '@shared/qif-security-controls.json';
import hazards from '@shared/qif-hazards.json';
import neurological from '@shared/qif-neurological-mappings.json';
import hardware from '../../site/bci-hardware-inventory.json';
import { parseAnatomyFiles, type AnatomyData } from '@/lib/anatomy/anatomy-inputs';
import { buildAnatomyBundle, type AnatomyBundle } from '@/lib/anatomy/build-anatomy-index';
import { AnatomyDataError } from '@/lib/anatomy/errors';
import { H01_CARD_PATH, parseH01Card } from '@/lib/anatomy/parse-h01-card';
import { MANIFEST_FILE } from '@/lib/anatomy/parse-manifest';
import { parseRegionEvidence } from '@/lib/anatomy/parse-region-evidence';
import { REGION_EVIDENCE_PATH } from '@/lib/anatomy/region-evidence-types';
import { assertLedgerRatchet } from '@/lib/anatomy/review-state';
import { ATLAS_CHAINS_PATH, buildAtlasChains, type AtlasChains } from '@/lib/atlas-explorer/chain-file';
import { buildRegionDossierFile } from '@/lib/atlas-explorer/build-dossier-file';
import { REGION_DOSSIER_PATH } from '@/lib/atlas-explorer/dossier-file';
import { EXPLORER_CATALOG_PATH, buildExplorerCatalog } from '@/lib/atlas-explorer/explorer-catalog';
import { layerOf, type BandId } from '@/lib/qif-constants';
import { buildEngineData } from '@/lib/threat-model/build-engine-data';

const ROOT_PREFIX = '/';
const MANIFEST_PATH = `${ROOT_PREFIX}${MANIFEST_FILE}`;
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

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
  const { engineData } = buildEngineData({ registrar, atlas, cveMapping });
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

/** The dossier's file: the datalake's records for every region, restricted to the techniques with a drafted link. */
function buildDossierJson(data: AnatomyData, chains: AtlasChains): string {
  const linkedTechniqueIds = new Set(Object.entries(data.techniqueRegions.techniques).filter(([, entry]) => entry.links.length > 0).map(([techniqueId]) => techniqueId));
  const sources = { atlas, landscape, hardware, controls: securityControls, hazards, pathways, neurological, chains };
  return JSON.stringify(buildRegionDossierFile(data.engineData, sources, (bandId) => layerOf(bandId as BandId), linkedTechniqueIds));
}

/** The index, its evidence file and the five files the explorer reads beside them, each pinned by the index. */
export function loadAnatomyBundle(): AnatomyBundle {
  const data = loadAnatomyData();
  const regionIds = new Set(data.engineData.regions.map((region) => region.id));
  const chains = buildAtlasChains(taraChains, new Set(data.engineData.techniques.map((technique) => technique.id)));
  return buildAnatomyBundle(data, [
    { path: EXPLORER_CATALOG_PATH, json: JSON.stringify(buildExplorerCatalog(data.engineData, atlas, { registrar, pathways })) },
    { path: REGION_EVIDENCE_PATH, json: JSON.stringify(parseRegionEvidence(regionEvidence, regionIds)) },
    { path: H01_CARD_PATH, json: JSON.stringify(parseH01Card(h01Card)) },
    { path: ATLAS_CHAINS_PATH, json: JSON.stringify(chains) },
    { path: REGION_DOSSIER_PATH, json: buildDossierJson(data, chains) },
  ]);
}

/**
 * The exact bytes of a file served beside the index, as the index pins them.
 *
 * @throws AnatomyDataError when the bundle holds no file for the path
 */
export function loadCompanionJson(path: string): string {
  const json = loadAnatomyBundle().companionJsonByPath[path];
  if (json === undefined) throw new AnatomyDataError(path, '(top level)', 'the anatomy bundle holds no such file', 'Add it to the companions in loadAnatomyBundle.');
  return json;
}

/** What every static atlas JSON endpoint under src/pages/atlas/ answers with: the bytes the index pins, served as JSON. */
export function respondWithAtlasJson(json: string): Response {
  return new Response(json, { headers: JSON_HEADERS });
}
