/**
 * Parser for the asset manifest. It holds the pipeline's output to the
 * registry: every asset path is inside the two served folders and carries its
 * own hash, sits in the folder its licence requires, and is made only from
 * sources that are buildable today, so an asset cannot outlive its clearance.
 */

import { isRecord } from '@/lib/threat-model/guards';
import {
  childOf, failAt, itemOf, readEnum, readInteger, readList, readRecord, readString, readStringList, rejectDuplicates, rootOf,
  show, type FieldLocation,
} from './field-readers';
import { readSchemaVersion, readSha256 } from './format-readers';
import { LICENCE_FACTS } from './licence-rules';
import {
  ASSET_KINDS, POSITION_CHECKS,
  type AssetManifest, type ManifestAsset, type ManifestContext, type ManifestRouteStep,
} from './manifest-types';
import { parseCheck, parseDelineation, parseNode } from './parse-manifest-node';
import { parseStageFingerprints } from './parse-manifest-stages';
import { LAYER_IDS, LICENCE_IDS, ROUTE_KINDS, type LicenceId } from './source-types';

export const MANIFEST_FILE = 'src/site/atlas-assets/manifest.json';
const MANIFEST_SCHEMA_VERSION = 2;
/** Checked at build and again by the page before any fetch. */
export const ASSET_PATH_PATTERN = /^(open|by-sa)\/[a-z0-9._-]+$/;
const PARENT_SEGMENT = '..';
const HASH_PREFIX_LENGTH = 12;
const MAX_TEXT_LENGTH = 300;
const MAX_NOTE_LENGTH = 600;
const ASSET_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const ASSET_KEYS = [
  'id', 'path', 'kind', 'layer', 'bytes', 'sha256', 'input_fingerprint', 'source_ids', 'computed_with_source_ids', 'license_id',
  'stated_license_id', 'route', 'delineation', 'libraries', 'nodes', 'checks', 'stage_fingerprints', 'position_check', 'modification_note',
] as const;

function readAssetPath(record: Record<string, unknown>, location: FieldLocation, sha256: string, licenceId: LicenceId): string {
  const path = readString(record, 'path', location, MAX_TEXT_LENGTH);
  const pathLocation = childOf(location, 'path');
  if (!ASSET_PATH_PATTERN.test(path) || path.includes(PARENT_SEGMENT)) {
    return failAt(pathLocation, `"${path}" is not an allowed asset path`, 'Use open/<file> or by-sa/<file> with lower-case letters, digits, dots, hyphens and underscores.');
  }
  const hashPrefix = sha256.slice(0, HASH_PREFIX_LENGTH);
  if (!path.includes(`.${hashPrefix}.`)) {
    return failAt(pathLocation, `the file name must contain "${hashPrefix}", the start of the file's own sha256`, 'Rebuild with the pipeline; it names each file after its content.');
  }
  const requiredFolder = LICENCE_FACTS[licenceId].output_folder;
  if (requiredFolder === null || !path.startsWith(`${requiredFolder}/`)) {
    return failAt(pathLocation, `an asset under "${licenceId}" belongs in "${show(requiredFolder)}/"`, 'Move the file, or correct the licence; share-alike material is kept apart.');
  }
  return path;
}

function readSourceIds(record: Record<string, unknown>, location: FieldLocation, context: ManifestContext): string[] {
  const sourceIds = readStringList(record, 'source_ids', location, MAX_TEXT_LENGTH);
  const sourcesLocation = childOf(location, 'source_ids');
  if (sourceIds.length === 0) return failAt(sourcesLocation, 'an asset must name the sources its material comes from', 'List at least one source id.');
  for (const sourceId of sourceIds) {
    if (!context.statedLicenceBySource.has(sourceId)) {
      return failAt(sourcesLocation, `"${sourceId}" is not a source in the registry`, 'Add the source to qif-anatomy-sources.json or correct the id.');
    }
    if (!context.buildableSourceIds.has(sourceId)) {
      return failAt(sourcesLocation, `source "${sourceId}" is not buildable, so no file made from it may ship`, 'Remove the asset, or clear the source in qif-anatomy-verdicts.json first.');
    }
  }
  return sourceIds;
}

function readLicenceIds(
  record: Record<string, unknown>, location: FieldLocation, sourceIds: readonly string[], context: ManifestContext,
): Pick<ManifestAsset, 'license_id' | 'stated_license_id'> {
  const licenceId = readEnum(record, 'license_id', location, LICENCE_IDS);
  const statedLicenceId = readEnum(record, 'stated_license_id', location, LICENCE_IDS);
  for (const sourceId of sourceIds) {
    const effective = context.effectiveLicenceBySource.get(sourceId);
    if (effective !== licenceId) {
      return failAt(childOf(location, 'license_id'), `"${licenceId}" is not the licence "${show(effective)}" that source "${sourceId}" is handled under`,
        'The licence is derived from the registry and the verdict; rebuild the manifest. One asset holds material under one licence only.');
    }
    if (context.statedLicenceBySource.get(sourceId) !== statedLicenceId) {
      return failAt(childOf(location, 'stated_license_id'), `"${statedLicenceId}" is not the licence source "${sourceId}" states`, 'Rebuild the manifest from the registry.');
    }
  }
  return { license_id: licenceId, stated_license_id: statedLicenceId };
}

function parseRouteStep(value: unknown, location: FieldLocation): ManifestRouteStep {
  const record = readRecord(value, location, { required: ['kind'], optional: ['publisher_registration'] });
  const step: ManifestRouteStep = { kind: readEnum(record, 'kind', location, ROUTE_KINDS) };
  if (record.publisher_registration === undefined) return step;
  const registrationLocation = childOf(location, 'publisher_registration');
  const registration = readRecord(record.publisher_registration, registrationLocation, { required: ['target', 'method'] });
  return {
    ...step,
    publisher_registration: {
      target: readString(registration, 'target', registrationLocation, MAX_TEXT_LENGTH),
      method: readString(registration, 'method', registrationLocation, MAX_TEXT_LENGTH),
    },
  };
}

function readLibraries(record: Record<string, unknown>, location: FieldLocation): Record<string, string> {
  const libraries = record.libraries;
  if (!isRecord(libraries) || !Object.values(libraries).every((version) => typeof version === 'string')) {
    return failAt(childOf(location, 'libraries'), 'expected library names with version strings', 'Write an object such as { "scikit-image": "0.26.0" }.');
  }
  return libraries as Record<string, string>;
}

/** File name -> registry pin, over every source the asset was made from or computed with. */
function listInputPins(sourceIds: readonly string[], context: ManifestContext): Map<string, string | null> {
  return new Map(sourceIds.flatMap((sourceId) => [...(context.filePinsBySource.get(sourceId) ?? [])]));
}

function parseAsset(value: unknown, location: FieldLocation, context: ManifestContext): ManifestAsset {
  const record = readRecord(value, location, { required: ASSET_KEYS });
  const id = readString(record, 'id', location, MAX_TEXT_LENGTH);
  if (!ASSET_ID_PATTERN.test(id)) failAt(childOf(location, 'id'), `"${id}" is not a valid asset id`, 'Use lower-case letters, digits, hyphens and underscores.');
  const sha256 = readSha256(record, 'sha256', location);
  const sourceIds = readSourceIds(record, location, context);
  const licenceIds = readLicenceIds(record, location, sourceIds, context);
  const computedWith = readStringList(record, 'computed_with_source_ids', location, MAX_TEXT_LENGTH);
  const strayInput = computedWith.find((sourceId) => !context.statedLicenceBySource.has(sourceId));
  if (strayInput !== undefined) failAt(childOf(location, 'computed_with_source_ids'), `"${strayInput}" is not a source in the registry`, 'Add the source or correct the id.');
  const listedTwice = computedWith.find((sourceId) => sourceIds.includes(sourceId));
  if (listedTwice !== undefined) failAt(childOf(location, 'computed_with_source_ids'), `"${listedTwice}" is also in source_ids`, 'A source either supplies material to the file or is only computed with; list it once.');
  const nodes = readList(record, 'nodes', location).map((node, index) => parseNode(node, itemOf(location, 'nodes', index), sourceIds));
  rejectDuplicates(nodes.map((node) => `${node.extras.atlas}:${node.extras.label_id}:${node.extras.hemisphere}`), childOf(location, 'nodes'), 'node');
  return {
    id,
    path: readAssetPath(record, location, sha256, licenceIds.license_id),
    kind: readEnum(record, 'kind', location, ASSET_KINDS),
    layer: readEnum(record, 'layer', location, LAYER_IDS),
    bytes: readInteger(record, 'bytes', location, 1),
    sha256,
    input_fingerprint: readSha256(record, 'input_fingerprint', location),
    source_ids: sourceIds,
    computed_with_source_ids: computedWith,
    ...licenceIds,
    route: readList(record, 'route', location).map((step, index) => parseRouteStep(step, itemOf(location, 'route', index))),
    delineation: parseDelineation(record.delineation, childOf(location, 'delineation')),
    libraries: readLibraries(record, location),
    nodes,
    checks: readList(record, 'checks', location).map((check, index) => parseCheck(check, itemOf(location, 'checks', index))),
    stage_fingerprints: parseStageFingerprints(record.stage_fingerprints, childOf(location, 'stage_fingerprints'), listInputPins([...sourceIds, ...computedWith], context)),
    position_check: readEnum(record, 'position_check', location, POSITION_CHECKS),
    modification_note: readString(record, 'modification_note', location, MAX_NOTE_LENGTH),
  };
}

export function parseManifest(raw: unknown, context: ManifestContext): AssetManifest {
  const root = rootOf(MANIFEST_FILE);
  const record = readRecord(raw, root, {
    required: ['schema_version', 'template_space', 'units', 'axes', 'pipeline_code_hash', 'integrity_note', 'assets'],
  });
  const schemaVersion = readSchemaVersion(record, root, MANIFEST_SCHEMA_VERSION);
  if (record.template_space !== context.declaredSpace) {
    failAt(childOf(root, 'template_space'), `"${show(record.template_space)}" is not the declared space "${context.declaredSpace}"`, 'Rebuild the assets in the declared space.');
  }
  const assets = readList(record, 'assets', root).map((asset, index) => parseAsset(asset, itemOf(root, 'assets', index), context));
  rejectDuplicates(assets.map((asset) => asset.id), childOf(root, 'assets'), 'asset id');
  rejectDuplicates(assets.map((asset) => asset.path), childOf(root, 'assets'), 'asset path');
  return {
    schema_version: schemaVersion,
    template_space: context.declaredSpace,
    units: readEnum(record, 'units', root, ['mm']),
    axes: readEnum(record, 'axes', root, ['RAS']),
    pipeline_code_hash: readSha256(record, 'pipeline_code_hash', root),
    integrity_note: readString(record, 'integrity_note', root, MAX_TEXT_LENGTH),
    assets,
  };
}
