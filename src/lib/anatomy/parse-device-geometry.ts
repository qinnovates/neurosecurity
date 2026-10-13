/**
 * Parser for datalake/qif-anatomy-device-geometry.json: the scalp fiducials the EEG
 * layout is built from, and deep-brain-stimulation lead dimensions with the
 * sources they were read in. Dimensions are facts; no table or figure from a
 * paper is reproduced. A row is drawn only while a ledger entry covers it.
 *
 * A lead is an object with a size and no place: its row may not carry a position,
 * a target or anything else that would put it in the brain.
 */

import { DRAFTERS, type Drafter } from './anatomy-types';
import { rejectBandKeys } from './band-key-scan';
import {
  childOf, failAt, itemOf, readEnum, readInteger, readList, readNullable, readNumber, readRecord, readString, readStringList, rejectDuplicates, rootOf,
  type FieldLocation,
} from './field-readers';
import { readHttpsUrl, readId, readSchemaVersion } from './format-readers';
import type { Point3 } from './manifest-types';
import {
  parseElectrodeLayout, parseFiducialSet, parseSourcedFact, readPoint,
  type ElectrodeLayout, type FiducialSet, type SourcedFact,
} from './parse-electrode-layouts';
import { DEVICE_GEOMETRY_STATUS, readStatus } from './status-sentences';

export const DEVICE_GEOMETRY_FILE = 'datalake/qif-anatomy-device-geometry.json';

/** The four points the 10-20 construction starts from. */
export const FIDUCIAL_IDS = ['nasion', 'inion', 'left_preauricular', 'right_preauricular'] as const;
export type FiducialId = typeof FIDUCIAL_IDS[number];

export const SPACING_MEASURES = ['edge_to_edge', 'centre_to_centre'] as const;
export type SpacingMeasure = typeof SPACING_MEASURES[number];

export interface Fiducial {
  id: FiducialId;
  position_mm: Point3;
  /** The rule that placed this landmark on the template head. */
  method?: string;
}

/** Whether a number was read in a regulator's document or only in a review paper. */
export const DIMENSION_SOURCE_KINDS = ['fda_document', 'review_paper'] as const;
export type DimensionSourceKind = typeof DIMENSION_SOURCE_KINDS[number];

/** The fields of a lead that a source can vouch for. */
export const LEAD_DIMENSION_FIELDS = ['contacts', 'contact_length_mm', 'contact_spacing_mm', 'spacing_measure', 'diameter_mm'] as const;
export type LeadDimensionField = typeof LEAD_DIMENSION_FIELDS[number];

export interface DimensionSource {
  citation: string;
  url: string;
  quote: string;
  kind?: DimensionSourceKind;
  /** The fields of the lead row this quote states. */
  supports?: LeadDimensionField[];
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
  /** How and on which head surface the landmarks were placed. Null while the file has no electrode layout. */
  fiducial_set: FiducialSet | null;
  fiducials: Fiducial[];
  electrode_layouts: ElectrodeLayout[];
  leads: DeviceLead[];
  facts: SourcedFact[];
}

const DEVICE_GEOMETRY_SCHEMA_VERSION = 1;
const MAX_TEXT_LENGTH = 400;
const SMALLEST_DIMENSION_MM = 0.01;
const LEAD_KEYS = ['id', 'name', 'contacts', 'contact_length_mm', 'contact_spacing_mm', 'spacing_measure', 'diameter_mm', 'sources', 'drafted_by'] as const;

/** Keys that would give a lead a place in the brain. Named apart from other unknown keys so the refusal says why. */
const PLACEMENT_KEY_PATTERN = /position|coordinate|target|trajectory|entry|tip_mm|transform|orientation|region|structure|space/i;

function parseFiducial(value: unknown, location: FieldLocation): Fiducial {
  const record = readRecord(value, location, { required: ['id', 'position_mm'], optional: ['method'] });
  const fiducial: Fiducial = { id: readEnum(record, 'id', location, FIDUCIAL_IDS), position_mm: readPoint(record, location) };
  return Object.hasOwn(record, 'method') ? { ...fiducial, method: readString(record, 'method', location, MAX_TEXT_LENGTH) } : fiducial;
}

function parseDimensionSource(value: unknown, location: FieldLocation): DimensionSource {
  const record = readRecord(value, location, { required: ['citation', 'url', 'quote'], optional: ['kind', 'supports'] });
  const source: DimensionSource = {
    citation: readString(record, 'citation', location, MAX_TEXT_LENGTH),
    url: readHttpsUrl(record, 'url', location),
    quote: readString(record, 'quote', location, MAX_TEXT_LENGTH),
  };
  if (Object.hasOwn(record, 'kind')) source.kind = readEnum(record, 'kind', location, DIMENSION_SOURCE_KINDS);
  if (Object.hasOwn(record, 'supports')) {
    source.supports = readStringList(record, 'supports', location, MAX_TEXT_LENGTH).map((field, index) =>
      (LEAD_DIMENSION_FIELDS as readonly string[]).includes(field)
        ? field as LeadDimensionField
        : failAt(itemOf(location, 'supports', index), `"${field}" is not a dimension of a lead`, `Use one of ${LEAD_DIMENSION_FIELDS.join(', ')}.`));
  }
  return source;
}

function rejectPlacement(value: unknown, location: FieldLocation): void {
  if (typeof value !== 'object' || value === null) return;
  const placementKey = Object.keys(value).find((key) => !(LEAD_KEYS as readonly string[]).includes(key) && PLACEMENT_KEY_PATTERN.test(key));
  if (placementKey === undefined) return;
  failAt(childOf(location, placementKey), `"${placementKey}" would give the lead a place in the brain`,
    'A lead here is an object with a size, drawn beside the brain. Where a lead sits is chosen for each patient from that patient\'s scans; remove the key.');
}

/** Once any source says what it supports, every dimension of the lead must be vouched for, and each source must say what kind of document it is. */
function rejectUnsourcedDimensions(sources: readonly DimensionSource[], location: FieldLocation): void {
  if (!sources.some((source) => source.supports !== undefined || source.kind !== undefined)) return;
  const unlabelled = sources.findIndex((source) => source.supports === undefined || source.kind === undefined);
  if (unlabelled >= 0) failAt(itemOf(location, 'sources', unlabelled), 'this source does not say what it supports or what kind of document it is', 'Add "kind" and "supports" to every source of the lead.');
  const unsourced = LEAD_DIMENSION_FIELDS.find((field) => !sources.some((source) => source.supports?.includes(field)));
  if (unsourced !== undefined) failAt(childOf(location, 'sources'), `no source states "${unsourced}"`, 'Quote the document that states it, or remove the lead.');
}

function parseLead(value: unknown, location: FieldLocation): DeviceLead {
  rejectPlacement(value, location);
  const record = readRecord(value, location, { required: LEAD_KEYS });
  const sources = readList(record, 'sources', location).map((source, index) => parseDimensionSource(source, itemOf(location, 'sources', index)));
  if (sources.length === 0) failAt(childOf(location, 'sources'), 'a dimension must cite where it was read', 'Add the document and the quoted wording.');
  rejectUnsourcedDimensions(sources, location);
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
  const record = readRecord(raw, root, { required: ['schema_version', 'status', 'fiducial_space', 'fiducials', 'leads'], optional: ['fiducial_set', 'electrode_layouts', 'facts'] });
  const fiducialSet = Object.hasOwn(record, 'fiducial_set') ? parseFiducialSet(record.fiducial_set, childOf(root, 'fiducial_set')) : null;
  const layouts = (Object.hasOwn(record, 'electrode_layouts') ? readList(record, 'electrode_layouts', root) : [])
    .map((layout, index) => parseElectrodeLayout(layout, itemOf(root, 'electrode_layouts', index), fiducialSet));
  const facts = (Object.hasOwn(record, 'facts') ? readList(record, 'facts', root) : []).map((fact, index) => parseSourcedFact(fact, itemOf(root, 'facts', index)));
  rejectDuplicates(layouts.map((layout) => layout.id), childOf(root, 'electrode_layouts'), 'electrode layout');
  rejectDuplicates(facts.map((fact) => fact.id), childOf(root, 'facts'), 'fact');
  const fiducials = readList(record, 'fiducials', root).map((fiducial, index) => parseFiducial(fiducial, itemOf(root, 'fiducials', index)));
  const leads = readList(record, 'leads', root).map((lead, index) => parseLead(lead, itemOf(root, 'leads', index)));
  rejectDuplicates(fiducials.map((fiducial) => fiducial.id), childOf(root, 'fiducials'), 'fiducial');
  rejectDuplicates(leads.map((lead) => lead.id), childOf(root, 'leads'), 'lead');
  const fiducialSpace = readNullable(record, 'fiducial_space', () => readString(record, 'fiducial_space', root, MAX_TEXT_LENGTH));
  if (fiducials.length > 0 && fiducialSpace !== declaredSpace) {
    failAt(childOf(root, 'fiducial_space'), `fiducials are coordinates, so the file must say they are in "${declaredSpace}"`, 'Set fiducial_space to the declared space, or re-pick the fiducials in it.');
  }
  if (layouts.length > 0 && fiducials.length !== FIDUCIAL_IDS.length) {
    failAt(childOf(root, 'fiducials'), 'an electrode layout needs all four landmarks', `List ${FIDUCIAL_IDS.join(', ')}.`);
  }
  return {
    schema_version: readSchemaVersion(record, root, DEVICE_GEOMETRY_SCHEMA_VERSION),
    status: readStatus(record, root, DEVICE_GEOMETRY_STATUS),
    fiducial_space: fiducialSpace,
    fiducial_set: fiducialSet,
    fiducials,
    electrode_layouts: layouts,
    leads,
    facts,
  };
}
