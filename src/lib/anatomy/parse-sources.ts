/**
 * Parser for the source registry, datalake/qif-anatomy-sources.json: one row
 * per upstream atlas or template, with its stated licence, its files and how it
 * reaches the declared template space.
 */

import { DELINEATION_BASES } from './anatomy-types';
import { rejectBandKeys } from './band-key-scan';
import {
  childOf, failAt, itemOf, readBoolean, readEnum, readInteger, readList, readNullable, readRecord, readString,
  readStringList, rejectDuplicates, rootOf, type FieldLocation,
} from './field-readers';
import { readHttpsUrl, readId, readSchemaVersion, readSha256, readWebUrlList } from './format-readers';
import {
  DIGEST_ORIGINS, LAYER_IDS, LICENCE_IDS, ROUTE_KINDS, ROUTE_STATUSES,
  type AnatomySource, type AnatomySources, type LayerId, type RefusedSource, type SourceDelineation, type SourceFile, type SourceRoute,
} from './source-types';
import { SOURCES_STATUS, readStatus } from './status-sentences';

export const SOURCES_FILE = 'datalake/qif-anatomy-sources.json';
const SOURCES_SCHEMA_VERSION = 1;
const MAX_NAME_LENGTH = 200;
const MAX_TEXT_LENGTH = 1200;
const SOURCE_KEYS = [
  'id', 'name', 'attribution_text', 'urls', 'licence_id', 'redistribute', 'layers',
  'delineated_in', 'arrives_in', 'route', 'delineation', 'required_text', 'files',
] as const;

function parseFile(value: unknown, location: FieldLocation): SourceFile {
  const record = readRecord(value, location, { required: ['name', 'url', 'sha256', 'bytes', 'digest_origin'] });
  const file: SourceFile = {
    name: readString(record, 'name', location, MAX_NAME_LENGTH),
    url: readHttpsUrl(record, 'url', location),
    sha256: readNullable(record, 'sha256', () => readSha256(record, 'sha256', location)),
    bytes: readNullable(record, 'bytes', () => readInteger(record, 'bytes', location, 1)),
    digest_origin: readNullable(record, 'digest_origin', () => readEnum(record, 'digest_origin', location, DIGEST_ORIGINS)),
  };
  const isPinned = file.sha256 !== null;
  if (isPinned && (file.digest_origin === null || file.bytes === null)) {
    failAt(childOf(location, 'digest_origin'), 'a pinned file must say where its digest came from and how long the file is',
      'Set digest_origin to "publisher" or "first_download" and set bytes.');
  }
  return file;
}

function parseRoute(value: unknown, location: FieldLocation, source: { arrives_in: string }, declaredSpace: string): SourceRoute {
  const kind = readEnum(readRecord(value, location, { required: ['kind'], optional: ['status', 'note', 'publisher_registration'] }), 'kind', location, ROUTE_KINDS);
  const isPublisherRegistered = kind === 'publisher_registered';
  const record = readRecord(value, location, { required: isPublisherRegistered ? ['kind', 'status', 'note', 'publisher_registration'] : ['kind', 'status', 'note'] });
  const status = readEnum(record, 'status', location, ROUTE_STATUSES);
  if (kind === 'unknown' && status === 'settled') {
    failAt(childOf(location, 'status'), 'a route of kind "unknown" cannot be settled', 'Set status to "open", or record the route that was established.');
  }
  if (kind === 'declared_space' && source.arrives_in !== declaredSpace) {
    failAt(childOf(location, 'kind'), `only a source that arrives in "${declaredSpace}" can be the declared space`, 'Give this source the route that brings it there.');
  }
  const route: SourceRoute = { kind, status, note: readString(record, 'note', location, MAX_TEXT_LENGTH) };
  if (!isPublisherRegistered) return route;
  const registrationLocation = childOf(location, 'publisher_registration');
  const registration = readRecord(record.publisher_registration, registrationLocation, { required: ['target', 'method'] });
  return {
    ...route,
    publisher_registration: {
      target: readString(registration, 'target', registrationLocation, MAX_NAME_LENGTH),
      method: readString(registration, 'method', registrationLocation, MAX_NAME_LENGTH),
    },
  };
}

function parseDelineation(value: unknown, location: FieldLocation): SourceDelineation {
  const record = readRecord(value, location, { required: ['basis', 'subjects'] });
  return {
    basis: readNullable(record, 'basis', () => readEnum(record, 'basis', location, DELINEATION_BASES)),
    subjects: readNullable(record, 'subjects', () => readInteger(record, 'subjects', location, 1)),
  };
}

function parseLayers(record: Record<string, unknown>, location: FieldLocation): LayerId[] {
  const layers = readStringList(record, 'layers', location, MAX_NAME_LENGTH);
  const unknownLayer = layers.find((layer) => !(LAYER_IDS as readonly string[]).includes(layer));
  if (unknownLayer !== undefined) failAt(childOf(location, 'layers'), `"${unknownLayer}" is not a layer`, `Use: ${LAYER_IDS.join(', ')}.`);
  return layers as LayerId[];
}

function parseSource(value: unknown, location: FieldLocation, declaredSpace: string): AnatomySource {
  const record = readRecord(value, location, { required: SOURCE_KEYS });
  const arrivesIn = readString(record, 'arrives_in', location, MAX_NAME_LENGTH);
  return {
    id: readId(record, 'id', location),
    name: readString(record, 'name', location, MAX_NAME_LENGTH),
    attribution_text: readNullable(record, 'attribution_text', () => readString(record, 'attribution_text', location, MAX_TEXT_LENGTH)),
    urls: readWebUrlList(record, 'urls', location),
    licence_id: readEnum(record, 'licence_id', location, LICENCE_IDS),
    redistribute: readBoolean(record, 'redistribute', location),
    layers: parseLayers(record, location),
    delineated_in: readString(record, 'delineated_in', location, MAX_NAME_LENGTH),
    arrives_in: arrivesIn,
    route: parseRoute(record.route, childOf(location, 'route'), { arrives_in: arrivesIn }, declaredSpace),
    delineation: parseDelineation(record.delineation, childOf(location, 'delineation')),
    required_text: readStringList(record, 'required_text', location, MAX_TEXT_LENGTH),
    files: readList(record, 'files', location).map((file, index) => parseFile(file, itemOf(location, 'files', index))),
  };
}

function parseRefused(value: unknown, location: FieldLocation): RefusedSource {
  const record = readRecord(value, location, { required: ['id', 'name', 'reason'] });
  return {
    id: readId(record, 'id', location),
    name: readString(record, 'name', location, MAX_NAME_LENGTH),
    reason: readString(record, 'reason', location, MAX_TEXT_LENGTH),
  };
}

export function parseSources(raw: unknown): AnatomySources {
  const root = rootOf(SOURCES_FILE);
  rejectBandKeys(raw, SOURCES_FILE);
  const record = readRecord(raw, root, { required: ['schema_version', 'status', 'declared_space', 'sources', 'considered_and_refused'] });
  const declaredSpace = readString(record, 'declared_space', root, MAX_NAME_LENGTH);
  const sources = readList(record, 'sources', root).map((source, index) => parseSource(source, itemOf(root, 'sources', index), declaredSpace));
  const refused = readList(record, 'considered_and_refused', root).map((entry, index) => parseRefused(entry, itemOf(root, 'considered_and_refused', index)));
  rejectDuplicates([...sources.map((source) => source.id), ...refused.map((entry) => entry.id)], childOf(root, 'sources'), 'source id');
  return {
    schema_version: readSchemaVersion(record, root, SOURCES_SCHEMA_VERSION),
    status: readStatus(record, root, SOURCES_STATUS),
    declared_space: declaredSpace,
    sources,
    considered_and_refused: refused,
  };
}
