/**
 * Parsers for the scalp side of datalake/qif-anatomy-device-geometry.json: the
 * record of how the four landmarks were placed, electrode layouts built from
 * them, and sourced facts that may be quoted but never drawn.
 *
 * An electrode row is a place on the head surface asset. It names no brain
 * region and nothing here computes one.
 */

import { DRAFTERS, type Drafter } from './anatomy-types';
import { parseEvidence, type EvidenceBlock } from './evidence';
import {
  childOf, failAt, itemOf, readBoolean, readEnum, readList, readNumber, readRecord, readString, rejectDuplicates,
  type FieldLocation,
} from './field-readers';
import { readHttpsUrl, readId, readSha256 } from './format-readers';
import type { Point3 } from './manifest-types';

export interface FiducialSet {
  id: string;
  /** The head surface asset the landmarks were found on. */
  scalp_asset_id: string;
  method: string;
  drafted_by: Drafter;
  /** What the placement rests on. Required once the file holds an electrode layout. */
  evidence?: EvidenceBlock;
  /** The sha256 of the head surface file the placement was made on. Required once the file holds an electrode layout. */
  scalp_asset_sha256?: string;
  /** The pipeline's digest over that hash, the method's parameters and every coordinate. Checked by the pipeline's own tests. */
  placement_digest?: string;
}

export interface LayoutElectrode {
  id: string;
  position_mm: Point3;
  /** The arc over the scalp this position was measured along, and its share of that arc's length. */
  arc: string;
  share: number;
  also_called?: string;
}

export interface ElectrodeLayout {
  id: string;
  name: string;
  scalp_asset_id: string;
  fiducial_set_id: string;
  construction: string;
  shown_by_default: boolean;
  electrodes: LayoutElectrode[];
  drafted_by: Drafter;
  evidence: EvidenceBlock;
}

/** How much of the cited work was read. A fact read from an abstract alone says so wherever it is shown. */
export const READ_DEPTHS = ['abstract_only', 'full_text'] as const;
export type ReadDepth = typeof READ_DEPTHS[number];

export interface SourcedFact {
  id: string;
  statement: string;
  citation: string;
  url: string;
  quote: string;
  read_depth: ReadDepth;
  /** Always false: a figure from another study, space and sample is quoted in words, never drawn on this head. */
  drawable: false;
  drafted_by: Drafter;
}

const POINT_DIMENSIONS = 3;
const MAX_TEXT_LENGTH = 400;
const MAX_CITATION_LENGTH = 400;
const ELECTRODE_ID_PATTERN = /^[A-Z][A-Za-z]{0,2}(z|[0-9]{1,2})$/;
const SMALLEST_SHARE = 0.001;
const LARGEST_SHARE = 0.999;

export function readPoint(record: Record<string, unknown>, location: FieldLocation): Point3 {
  const position = record.position_mm;
  const isPoint = Array.isArray(position) && position.length === POINT_DIMENSIONS && position.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));
  if (!isPoint) failAt(childOf(location, 'position_mm'), 'expected a point', 'Write three finite numbers: x, y and z in millimetres.');
  return position as Point3;
}

export function parseFiducialSet(value: unknown, location: FieldLocation): FiducialSet {
  const record = readRecord(value, location, { required: ['id', 'scalp_asset_id', 'method', 'drafted_by'], optional: ['evidence', 'scalp_asset_sha256', 'placement_digest'] });
  const fiducialSet: FiducialSet = {
    id: readId(record, 'id', location),
    scalp_asset_id: readId(record, 'scalp_asset_id', location),
    method: readString(record, 'method', location, MAX_TEXT_LENGTH),
    drafted_by: readEnum(record, 'drafted_by', location, DRAFTERS),
  };
  if (Object.hasOwn(record, 'evidence')) fiducialSet.evidence = parseEvidence(record.evidence, childOf(location, 'evidence'));
  if (Object.hasOwn(record, 'scalp_asset_sha256')) fiducialSet.scalp_asset_sha256 = readSha256(record, 'scalp_asset_sha256', location);
  if (Object.hasOwn(record, 'placement_digest')) fiducialSet.placement_digest = readSha256(record, 'placement_digest', location);
  return fiducialSet;
}

function parseElectrode(value: unknown, location: FieldLocation): LayoutElectrode {
  const record = readRecord(value, location, { required: ['id', 'position_mm', 'arc', 'share'], optional: ['also_called'] });
  const id = readString(record, 'id', location, MAX_TEXT_LENGTH);
  if (!ELECTRODE_ID_PATTERN.test(id)) failAt(childOf(location, 'id'), `"${id}" is not an electrode name`, 'Use a 10-20 name such as Cz, Fp1 or T7.');
  const share = readNumber(record, 'share', location, SMALLEST_SHARE);
  if (share > LARGEST_SHARE) failAt(childOf(location, 'share'), 'a share of an arc lies between its two ends', 'Write a number above 0 and below 1.');
  const electrode: LayoutElectrode = { id, position_mm: readPoint(record, location), arc: readId(record, 'arc', location), share };
  return Object.hasOwn(record, 'also_called') ? { ...electrode, also_called: readString(record, 'also_called', location, MAX_TEXT_LENGTH) } : electrode;
}

/**
 * @param fiducialSet the landmarks' record; a layout must be built on it and on the head surface it names
 */
export function parseElectrodeLayout(value: unknown, location: FieldLocation, fiducialSet: FiducialSet | null): ElectrodeLayout {
  const record = readRecord(value, location, { required: ['id', 'name', 'scalp_asset_id', 'fiducial_set_id', 'construction', 'shown_by_default', 'electrodes', 'drafted_by', 'evidence'] });
  const electrodes = readList(record, 'electrodes', location).map((electrode, index) => parseElectrode(electrode, itemOf(location, 'electrodes', index)));
  if (electrodes.length === 0) failAt(childOf(location, 'electrodes'), 'a layout with no electrode', 'List the positions, or remove the layout.');
  rejectDuplicates(electrodes.map((electrode) => electrode.id), childOf(location, 'electrodes'), 'electrode');
  const layout: ElectrodeLayout = {
    id: readString(record, 'id', location, MAX_TEXT_LENGTH),
    name: readString(record, 'name', location, MAX_TEXT_LENGTH),
    scalp_asset_id: readId(record, 'scalp_asset_id', location),
    fiducial_set_id: readId(record, 'fiducial_set_id', location),
    construction: readString(record, 'construction', location, MAX_TEXT_LENGTH),
    shown_by_default: readBoolean(record, 'shown_by_default', location),
    electrodes,
    drafted_by: readEnum(record, 'drafted_by', location, DRAFTERS),
    evidence: parseEvidence(record.evidence, childOf(location, 'evidence')),
  };
  if (fiducialSet === null || layout.fiducial_set_id !== fiducialSet.id) {
    failAt(childOf(location, 'fiducial_set_id'), `"${layout.fiducial_set_id}" is not the landmark record of this file`,
      'An electrode position means nothing without the landmarks it was measured from; name the fiducial_set of this file.');
  }
  if (fiducialSet.evidence === undefined) {
    failAt(childOf(location, 'fiducial_set_id'), 'the landmark record carries no evidence block', 'Say what the landmarks rest on in fiducial_set.evidence.');
  }
  if (fiducialSet.scalp_asset_sha256 === undefined || fiducialSet.placement_digest === undefined) {
    failAt(childOf(location, 'fiducial_set_id'), 'the landmark record does not pin the head surface it was placed on',
      'Run the pipeline\'s devices command; it writes scalp_asset_sha256 and placement_digest.');
  }
  if (layout.scalp_asset_id !== fiducialSet.scalp_asset_id) {
    failAt(childOf(location, 'scalp_asset_id'), `"${layout.scalp_asset_id}" is not the head surface the landmarks were found on ("${fiducialSet.scalp_asset_id}")`,
      'Place the electrodes on the same head surface as the landmarks.');
  }
  return layout;
}

export function parseSourcedFact(value: unknown, location: FieldLocation): SourcedFact {
  const record = readRecord(value, location, { required: ['id', 'statement', 'citation', 'url', 'quote', 'read_depth', 'drawable', 'drafted_by'] });
  if (readBoolean(record, 'drawable', location)) {
    failAt(childOf(location, 'drawable'), 'a sourced fact is never drawn',
      'A figure measured in other people, in another space, is quoted in words with its source. Set drawable to false.');
  }
  return {
    id: readId(record, 'id', location),
    statement: readString(record, 'statement', location, MAX_TEXT_LENGTH),
    citation: readString(record, 'citation', location, MAX_CITATION_LENGTH),
    url: readHttpsUrl(record, 'url', location),
    quote: readString(record, 'quote', location, MAX_TEXT_LENGTH),
    read_depth: readEnum(record, 'read_depth', location, READ_DEPTHS),
    drawable: false,
    drafted_by: readEnum(record, 'drafted_by', location, DRAFTERS),
  };
}
