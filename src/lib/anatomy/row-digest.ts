/**
 * Digests that bind a review to exactly what was reviewed. A digest covers the
 * row and what the row points at, so editing the row, re-pointing a label or
 * rebuilding the mesh makes the row read as unreviewed again.
 *
 * Build time only: this module uses node:crypto and must not be imported by
 * code that runs in the browser.
 */

import { createHash } from 'node:crypto';
import { isRecord } from '@/lib/threat-model/guards';
import type { AtlasLabel, CrosswalkRow, TechniqueLink } from './anatomy-types';
import type { TermResolution } from './resolve-region-term';

const KEY_SEPARATOR = ':';

/** JSON with object keys sorted at every depth, so equal values always give equal text. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  const members = Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${members.join(',')}}`;
}

export function sha256Hex(content: string | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}

/** The ledger key of a crosswalk row: `subject_kind:subject_id:atlas:part`, with an empty part when the row has none. */
export function crosswalkRowKey(row: Pick<CrosswalkRow, 'subject_kind' | 'subject_id' | 'atlas' | 'part'>): string {
  return [row.subject_kind, row.subject_id, row.atlas, row.part ?? ''].join(KEY_SEPARATOR);
}

/** The ledger key of a technique link: `technique_id:term`. */
export function techniqueLinkKey(techniqueId: string, term: string): string {
  return `${techniqueId}${KEY_SEPARATOR}${term}`;
}

/**
 * @param labels the label-table entries for the row's atlas_ids
 * @param meshSha256s the sha256 of every asset that draws those labels
 */
export function digestCrosswalkRow(row: CrosswalkRow, labels: readonly AtlasLabel[], meshSha256s: readonly string[]): string {
  return sha256Hex(canonicalJson({ row, labels, mesh_sha256s: [...meshSha256s].sort() }));
}

/** Covers the link and what its term resolves to, so reclassifying an alias un-reviews every link that uses it. */
export function digestTechniqueLink(techniqueId: string, link: TechniqueLink, resolution: TermResolution): string {
  return sha256Hex(canonicalJson({ technique_id: techniqueId, link, resolution }));
}

export type DeviceRowKind = 'fiducial' | 'lead';

/** The ledger key of a device geometry row: `fiducial:<id>` or `lead:<id>`. */
export function deviceRowKey(kind: DeviceRowKind, id: string): string {
  return `${kind}${KEY_SEPARATOR}${id}`;
}

/** Covers the whole row, so changing one dimension or one quoted source un-reviews it. */
export function digestDeviceRow(row: object): string {
  return sha256Hex(canonicalJson(row));
}
