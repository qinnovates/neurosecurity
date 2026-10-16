/**
 * Deterministic STIX identifiers for TARA techniques and variants.
 *
 * The scheme is the one the Python SDK uses in datalake/qtara/src/qtara/stix.py, so the site
 * export (/api/stix.json) and the SDK export (`qtara stix`) give the same id to the same entry:
 * UUIDv5 (RFC 4122, SHA-1 name-based) in the DNS namespace over `qif.tara.<entry id>`.
 * Both sides are pinned to datalake/qtara/tests/fixtures/stix_ids.json by their test suites.
 *
 * SHA-1 is used here only because RFC 4122 version 5 defines it for naming; nothing secret is hashed.
 */
import { createHash } from 'node:crypto';

/** `uuid.NAMESPACE_DNS` in Python's standard library. */
export const STIX_ID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
export const STIX_ID_NAME_PREFIX = 'qif.tara.';

const TECHNIQUE_ID_PATTERN = /^QIF-T\d{4}$/;
const VARIANT_ID_PATTERN = /^QIF-T\d{4}-V\d{2}$/;
const UUID_VERSION_5 = 0x50;
const UUID_VARIANT_RFC4122 = 0x80;

export class StixIdError extends Error {
  constructor(entryId: string) {
    super(`stix-ids: "${entryId}" is not a QIF technique id (QIF-T0001) or variant id (QIF-T0001-V01); fix the registrar entry before exporting.`);
    this.name = 'StixIdError';
  }
}

function uuidV5(name: string, namespace: string): string {
  const namespaceBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const bytes = createHash('sha1').update(namespaceBytes).update(name, 'utf8').digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | UUID_VERSION_5;
  bytes[8] = (bytes[8] & 0x3f) | UUID_VARIANT_RFC4122;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function assertEntryId(entryId: string): void {
  if (!TECHNIQUE_ID_PATTERN.test(entryId) && !VARIANT_ID_PATTERN.test(entryId)) {
    throw new StixIdError(entryId);
  }
}

/** STIX id of the attack-pattern for a technique or variant id. Mirrors `attack_pattern_id` in the SDK. */
export function attackPatternStixId(entryId: string): string {
  assertEntryId(entryId);
  return `attack-pattern--${uuidV5(`${STIX_ID_NAME_PREFIX}${entryId}`, STIX_ID_NAMESPACE)}`;
}

/** STIX id of the variant-to-parent relationship. Mirrors `variant_relationship` in the SDK. */
export function variantRelationshipStixId(variantId: string, parentId: string): string {
  assertEntryId(variantId);
  assertEntryId(parentId);
  return `relationship--${uuidV5(`${STIX_ID_NAME_PREFIX}${variantId}.variant-of.${parentId}`, STIX_ID_NAMESPACE)}`;
}
