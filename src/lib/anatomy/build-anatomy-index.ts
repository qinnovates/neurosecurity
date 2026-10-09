/**
 * Builds the two static files the atlas page reads: the index, and the
 * evidence file the index pins by byte length and sha256. The index is parsed
 * again before it is emitted, so a build cannot ship an index that has lost a
 * review state.
 *
 * Build time only (digests use node:crypto).
 */

import type { AnatomyData } from './anatomy-inputs';
import { ANATOMY_EVIDENCE_PATH, ANATOMY_INDEX_PATH, ANATOMY_INDEX_SCHEMA_VERSION, type AnatomyIndex, type PinnedFile } from './anatomy-index-types';
import { buildAnatomyEvidence } from './build-anatomy-evidence';
import { buildDevices, buildTracts, listDeviceRows } from './build-index-devices';
import { buildLayers, buildSources } from './build-index-sources';
import { buildAssets, buildStructures, buildSubjects } from './build-index-structures';
import { buildTechniques, reviewTechniqueLinks } from './build-index-techniques';
import { REGISTRAR_FILE } from './parse-technique-regions';
import { parseAnatomyIndex } from './parse-anatomy-index';
import { reviewCrosswalkRows, reviewNoGeometry } from './review-rows';
import { sha256Hex } from './row-digest';
import { SOURCE_REF_STATES } from './source-ref';
import { ANATOMY_INDEX_STATUS } from './status-sentences';

export interface AnatomyBundle {
  index: AnatomyIndex;
  /** The exact bytes served at ANATOMY_INDEX_PATH. */
  indexJson: string;
  /** What a page must be built with to check the index before using it. */
  indexPin: PinnedFile;
  /** The exact bytes served at ANATOMY_EVIDENCE_PATH. */
  evidenceJson: string;
}

function pin(path: string, content: string): PinnedFile {
  return { path, bytes: Buffer.byteLength(content, 'utf-8'), sha256: sha256Hex(content) };
}

export function buildAnatomyBundle(data: AnatomyData): AnatomyBundle {
  const crosswalk = reviewCrosswalkRows(data);
  const noGeometry = reviewNoGeometry(data);
  const links = reviewTechniqueLinks(data);
  const assets = buildAssets(data);
  const evidenceJson = JSON.stringify(buildAnatomyEvidence(data, { crosswalk, noGeometry, links, deviceRows: listDeviceRows(data) }));
  const staleKeys = [...crosswalk.current, ...links].filter((item) => item.quote_state !== SOURCE_REF_STATES.QUOTE_FOUND).map((item) => item.key);
  const index: AnatomyIndex = {
    schema_version: ANATOMY_INDEX_SCHEMA_VERSION,
    status: ANATOMY_INDEX_STATUS,
    addressing_version: data.addressingVersion,
    template_space: data.sources.declared_space,
    evidence: pin(ANATOMY_EVIDENCE_PATH, evidenceJson),
    layers: buildLayers(data, assets),
    sources: buildSources(data),
    assets,
    structures: buildStructures(data, crosswalk),
    subjects: buildSubjects(data, crosswalk, noGeometry),
    techniques: buildTechniques(data, links, data.documentsByFile.get(REGISTRAR_FILE)),
    tracts: buildTracts(assets),
    devices: buildDevices(data),
    stale_evidence_keys: staleKeys,
  };
  const indexJson = JSON.stringify(index);
  parseAnatomyIndex(JSON.parse(indexJson));
  return { index, indexJson, indexPin: pin(ANATOMY_INDEX_PATH, indexJson), evidenceJson };
}
