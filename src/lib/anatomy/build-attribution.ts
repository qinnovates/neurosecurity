/**
 * What the attribution page says, as data: one entry per source named by any
 * shipped asset, built from the registry and the manifest so the page, the
 * notices beside the files and the tests read the same record.
 */

import { LICENCE_FACTS } from './licence-rules';
import type { AssetManifest, PositionCheck } from './manifest-types';
import type { AnatomySource, AnatomySources, LicenceId } from './source-types';

export interface LicenseLink {
  id: LicenceId;
  name: string;
  url: string | null;
}

export interface AttributionAsset {
  path: string;
  modification_note: string;
  position_check: PositionCheck;
  /** What the position check does and does not show, in a sentence. */
  position_sentence: string;
}

export interface AttributionEntry {
  source_id: string;
  name: string;
  attribution_text: string;
  urls: string[];
  /** The license the material is handled under here. */
  license: LicenseLink;
  /** What the publisher states, when it differs from the license above. */
  stated_license: LicenseLink | null;
  required_text: string[];
  /** Present when the files are share-alike adapted material: what a reuser must do. */
  share_alike_statement: string | null;
  /** False for an input used only to compute a file: none of its material is in what ships. */
  redistributed: boolean;
  route_note: string;
  assets: AttributionAsset[];
}

/** What each position check value means for a reader. */
export const POSITION_CHECK_SENTENCES: Readonly<Record<PositionCheck, string>> = {
  'independently checked': 'Placement was checked by a measure independent of how the shape was moved, for each shape.',
  'checked in aggregate': 'Placement was checked for the cortex as a whole by an independent measure, not for each fold.',
  'not independently checked': 'Placement was not independently checked.',
  failed: 'Placement failed an independent check.',
};

/** Shown beside share-alike files; the same sentence is in by-sa/LICENSE.txt. */
export const SHARE_ALIKE_STATEMENT = 'You may share and adapt these files, including commercially, provided you give credit, indicate changes, and distribute your contributions under the same licence, with no further restrictions.';

export const LICENSE_LINKS: Readonly<Record<LicenceId, { name: string; url: string | null }>> = {
  'cc-by-4.0': { name: 'Creative Commons Attribution 4.0 International', url: 'https://creativecommons.org/licenses/by/4.0/' },
  'cc0-1.0': { name: 'CC0 1.0 Universal', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  'cc-by-sa-4.0': { name: 'Creative Commons Attribution-ShareAlike 4.0 International', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  'mit': { name: 'MIT License', url: 'https://opensource.org/license/mit' },
  'mni-icbm-notice': { name: 'MNI ICBM152 permission notice', url: 'https://nist.mni.mcgill.ca/icbm-152-nonlinear-atlases-2009/' },
  'melbourne-subcortex': { name: 'Melbourne Subcortex Atlas License', url: null },
  'freesurfer-sla-1.0': { name: 'FreeSurfer Software License Agreement v1.0', url: null },
  'hcp-data-use-terms': { name: 'WU-Minn HCP Open Access Data Use Terms', url: null },
  'none-stated': { name: 'No license stated', url: null },
};

/** Statements the page must carry whatever ships. The post-build check looks for each in the built page's text. */
export const ATTRIBUTION_STATEMENTS = {
  licenseReading: 'The license readings on this page were made by AI and not by a lawyer. No person has confirmed them. They are not legal advice.',
  anatomy: 'No neuroanatomist has checked these shapes, or which structure each is said to show.',
  changes: 'Every shape was changed from its source: meshed from a labelled volume, smoothed, and reduced in triangle count. Some were also moved between template spaces or mirrored. What was done to each file is stated beside it.',
  integrity: 'File hashes show that a file was delivered unchanged. They do not prove where a file came from.',
} as const;

function linkFor(licenseId: LicenceId): LicenseLink {
  return { id: licenseId, ...LICENSE_LINKS[licenseId] };
}

function entryFor(source: AnatomySource, effectiveLicense: LicenceId, redistributed: boolean, manifest: AssetManifest): AttributionEntry {
  const assets = manifest.assets
    .filter((asset) => asset.source_ids.includes(source.id))
    .map((asset) => ({
      path: asset.path, modification_note: asset.modification_note, position_check: asset.position_check,
      position_sentence: POSITION_CHECK_SENTENCES[asset.position_check],
    }));
  return {
    source_id: source.id,
    name: source.name,
    attribution_text: source.attribution_text ?? source.name,
    urls: source.urls,
    license: linkFor(effectiveLicense),
    stated_license: effectiveLicense === source.license_id ? null : linkFor(source.license_id),
    required_text: source.required_text,
    share_alike_statement: redistributed && LICENCE_FACTS[effectiveLicense].share_alike ? SHARE_ALIKE_STATEMENT : null,
    redistributed,
    route_note: source.route.note,
    assets,
  };
}

/**
 * One entry for every source any shipped asset names: sources whose material
 * is in a file first, then inputs that were only computed with.
 *
 * @param effectiveLicenseBySource source id -> the license the source is handled under
 */
export function buildAttributionEntries(
  sources: AnatomySources, effectiveLicenseBySource: ReadonlyMap<string, LicenceId>, manifest: AssetManifest | null,
): AttributionEntry[] {
  if (manifest === null) return [];
  const materialIds = new Set(manifest.assets.flatMap((asset) => asset.source_ids));
  const inputIds = new Set(manifest.assets.flatMap((asset) => asset.computed_with_source_ids).filter((sourceId) => !materialIds.has(sourceId)));
  const build = (sourceIds: ReadonlySet<string>, redistributed: boolean): AttributionEntry[] => sources.sources
    .filter((source) => sourceIds.has(source.id))
    .map((source) => entryFor(source, effectiveLicenseBySource.get(source.id) ?? source.license_id, redistributed, manifest));
  return [...build(materialIds, true), ...build(inputIds, false)];
}

/** Every sentence the page must show for these entries: each source's attribution and required wording, and the fixed statements. */
export function listRequiredWordings(entries: readonly AttributionEntry[]): string[] {
  return [...Object.values(ATTRIBUTION_STATEMENTS), ...entries.flatMap((entry) => [
    entry.attribution_text, ...entry.required_text, entry.license.name,
    ...(entry.share_alike_statement === null ? [] : [entry.share_alike_statement]),
    ...entry.assets.flatMap((asset) => [asset.modification_note, asset.position_sentence]),
  ])];
}
