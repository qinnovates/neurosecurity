/** Reads and parses the atlas map from the checkout this file lives in. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_MAP_FILE, parseAtlasMap } from './parse-atlas-map.mjs';

/** The repository root: this file is src/scripts/atlas-map/load-atlas-map.mjs. */
export const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** @returns {import('./parse-atlas-map.d.mts').AtlasMap} */
export function loadAtlasMap(root = REPOSITORY_ROOT) {
  return parseAtlasMap(JSON.parse(fs.readFileSync(path.join(root, ATLAS_MAP_FILE), 'utf-8')));
}
