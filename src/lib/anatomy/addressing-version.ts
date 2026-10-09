/**
 * Which QIF addressing version the atlas file is in. A crosswalk row or a
 * technique link says which versions it holds for, and only rows valid for the
 * atlas file's version are drawn or lit; any other row fails closed.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { AnatomyDataError } from './errors';
import { childOf, failAt, readList, type FieldLocation } from './field-readers';

/**
 * The addressing version of qif-brain-bci-atlas.json while the file declares
 * none. The day the file gains `_metadata.addressing_version`, the declared
 * value is read instead and a content test fails until this constant is removed.
 */
export const UNDECLARED_ADDRESSING_VERSION = 1;

const ATLAS_FILE = 'datalake/qif-brain-bci-atlas.json';
const VERSION_KEY = 'addressing_version';
const FIRST_VERSION = 1;

/** The version the atlas file declares, or undefined while it declares none. */
export function readDeclaredAddressingVersion(atlas: unknown): number | undefined {
  const metadata = isRecord(atlas) && isRecord(atlas._metadata) ? atlas._metadata : {};
  if (!Object.hasOwn(metadata, VERSION_KEY)) return undefined;
  const declared = metadata[VERSION_KEY];
  if (typeof declared !== 'number' || !Number.isInteger(declared) || declared < FIRST_VERSION) {
    throw new AnatomyDataError(ATLAS_FILE, `_metadata.${VERSION_KEY}`, `"${String(declared)}" is not an addressing version`, 'Write a whole number of at least 1.');
  }
  return declared;
}

export function currentAddressingVersion(atlas: unknown): number {
  return readDeclaredAddressingVersion(atlas) ?? UNDECLARED_ADDRESSING_VERSION;
}

/** The addressing versions a row holds for: at least one, each a positive whole number, none twice. */
export function readValidForAddressing(record: Record<string, unknown>, location: FieldLocation): number[] {
  const versions = readList(record, 'valid_for_addressing', location);
  const fieldLocation = childOf(location, 'valid_for_addressing');
  if (versions.length === 0) {
    return failAt(fieldLocation, 'a row must be valid for at least one addressing version', 'List the versions it holds for, for example [1].');
  }
  const badVersion = versions.find((version) => typeof version !== 'number' || !Number.isInteger(version) || version < FIRST_VERSION);
  if (badVersion !== undefined) return failAt(fieldLocation, `"${String(badVersion)}" is not an addressing version`, 'Write whole numbers of at least 1.');
  const repeated = versions.find((version, index) => versions.indexOf(version) !== index);
  if (repeated !== undefined) return failAt(fieldLocation, `version ${String(repeated)} appears twice`, 'List each version once.');
  return versions as number[];
}

export function isValidForAddressing(row: { valid_for_addressing: readonly number[] }, addressingVersion: number): boolean {
  return row.valid_for_addressing.includes(addressingVersion);
}
