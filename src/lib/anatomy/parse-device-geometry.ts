/**
 * Parser for datalake/qif-device-geometry.json: the scalp fiducials the EEG
 * layout is built from, and deep-brain-stimulation lead dimensions with the
 * sources they were read in. Dimensions are facts; no table or figure from a
 * paper is reproduced. A row is drawn only while a ledger entry covers it.
 */

import { DRAFTERS, type Drafter } from './anatomy-types';
import { rejectBandKeys } from './band-key-scan';
import {
  childOf, failAt, itemOf, readEnum, readInteger, readList, readNullable, readNumber, readRecord, readString, rejectDuplicates, rootOf,
  type FieldLocation,
} from './field-readers';
import { readHttpsUrl, readId, readSchemaVersion } from './format-readers';
import type { Point3 } from './manifest-types';
import { DEVICE_GEOMETRY_STATUS, readStatus } from './status-sentences';

export const DEVICE_GEOMETRY_FILE = 'datalake/qif-device-geometry.json';

/** The four points the 10-20 construction starts from. */
export const FIDUCIAL_IDS = ['nasion', 'inion', 'left_preauricular', 'right_preauricular'] as const;
export type FiducialId = typeof FIDUCIAL_IDS[number];

export const SPACING_MEASURES = ['edge_to_edge', 'centre_to_centre'] as const;
export type SpacingMeasure = typeof SPACING_MEASURES[number];

export interface Fiducial {
  id: FiducialId;
  position_mm: Point3;
}

export interface DimensionSource {
  citation: string;
  url: string;
  quote: string;
}

export interface DeviceLead {
  id: string;
  name: string;
  contacts: number;
  contact_length_mm: number;
  contact_spacing_mm: number;
  spacing_measure: SpacingMeasure;
  diameter_mm: number;
  sources: DimensionSource[];
  drafted_by: Drafter;
}

export interface DeviceGeometry {
  schema_version: number;
  status: string;
  /** The space the fiducial coordinates are in. Null only while there are no fiducials. */
  fiducial_space: string | null;
  fiducials: Fiducial[];
  leads: DeviceLead[];
}

const DEVICE_GEOMETRY_SCHEMA_VERSION = 1;
const POINT_DIMENSIONS = 3;
const MAX_TEXT_LENGTH = 400;
const SMALLEST_DIMENSION_MM = 0.01;
const LEAD_KEYS = ['id', 'name', 'contacts', 'contact_length_mm', 'contact_spacing_mm', 'spacing_measure', 'diameter_mm', 'sources', 'drafted_by'] as const;

function parseFiducial(value: unknown, location: FieldLocation): Fiducial {
  const record = readRecord(value, location, { required: ['id', 'position_mm'] });
  const position = record.position_mm;
  const isPoint = Array.isArray(position) && position.length === POINT_DIMENSIONS && position.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));
  if (!isPoint) failAt(childOf(location, 'position_mm'), 'expected a point', 'Write three finite numbers: x, y and z in millimetres.');
  return { id: readEnum(record, 'id', location, FIDUCIAL_IDS), position_mm: position as Point3 };
}

function parseDimensionSource(value: unknown, location: FieldLocation): DimensionSource {
  const record = readRecord(value, location, { required: ['citation', 'url', 'quote'] });
  return {
    citation: readString(record, 'citation', location, MAX_TEXT_LENGTH),
    url: readHttpsUrl(record, 'url', location),
    quote: readString(record, 'quote', location, MAX_TEXT_LENGTH),
  };
}

function parseLead(value: unknown, location: FieldLocation): DeviceLead {
  const record = readRecord(value, location, { required: LEAD_KEYS });
  const sources = readList(record, 'sources', location).map((source, index) => parseDimensionSource(source, itemOf(location, 'sources', index)));
  if (sources.length === 0) failAt(childOf(location, 'sources'), 'a dimension must cite where it was read', 'Add the document and the quoted wording.');
  return {
    id: readId(record, 'id', location),
    name: readString(record, 'name', location, MAX_TEXT_LENGTH),
    contacts: readInteger(record, 'contacts', location, 1),
    contact_length_mm: readNumber(record, 'contact_length_mm', location, SMALLEST_DIMENSION_MM),
    contact_spacing_mm: readNumber(record, 'contact_spacing_mm', location, SMALLEST_DIMENSION_MM),
    spacing_measure: readEnum(record, 'spacing_measure', location, SPACING_MEASURES),
    diameter_mm: readNumber(record, 'diameter_mm', location, SMALLEST_DIMENSION_MM),
    sources,
    drafted_by: readEnum(record, 'drafted_by', location, DRAFTERS),
  };
}

/**
 * @param declaredSpace the template space of the source registry; fiducial coordinates must be in it
 */
export function parseDeviceGeometry(raw: unknown, declaredSpace: string): DeviceGeometry {
  const root = rootOf(DEVICE_GEOMETRY_FILE);
  rejectBandKeys(raw, DEVICE_GEOMETRY_FILE);
  const record = readRecord(raw, root, { required: ['schema_version', 'status', 'fiducial_space', 'fiducials', 'leads'] });
  const fiducials = readList(record, 'fiducials', root).map((fiducial, index) => parseFiducial(fiducial, itemOf(root, 'fiducials', index)));
  const leads = readList(record, 'leads', root).map((lead, index) => parseLead(lead, itemOf(root, 'leads', index)));
  rejectDuplicates(fiducials.map((fiducial) => fiducial.id), childOf(root, 'fiducials'), 'fiducial');
  rejectDuplicates(leads.map((lead) => lead.id), childOf(root, 'leads'), 'lead');
  const fiducialSpace = readNullable(record, 'fiducial_space', () => readString(record, 'fiducial_space', root, MAX_TEXT_LENGTH));
  if (fiducials.length > 0 && fiducialSpace !== declaredSpace) {
    failAt(childOf(root, 'fiducial_space'), `fiducials are coordinates, so the file must say they are in "${declaredSpace}"`, 'Set fiducial_space to the declared space, or re-pick the fiducials in it.');
  }
  return {
    schema_version: readSchemaVersion(record, root, DEVICE_GEOMETRY_SCHEMA_VERSION),
    status: readStatus(record, root, DEVICE_GEOMETRY_STATUS),
    fiducial_space: fiducialSpace,
    fiducials,
    leads,
  };
}
