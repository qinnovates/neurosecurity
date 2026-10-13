/**
 * Loads the anatomy data files for the query tables. `getKqlTables` also runs
 * outside Vite (src/scripts/generate-kql-json.mjs runs it with tsx), where the
 * atlas page's loader cannot run because it finds the pipeline's outputs by
 * glob. This loader therefore names every file. A test builds the tables
 * through both loaders and fails if they differ, so a label table added on
 * disk and not listed here is caught.
 *
 * Build time only. Nothing here may be imported by code that runs in a page:
 * the tables reach the browser as /data/kql-tables.json and as parquet files.
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
import techniqueRegionCuration from '@shared/scripts/technique-region-curation.json';
import manifest from '../../site/atlas-assets/manifest.json';
import labelsCit168 from '../../site/atlas-assets/by-sa/labels-cit168_rl.json';
import labelsAllen from '../../site/atlas-assets/open/labels-allen_hra_3d_2020.json';
import labelsMni from '../../site/atlas-assets/open/labels-mni_icbm152_2009c_asym.json';
import labelsNeudorfer from '../../site/atlas-assets/open/labels-neudorfer_hypothalamus.json';
import { buildEngineData } from '@/lib/threat-model/build-engine-data';
import { parseAnatomyFiles, type RawAnatomyFiles } from './anatomy-inputs';
import { buildAnatomyTables, type AnatomyTables } from './anatomy-tables';
import { assertLedgerRatchet } from './review-state';

/** Repository path -> label table, one per atlas the pipeline has built. */
export const LABEL_TABLES_BY_PATH: Readonly<Record<string, unknown>> = {
  'src/site/atlas-assets/by-sa/labels-cit168_rl.json': labelsCit168,
  'src/site/atlas-assets/open/labels-allen_hra_3d_2020.json': labelsAllen,
  'src/site/atlas-assets/open/labels-mni_icbm152_2009c_asym.json': labelsMni,
  'src/site/atlas-assets/open/labels-neudorfer_hypothalamus.json': labelsNeudorfer,
};

function readRawAnatomyFiles(): RawAnatomyFiles {
  const { engineData } = buildEngineData({ registrar, atlas, cveMapping, securityControls });
  return {
    engineData, registrar, atlas, pathways, sources, verdicts, reviewLedger, crosswalk, techniqueRegions, deviceGeometry,
    manifest,
    labelTablesByPath: LABEL_TABLES_BY_PATH,
  };
}

/** Every anatomy table, built from the committed files. Throws AnatomyDataError on the first problem, as the atlas page's loader does. */
export function loadAnatomyTables(): AnatomyTables {
  const data = parseAnatomyFiles(readRawAnatomyFiles());
  assertLedgerRatchet(data.ledger);
  return buildAnatomyTables(data, techniqueRegionCuration);
}
