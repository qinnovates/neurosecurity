/**
 * Parser for a manifest asset's stage fingerprints. The fetch stage is where
 * the manifest is tied back to the registry: every file an asset was made from
 * is written `<source id>/<file name>` and must be a file the registry lists for
 * that source, pinned, with the same sha256. An asset built from other bytes than the pinned ones is refused.
 */

import { isRecord } from '@/lib/threat-model/guards';
import { childOf, failAt, readInteger, readNullable, readRecord, readString, show, type FieldLocation } from './field-readers';
import { readSha256, requireSha256 } from './format-readers';
import { PIPELINE_STAGES, type RegisterFingerprint, type StageFingerprints } from './manifest-types';

const MAX_TEXT_LENGTH = 200;
const REGISTER_KEYS = ['archive_sha256', 'setting', 'tool', 'tool_version', 'seed', 'parameters'] as const;
const DIGEST_STAGES = ['resample', 'mesh', 'write'] as const;
const SOURCE_SEPARATOR = '/';

/** A non-empty map of file name to sha256. */
function readDigestMap(value: unknown, location: FieldLocation): Record<string, string> {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return failAt(location, 'expected file names with their sha256 digests', 'Write an object such as { "labels.nii.gz": "<sha256>" } with at least one file.');
  }
  return Object.fromEntries(Object.entries(value).map(([fileName, digest]) => [fileName, requireSha256(digest, childOf(location, fileName))]));
}

/** Which sources an asset's fetched files may belong to, and the registry's pin for each of their files. */
export interface FetchContext {
  materialSourceIds: readonly string[];
  pipelineInputIds: readonly string[];
  filePinsBySource: ReadonlyMap<string, ReadonlyMap<string, string | null>>;
}

/** Holds one fetched file, written `<source id>/<file name>`, to the registry's pin for that file of that source. */
function checkFetchedFile(key: string, digest: string, location: FieldLocation, context: FetchContext): void {
  const separatorAt = key.indexOf(SOURCE_SEPARATOR);
  if (separatorAt <= 0) failAt(location, 'a fetched file is written as <source id>/<file name>', 'Prefix the file name with the id of the source it belongs to.');
  const [sourceId, fileName] = [key.slice(0, separatorAt), key.slice(separatorAt + 1)];
  if (![...context.materialSourceIds, ...context.pipelineInputIds].includes(sourceId)) {
    failAt(location, `"${show(sourceId)}" is not one of this asset's sources or pipeline inputs`, 'List the source under source_ids or computed_with_source_ids.');
  }
  const pins = context.filePinsBySource.get(sourceId);
  if (pins === undefined || !pins.has(fileName)) {
    failAt(location, `the registry lists no such file for source "${sourceId}"`, 'Add the file to the source row in qif-anatomy-sources.json.');
  }
  const pin = pins?.get(fileName) ?? null;
  if (pin === null) failAt(location, 'the registry has no sha256 pin for this file', 'Pin the file in qif-anatomy-sources.json before an asset made from it ships.');
  if (pin !== digest) failAt(location, 'the sha256 differs from the registry\'s pin', 'Rebuild from the pinned file, or re-pin the source in a reviewed change and rebuild.');
}

function parseFetch(value: unknown, location: FieldLocation, context: FetchContext): Record<string, string> {
  const fetched = readDigestMap(value, location);
  for (const [key, digest] of Object.entries(fetched)) {
    checkFetchedFile(key, digest, { dataFile: location.dataFile, path: `${location.path}[${JSON.stringify(show(key))}]` }, context);
  }
  const unfetched = context.materialSourceIds.find((sourceId) => !Object.keys(fetched).some((key) => key.startsWith(`${sourceId}${SOURCE_SEPARATOR}`)));
  if (unfetched !== undefined) {
    failAt(location, `no fetched file belongs to the material source "${unfetched}"`, 'An asset made from a source lists at least one of that source\'s pinned files.');
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

export function parseStageFingerprints(value: unknown, location: FieldLocation, context: FetchContext): StageFingerprints {
  const record = readRecord(value, location, { required: PIPELINE_STAGES });
  const readDigest = (stage: typeof DIGEST_STAGES[number]): string | null => readNullable(record, stage, () => readSha256(record, stage, location));
  return {
    fetch: parseFetch(record.fetch, childOf(location, 'fetch'), context),
    register: readNullable(record, 'register', () => parseRegister(record.register, childOf(location, 'register'))),
    resample: readDigest('resample'),
    mesh: readDigest('mesh'),
    write: readDigest('write'),
  };
}
