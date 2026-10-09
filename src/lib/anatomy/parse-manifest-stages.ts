/**
 * Parser for a manifest asset's stage fingerprints. The fetch stage is where
 * the manifest is tied back to the registry: every file an asset was made from
 * must be a file the registry lists for one of the asset's sources, pinned, with
 * the same sha256. An asset built from other bytes than the pinned ones is refused.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { childOf, failAt, readInteger, readNullable, readRecord, readString, type FieldLocation } from './field-readers';
import { readSha256, requireSha256 } from './format-readers';
import { PIPELINE_STAGES, type RegisterFingerprint, type StageFingerprints } from './manifest-types';

const MAX_TEXT_LENGTH = 200;
const REGISTER_KEYS = ['archive_sha256', 'setting', 'tool', 'tool_version', 'seed', 'parameters'] as const;
const DIGEST_STAGES = ['resample', 'mesh', 'write'] as const;

/** A non-empty map of file name to sha256. */
function readDigestMap(value: unknown, location: FieldLocation): Record<string, string> {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return failAt(location, 'expected file names with their sha256 digests', 'Write an object such as { "labels.nii.gz": "<sha256>" } with at least one file.');
  }
  return Object.fromEntries(Object.entries(value).map(([fileName, digest]) => [fileName, requireSha256(digest, childOf(location, fileName))]));
}

function parseFetch(value: unknown, location: FieldLocation, inputPins: ReadonlyMap<string, string | null>): Record<string, string> {
  const fetched = readDigestMap(value, location);
  for (const [fileName, digest] of Object.entries(fetched)) {
    const fileLocation = childOf(location, fileName);
    if (!inputPins.has(fileName)) {
      failAt(fileLocation, 'this file is not listed in the registry for any of the asset\'s sources', 'Add the file to the source row, or list the source the file belongs to.');
    }
    const pin = inputPins.get(fileName) ?? null;
    if (pin === null) failAt(fileLocation, 'the registry has no sha256 pin for this file', 'Pin the file in qif-anatomy-sources.json before an asset made from it ships.');
    if (pin !== digest) failAt(fileLocation, 'the sha256 differs from the registry\'s pin', 'Rebuild from the pinned file, or re-pin the source in a reviewed change and rebuild.');
  }
  return fetched;
}

function readParameters(value: unknown, location: FieldLocation): RegisterFingerprint['parameters'] {
  const isSimple = (parameter: unknown): boolean => ['string', 'boolean'].includes(typeof parameter) || (typeof parameter === 'number' && Number.isFinite(parameter));
  if (!isRecord(value) || !Object.values(value).every(isSimple)) {
    return failAt(location, 'expected parameter names with text, number or true/false values', 'Write a flat object of the registration parameters.');
  }
  return value as RegisterFingerprint['parameters'];
}

function parseRegister(value: unknown, location: FieldLocation): RegisterFingerprint {
  const record = readRecord(value, location, { required: REGISTER_KEYS });
  return {
    archive_sha256: readDigestMap(record.archive_sha256, childOf(location, 'archive_sha256')),
    setting: readString(record, 'setting', location, MAX_TEXT_LENGTH),
    tool: readString(record, 'tool', location, MAX_TEXT_LENGTH),
    tool_version: readString(record, 'tool_version', location, MAX_TEXT_LENGTH),
    seed: readInteger(record, 'seed', location, 0),
    parameters: readParameters(record.parameters, childOf(location, 'parameters')),
  };
}

/**
 * @param inputPins file name -> registry pin, over the asset's sources and pipeline-only inputs
 */
export function parseStageFingerprints(value: unknown, location: FieldLocation, inputPins: ReadonlyMap<string, string | null>): StageFingerprints {
  const record = readRecord(value, location, { required: PIPELINE_STAGES });
  const readDigest = (stage: typeof DIGEST_STAGES[number]): string | null => readNullable(record, stage, () => readSha256(record, stage, location));
  return {
    fetch: parseFetch(record.fetch, childOf(location, 'fetch'), inputPins),
    register: readNullable(record, 'register', () => parseRegister(record.register, childOf(location, 'register'))),
    resample: readDigest('resample'),
    mesh: readDigest('mesh'),
    write: readDigest('write'),
  };
}
