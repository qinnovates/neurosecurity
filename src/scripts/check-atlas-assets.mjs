/**
 * Post-build checks for the brain atlas assets: the built site serves exactly the
 * files the manifest lists, unchanged, and the attribution page shows every
 * wording a source requires. Both read `dist/`, so they run after the build.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const ATLAS_ASSET_URL_PATH = '/atlas-assets/';
export const ATTRIBUTION_URL_PATH = '/atlas/attribution/';
export const DEFAULT_MANIFEST_FILE = 'src/site/atlas-assets/manifest.json';
export const DEFAULT_SOURCES_FILE = 'datalake/qif-anatomy-sources.json';
/** The page states this whatever ships; its absence means the page is not the attribution page. */
export const LICENSE_READING_STATEMENT = 'The license readings on this page were made by AI and not by a lawyer. No person has confirmed them. They are not legal advice.';

/** Names the page shows for the licenses a shipped asset can carry; a test holds this to the page's own table. */
export const SHIPPING_LICENSE_NAMES = {
  'cc-by-4.0': 'Creative Commons Attribution 4.0 International',
  'cc0-1.0': 'CC0 1.0 Universal',
  'cc-by-sa-4.0': 'Creative Commons Attribution-ShareAlike 4.0 International',
  mit: 'MIT License',
  'mni-icbm-notice': 'MNI ICBM152 permission notice',
};
export const SHARE_ALIKE_LICENSE_ID = 'cc-by-sa-4.0';
export const SHARE_ALIKE_STATEMENT = 'You may share and adapt these files, including commercially, provided you give credit, indicate changes, and distribute your contributions under the same licence, with no further restrictions.';

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function sha256Of(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

/**
 * The text a reader sees: scripts, styles and tags removed, entities decoded,
 * whitespace collapsed. A wording is checked against this, not against the markup.
 *
 * @param {string} html
 * @returns {string}
 */
export function visibleText(html) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (whole, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (whole, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&([a-z]+);/gi, (whole, name) => NAMED_ENTITIES[name.toLowerCase()] ?? whole)
    .replace(/\s+/g, ' ')
    .trim();
}

const collapse = (text) => text.replace(/\s+/g, ' ').trim();

/** Every file under a directory, as paths relative to it with forward slashes. */
function listFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory()
    ? listFiles(path.join(directory, entry.name), `${prefix}${entry.name}/`)
    : [`${prefix}${entry.name}`]));
}

/**
 * Every asset the manifest lists is in the built site with the recorded length and sha256,
 * and the built manifest is the committed one.
 *
 * @param {string} distDirectory
 * @param {string} [manifestFile]
 * @returns {string[]} failure messages
 */
export function findAssetCoherenceFailures(distDirectory, manifestFile = DEFAULT_MANIFEST_FILE) {
  if (!fs.existsSync(manifestFile)) return [`${manifestFile} is missing; the atlas assets cannot be checked`];
  const manifest = readJson(manifestFile);
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) return [`${manifestFile} lists no asset`];
  const builtDirectory = path.join(distDirectory, ATLAS_ASSET_URL_PATH);
  const builtManifest = path.join(builtDirectory, 'manifest.json');
  const failures = [];
  if (!fs.existsSync(builtManifest)) failures.push(`${ATLAS_ASSET_URL_PATH}manifest.json is not in the built site`);
  else if (sha256Of(builtManifest) !== sha256Of(manifestFile)) failures.push(`${ATLAS_ASSET_URL_PATH}manifest.json in the built site differs from ${manifestFile}`);
  for (const asset of manifest.assets) {
    const builtFile = path.resolve(builtDirectory, String(asset.path));
    if (!builtFile.startsWith(`${path.resolve(builtDirectory)}${path.sep}`)) {
      failures.push(`${asset.path}: resolves outside the asset folder`);
    } else if (!fs.existsSync(builtFile)) {
      failures.push(`${asset.path}: listed in the manifest but not in the built site`);
    } else if (fs.statSync(builtFile).size !== asset.bytes || sha256Of(builtFile) !== asset.sha256) {
      failures.push(`${asset.path}: the built file's length or sha256 differs from the manifest`);
    }
  }
  const supportFiles = manifest.support_files ?? {};
  if (Object.keys(supportFiles).length === 0) failures.push(`${manifestFile} lists no notice or label table`);
  for (const [relative, digest] of Object.entries(supportFiles)) {
    const builtFile = path.resolve(builtDirectory, relative);
    if (!builtFile.startsWith(`${path.resolve(builtDirectory)}${path.sep}`) || !fs.existsSync(builtFile)) {
      failures.push(`${relative}: listed in the manifest but not in the built site`);
    } else if (sha256Of(builtFile) !== digest) {
      failures.push(`${relative}: the served file differs from what the pipeline wrote`);
    }
  }
  if (fs.existsSync(builtDirectory)) {
    const expected = new Set(['manifest.json', ...manifest.assets.map((asset) => String(asset.path)), ...Object.keys(supportFiles)]);
    failures.push(...listFiles(builtDirectory).filter((relative) => !expected.has(relative)).map((relative) => `${relative}: served but not in the manifest`));
  }
  return failures;
}

/**
 * The built attribution page shows, as text, the fixed statement and every attribution and
 * required wording of every source the manifest names.
 *
 * @param {string} distDirectory
 * @param {{ manifestFile?: string, sourcesFile?: string }} [files]
 * @returns {string[]} failure messages
 */
export function findAttributionFailures(distDirectory, { manifestFile = DEFAULT_MANIFEST_FILE, sourcesFile = DEFAULT_SOURCES_FILE } = {}) {
  const pageFile = path.join(distDirectory, ATTRIBUTION_URL_PATH, 'index.html');
  if (!fs.existsSync(pageFile)) return [`${ATTRIBUTION_URL_PATH} was not built`];
  if (!fs.existsSync(manifestFile)) return [`${manifestFile} is missing; the attribution page cannot be checked`];
  const pageText = visibleText(fs.readFileSync(pageFile, 'utf-8'));
  const manifest = readJson(manifestFile);
  const namedSourceIds = new Set(manifest.assets.flatMap((asset) => [...asset.source_ids, ...asset.computed_with_source_ids]));
  if (namedSourceIds.size === 0) return [`${manifestFile} names no source`];
  const sources = readJson(sourcesFile).sources.filter((source) => namedSourceIds.has(source.id));
  const failures = [...namedSourceIds].filter((sourceId) => !sources.some((source) => source.id === sourceId))
    .map((sourceId) => `source "${sourceId}" is named by the manifest but is not in ${sourcesFile}`);
  if (!pageText.includes(collapse(LICENSE_READING_STATEMENT))) failures.push(`${ATTRIBUTION_URL_PATH}: the statement that license readings were made by AI is missing`);
  const materialIds = new Set(manifest.assets.flatMap((asset) => asset.source_ids));
  for (const asset of manifest.assets) {
    const licenseName = SHIPPING_LICENSE_NAMES[asset.license_id];
    if (licenseName === undefined || !pageText.includes(licenseName)) failures.push(`${ATTRIBUTION_URL_PATH}: missing the license name for ${asset.id} (${asset.license_id})`);
    if (!pageText.includes(collapse(String(asset.modification_note)))) failures.push(`${ATTRIBUTION_URL_PATH}: missing the changes made to ${asset.id}`);
    if (asset.license_id === SHARE_ALIKE_LICENSE_ID && !pageText.includes(SHARE_ALIKE_STATEMENT)) failures.push(`${ATTRIBUTION_URL_PATH}: missing the share-alike statement for ${asset.id}`);
  }
  for (const source of sources) {
    if (!materialIds.has(source.id) && source.redistribute !== false) failures.push(`source "${source.id}" is only computed with but is not marked pipeline-only`);
    const wordings = [source.attribution_text ?? source.name, ...source.required_text];
    for (const wording of wordings) {
      if (!pageText.includes(collapse(wording))) failures.push(`${ATTRIBUTION_URL_PATH}: missing wording for "${source.id}": ${collapse(wording).slice(0, 80)}`);
    }
  }
  return failures;
}
