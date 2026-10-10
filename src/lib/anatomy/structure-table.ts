/**
 * The `anatomy_structures` table: one row per shipped shape of an atlas label
 * (a label drawn on two sides has two rows), and one row for a label a record
 * names that has no shape yet. The label's name is the publisher's. Which QIF
 * records the label stands for is AI-drafted, so each row carries its owners'
 * worst review state, exactly as the atlas view shows it.
 */

import type { AnatomyData } from './anatomy-inputs';
import type { IndexAsset, IndexStructure, IndexStructureNode } from './anatomy-index-types';
import { DRAFTERS } from './anatomy-types';
import { buildAssets, buildStructures } from './build-index-structures';
import { subjectKey } from './crosswalk-rules';
import { AnatomyDataError } from './errors';
import { MANIFEST_FILE } from './parse-manifest';
import type { ReviewedCrosswalk } from './review-rows';
import { ANATOMY_INDEX_STATUS } from './status-sentences';
import { draftColumns, joinIds, type AnatomyRow } from './table-columns';

/**
 * The pipeline that built every shape and the crosswalk that gives it owners
 * are both AI-written; neither file stores a drafter per label, so the one
 * drafter the schema allows is stated here.
 */
const STRUCTURE_DRAFTER = DRAFTERS[0];
const NOT_SHIPPED = '';
const NO_NAME = '';

/** The columns of a label no shape ships for. Null says the column does not apply, never a measured zero. */
const UNSHIPPED_NODE_COLUMNS: AnatomyRow = {
  hemisphere: NOT_SHIPPED,
  hemispheres_drawn: NOT_SHIPPED,
  size_class: NOT_SHIPPED,
  has_mesh: false,
  vertex_count: null,
  centroid_x_mm: null,
  centroid_y_mm: null,
  centroid_z_mm: null,
  asset_id: NOT_SHIPPED,
  asset_path: NOT_SHIPPED,
  asset_sha256: NOT_SHIPPED,
  asset_license_id: NOT_SHIPPED,
  position_check: NOT_SHIPPED,
  visual_check_state: NOT_SHIPPED,
};

function nodeColumns(node: IndexStructureNode, asset: IndexAsset): AnatomyRow {
  const [x, y, z] = node.centroid_mm;
  return {
    hemisphere: node.hemisphere,
    hemispheres_drawn: node.hemispheres_drawn,
    size_class: node.size_class,
    has_mesh: node.vertex_count > 0,
    vertex_count: node.vertex_count,
    centroid_x_mm: x,
    centroid_y_mm: y,
    centroid_z_mm: z,
    asset_id: asset.id,
    asset_path: asset.path,
    asset_sha256: asset.sha256,
    asset_license_id: asset.license_id,
    position_check: asset.position_check,
    visual_check_state: asset.visual_check.state,
  };
}

function findAsset(assetsById: ReadonlyMap<string, IndexAsset>, assetId: string, structureKey: string): IndexAsset {
  const asset = assetsById.get(assetId);
  if (asset === undefined) {
    throw new AnatomyDataError(MANIFEST_FILE, `structure ${structureKey}`, `its shape names the asset "${assetId}", which the manifest does not list`,
      'Rebuild the manifest and the index from the same pipeline run.');
  }
  return asset;
}

function structureColumns(structure: IndexStructure, templateSpace: string): AnatomyRow {
  return {
    structure_key: structure.key,
    atlas: structure.atlas,
    label_id: structure.label_id,
    label_name: structure.name ?? NO_NAME,
    template_space: templateSpace,
    owner_subject_keys: joinIds(structure.owners.map((owner) => subjectKey(owner))),
    owner_count: structure.owners.length,
    check_status: structure.check_status,
  };
}

function toRows(structure: IndexStructure, assetsById: ReadonlyMap<string, IndexAsset>, templateSpace: string): AnatomyRow[] {
  const shared = structureColumns(structure, templateSpace);
  const draft = draftColumns(STRUCTURE_DRAFTER, structure.review_state, ANATOMY_INDEX_STATUS);
  const shippedNodes = structure.nodes.map((node) => nodeColumns(node, findAsset(assetsById, node.asset_id, structure.key)));
  const nodeRows = shippedNodes.length > 0 ? shippedNodes : [UNSHIPPED_NODE_COLUMNS];
  return nodeRows.map((columns) => ({ ...shared, ...columns, ...draft }));
}

/**
 * @param crosswalk the reviewed crosswalk the index is built from, so both give a structure the same owners
 */
export function buildStructureTable(data: AnatomyData, crosswalk: ReviewedCrosswalk): AnatomyRow[] {
  const assetsById = new Map(buildAssets(data).map((asset) => [asset.id, asset]));
  return buildStructures(data, crosswalk).flatMap((structure) => toRows(structure, assetsById, data.sources.declared_space));
}
