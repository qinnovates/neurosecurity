/** Parsers for the parts of a manifest asset that describe its structures and the checks run on it. */

import { DELINEATION_BASES, HEMISPHERES } from './anatomy-types';
import {
  childOf, failAt, readEnum, readInteger, readList, readNullable, readNumber, readRecord, readString, type FieldLocation,
} from './field-readers';
import {
  CHECK_IDS, CHECK_RESULTS, HEMISPHERE_RECORDS, MESHLESS_SIZE_CLASSES, SIZE_CLASSES,
  type ManifestCheck, type ManifestDelineation, type ManifestNode, type Point3,
} from './manifest-types';

const POINT_DIMENSIONS = 3;
const VOLUME_THRESHOLDS = ['0.25', '0.5', '0.75'] as const;
const MAX_LABEL_ID_LENGTH = 40;
const MAX_TEXT_LENGTH = 300;
const UNBOUNDED_BELOW = -Number.MAX_VALUE;

function readPoint(value: unknown, location: FieldLocation): Point3 {
  const isPoint = Array.isArray(value) && value.length === POINT_DIMENSIONS && value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));
  if (!isPoint) return failAt(location, 'expected a point', 'Write three finite numbers: x, y and z in millimetres.');
  return value as Point3;
}

function readBounds(record: Record<string, unknown>, location: FieldLocation): [Point3, Point3] {
  const bounds = readList(record, 'bbox_mm', location);
  const boundsLocation = childOf(location, 'bbox_mm');
  if (bounds.length !== 2) return failAt(boundsLocation, 'expected two corners', 'Write the minimum corner, then the maximum corner.');
  return [readPoint(bounds[0], boundsLocation), readPoint(bounds[1], boundsLocation)];
}

function parseExtras(value: unknown, location: FieldLocation, assetSourceIds: readonly string[]): ManifestNode['extras'] {
  const record = readRecord(value, location, { required: ['atlas', 'label_id', 'hemisphere'] });
  const atlas = readString(record, 'atlas', location, MAX_TEXT_LENGTH);
  if (!assetSourceIds.includes(atlas)) {
    failAt(childOf(location, 'atlas'), `"${atlas}" is not one of this asset's sources`, 'A node may only carry labels of an atlas listed in the asset\'s source_ids.');
  }
  return { atlas, label_id: readString(record, 'label_id', location, MAX_LABEL_ID_LENGTH), hemisphere: readEnum(record, 'hemisphere', location, HEMISPHERES) };
}

function rejectMeshMismatch(node: Pick<ManifestNode, 'size_class' | 'vertex_count'>, location: FieldLocation): void {
  const mayHaveNoMesh = MESHLESS_SIZE_CLASSES.includes(node.size_class);
  if (mayHaveNoMesh && node.vertex_count > 0) {
    failAt(childOf(location, 'vertex_count'), `an "${node.size_class}" structure must have no mesh`, 'Too small to outline: ship a location marker, not a shape.');
  }
  if (!mayHaveNoMesh && node.vertex_count === 0) {
    failAt(childOf(location, 'vertex_count'), `a "${node.size_class}" structure must have a mesh`, 'Rebuild the asset, or record the size class the pipeline measured.');
  }
}

const NODE_KEYS = [
  'extras', 'threshold', 'max_probability', 'volume_mm3_at', 'voxels', 'shortest_extent_voxels',
  'size_class', 'centroid_mm', 'bbox_mm', 'vertex_count', 'mesh_to_mask_mm',
] as const;

export function parseNode(value: unknown, location: FieldLocation, assetSourceIds: readonly string[]): ManifestNode {
  const record = readRecord(value, location, { required: NODE_KEYS });
  const volumeLocation = childOf(location, 'volume_mm3_at');
  const volumes = readRecord(record.volume_mm3_at, volumeLocation, { required: VOLUME_THRESHOLDS });
  const distanceLocation = childOf(location, 'mesh_to_mask_mm');
  const distances = readRecord(record.mesh_to_mask_mm, distanceLocation, { required: ['mean', 'max'] });
  const node: ManifestNode = {
    extras: parseExtras(record.extras, childOf(location, 'extras'), assetSourceIds),
    threshold: readNumber(record, 'threshold', location, 0),
    max_probability: readNumber(record, 'max_probability', location, 0),
    volume_mm3_at: Object.fromEntries(VOLUME_THRESHOLDS.map((threshold) => [threshold, readNumber(volumes, threshold, volumeLocation, 0)])),
    voxels: readInteger(record, 'voxels', location, 0),
    shortest_extent_voxels: readNumber(record, 'shortest_extent_voxels', location, 0),
    size_class: readEnum(record, 'size_class', location, SIZE_CLASSES),
    centroid_mm: readPoint(record.centroid_mm, childOf(location, 'centroid_mm')),
    bbox_mm: readBounds(record, location),
    vertex_count: readInteger(record, 'vertex_count', location, 0),
    mesh_to_mask_mm: { mean: readNumber(distances, 'mean', distanceLocation, 0), max: readNumber(distances, 'max', distanceLocation, 0) },
  };
  rejectMeshMismatch(node, location);
  return node;
}

export function parseCheck(value: unknown, location: FieldLocation): ManifestCheck {
  const record = readRecord(value, location, { required: ['id', 'status', 'measured', 'threshold'], optional: ['reason'] });
  const status = readEnum(record, 'status', location, CHECK_RESULTS);
  const check: ManifestCheck = {
    id: readEnum(record, 'id', location, CHECK_IDS),
    status,
    measured: readNullable(record, 'measured', () => readNumber(record, 'measured', location, UNBOUNDED_BELOW)),
    threshold: readNullable(record, 'threshold', () => readNumber(record, 'threshold', location, UNBOUNDED_BELOW)),
  };
  if (status === 'not_run' && record.reason === undefined) {
    failAt(childOf(location, 'reason'), 'a check that did not run must say why', 'Add the reason, for example "side assigned by construction".');
  }
  return record.reason === undefined ? check : { ...check, reason: readString(record, 'reason', location, MAX_TEXT_LENGTH) };
}

export function parseDelineation(value: unknown, location: FieldLocation): ManifestDelineation {
  const record = readRecord(value, location, {
    required: ['basis', 'subjects', 'hemispheres', 'grid_voxel_mm', 'acquisition_voxel_mm', 'probability_meaning'],
  });
  return {
    basis: readEnum(record, 'basis', location, DELINEATION_BASES),
    subjects: readNullable(record, 'subjects', () => readInteger(record, 'subjects', location, 1)),
    hemispheres: readEnum(record, 'hemispheres', location, HEMISPHERE_RECORDS),
    grid_voxel_mm: readNumber(record, 'grid_voxel_mm', location, 0),
    acquisition_voxel_mm: readNullable(record, 'acquisition_voxel_mm', () => readNumber(record, 'acquisition_voxel_mm', location, 0)),
    probability_meaning: readString(record, 'probability_meaning', location, MAX_TEXT_LENGTH),
  };
}
