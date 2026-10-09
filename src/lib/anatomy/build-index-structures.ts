/** Builds the index's structures, subjects and assets from the reviewed crosswalk and the manifest. */

import type { AnatomyData } from './anatomy-inputs';
import type {
  GeometryState, IndexAsset, IndexOwner, IndexStructure, IndexStructureNode, IndexSubject, IndexVisualCheck,
} from './anatomy-index-types';
import type { CrosswalkRow, SubjectKind } from './anatomy-types';
import { buildOwnerMap } from './build-owner-map';
import { structureKey, subjectKey } from './crosswalk-rules';
import type { ReviewedCrosswalk, ReviewedNoGeometry } from './review-rows';
import { findReview, toIndexReviewState, worstCheckStatus, worstReviewState } from './review-state';

const PREDATES_ADDRESSING_REASON = 'This correspondence predates the current addressing.';
const NOT_MAPPED_REASON = 'No correspondence to an atlas has been drafted for this record yet.';
const NOT_BUILT_REASON = 'A correspondence is drafted, but no shape has been built for it yet.';
const MARKER_ONLY_REASON = 'This structure is too small to outline; only its location is marked.';
const KEY_SEPARATOR = ':';

function listNodes(data: AnatomyData, key: string): IndexStructureNode[] {
  return (data.manifest?.assets ?? []).flatMap((asset) => asset.nodes
    .filter((node) => structureKey(node.extras.atlas, node.extras.label_id) === key)
    .map((node) => ({ asset_id: asset.id, hemisphere: node.extras.hemisphere, hemispheres_drawn: asset.delineation.hemispheres, size_class: node.size_class, centroid_mm: node.centroid_mm, vertex_count: node.vertex_count })));
}

function toStructure(data: AnatomyData, key: string, owners: IndexOwner[]): IndexStructure {
  const [atlas, labelId] = [key.slice(0, key.indexOf(KEY_SEPARATOR)), key.slice(key.indexOf(KEY_SEPARATOR) + 1)];
  return {
    key,
    atlas,
    label_id: labelId,
    name: data.labelTables.get(atlas)?.labels.find((label) => label.id === labelId)?.name ?? null,
    nodes: listNodes(data, key),
    owners,
    review_state: toIndexReviewState(worstReviewState(owners.map((owner) => owner.review_state))),
    check_status: worstCheckStatus(owners.map((owner) => owner.check_status)),
  };
}

/** Every owned structure, then every shipped shape that no record maps to. Those stay neutral: no mode colours them. */
export function buildStructures(data: AnatomyData, crosswalk: ReviewedCrosswalk): IndexStructure[] {
  const ownersByStructure = buildOwnerMap(crosswalk.current, data.crosswalk.contains);
  const shippedKeys = (data.manifest?.assets ?? []).flatMap((asset) => asset.nodes.map((node) => structureKey(node.extras.atlas, node.extras.label_id)));
  const keys = [...new Set([...ownersByStructure.keys(), ...shippedKeys])];
  return keys.map((key) => toStructure(data, key, ownersByStructure.get(key) ?? []));
}

interface SubjectFacts {
  crosswalk: ReviewedCrosswalk;
  noGeometry: readonly ReviewedNoGeometry[];
  bandsByRegion: ReadonlyMap<string, string>;
  /** Structure key -> the largest vertex count among its shipped nodes. Zero means a marker with no mesh. */
  shippedNodes: ReadonlyMap<string, number>;
}

/**
 * What the build actually ships for a subject's drawing rows, or null when it
 * ships nothing. A row alone never makes a subject read as drawn.
 */
function describeShippedGeometry(rows: readonly CrosswalkRow[], shippedNodes: ReadonlyMap<string, number>): GeometryState | null {
  const withNodes = rows.filter((row) => row.atlas_ids.some((labelId) => shippedNodes.has(structureKey(row.atlas, labelId))));
  const withMeshes = withNodes.filter((row) => row.atlas_ids.some((labelId) => (shippedNodes.get(structureKey(row.atlas, labelId)) ?? 0) > 0));
  if (withMeshes.some((row) => row.extent_match !== 'contained')) return 'drawn';
  if (withMeshes.length > 0) return 'contained';
  return withNodes.length > 0 ? 'marker_only' : null;
}

function describeGeometry(kind: SubjectKind, id: string, facts: SubjectFacts): IndexSubject['geometry'] {
  const key = subjectKey({ subject_kind: kind, subject_id: id });
  const state = (geometryState: GeometryState, reason: string | null = null, reasonSource: string | null = null): IndexSubject['geometry'] =>
    ({ state: geometryState, reason, reason_source: reasonSource });
  const drawing = facts.crosswalk.current.filter((reviewed) => subjectKey(reviewed.row) === key && reviewed.row.draws);
  const shipped = describeShippedGeometry(drawing.map((reviewed) => reviewed.row), facts.shippedNodes);
  if (shipped !== null) return shipped === 'marker_only' ? state(shipped, MARKER_ONLY_REASON) : state(shipped);
  if (drawing.length > 0) return state('not_built', NOT_BUILT_REASON);
  const record = facts.noGeometry.find((reviewed) => subjectKey(reviewed.record) === key)?.record;
  if (record !== undefined) return state('no_geometry', record.reason, record.reason_source);
  const hasOnlyOutdatedRows = facts.crosswalk.outdated.some((row) => subjectKey(row) === key)
    && !facts.crosswalk.current.some((reviewed) => subjectKey(reviewed.row) === key);
  return hasOnlyOutdatedRows ? state('predates_addressing', PREDATES_ADDRESSING_REASON) : state('not_mapped', NOT_MAPPED_REASON);
}

function toSubject(data: AnatomyData, kind: SubjectKind, id: string, name: string, facts: SubjectFacts): IndexSubject {
  const key = subjectKey({ subject_kind: kind, subject_id: id });
  const rows = facts.crosswalk.current.filter((reviewed) => subjectKey(reviewed.row) === key);
  const record = facts.noGeometry.find((reviewed) => subjectKey(reviewed.record) === key);
  const reviewStates = [...rows.map((reviewed) => reviewed.review_state), ...(record === undefined ? [] : [record.review_state])];
  const band = kind === 'region' ? facts.bandsByRegion.get(id) : undefined;
  return {
    kind,
    id,
    name,
    band_ids: band === undefined ? [] : [band],
    geometry: describeGeometry(kind, id, facts),
    structure_keys: [...new Set(rows.flatMap((reviewed) => reviewed.row.atlas_ids.map((labelId) => structureKey(reviewed.row.atlas, labelId))))],
    declared_children: kind === 'region' ? data.crosswalk.contains.filter((relation) => relation.parent === id).map((relation) => relation.child) : [],
    review_state: toIndexReviewState(worstReviewState(reviewStates)),
    check_status: worstCheckStatus(rows.map((reviewed) => reviewed.check_status)),
  };
}

/** Every region, pathway and network, each with its derived band set and what, if anything, stands for it. */
export function buildSubjects(data: AnatomyData, crosswalk: ReviewedCrosswalk, noGeometry: readonly ReviewedNoGeometry[]): IndexSubject[] {
  const shippedNodes = new Map<string, number>();
  for (const node of (data.manifest?.assets ?? []).flatMap((asset) => asset.nodes)) {
    const key = structureKey(node.extras.atlas, node.extras.label_id);
    shippedNodes.set(key, Math.max(shippedNodes.get(key) ?? 0, node.vertex_count));
  }
  const facts: SubjectFacts = { crosswalk, noGeometry, shippedNodes, bandsByRegion: new Map(data.engineData.regions.map((region) => [region.id, region.bandId])) };
  const kinds: SubjectKind[] = ['region', 'pathway', 'network'];
  return kinds.flatMap((kind) => [...data.subjectNames[kind]].map(([id, name]) => toSubject(data, kind, id, name, facts)));
}

/** A visual check counts only for the exact bytes that were signed: the ledger entry's digest must be the asset's sha256. */
function describeVisualCheck(data: AnatomyData, assetId: string, sha256: string): IndexVisualCheck {
  const review = findReview(data.ledger, 'visual_check', assetId, sha256);
  if (review.state !== 'reviewed') return { state: 'not_done', role: null, reviewed_on: null };
  return { state: 'signed', role: review.reviewer_role, reviewed_on: review.reviewed_on };
}

export function buildAssets(data: AnatomyData): IndexAsset[] {
  return (data.manifest?.assets ?? []).map((asset) => ({
    id: asset.id,
    path: asset.path,
    bytes: asset.bytes,
    sha256: asset.sha256,
    kind: asset.kind,
    layer: asset.layer,
    license_id: asset.license_id,
    source_ids: asset.source_ids,
    position_check: asset.position_check,
    modification_note: asset.modification_note,
    visual_check: describeVisualCheck(data, asset.id, asset.sha256),
  }));
}
