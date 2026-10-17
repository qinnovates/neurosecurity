/**
 * The `anatomy_structures` table: one row per shipped shape of an atlas label
 * (a label drawn on two sides has two rows), and one row for a label a record
 * names that has no shape yet. The label's name is the publisher's and the
 * shape is built by the offline pipeline. Which QIF records the label is mapped
 * to is AI-drafted, so each row carries the worst review state among those
 * mappings, exactly as the atlas view shows it, and names their drafter.
 */

import type { AnatomyData } from './anatomy-inputs';
import type { IndexAsset, IndexStructure, IndexStructureNode } from './anatomy-index-types';
import type { Drafter } from './anatomy-types';
import { buildAssets } from './build-index-structures';
import { structureKey, subjectKey } from './crosswalk-rules';
import { AnatomyDataError } from './errors';
import { MANIFEST_FILE } from './parse-manifest';
import type { ReviewedCrosswalk } from './review-rows';
import { ANATOMY_INDEX_STATUS } from './status-sentences';
import { draftColumns, joinIds, type AnatomyRow } from './table-columns';

const TABLE = 'anatomy_structures';
const NOT_SHIPPED = '';
const NO_NAME = '';

/** The columns of a label no shape ships for. Null says the column does not apply, never a measured zero. */
const UNSHIPPED_NODE_COLUMNS: AnatomyRow = {
  hemisphere: NOT_SHIPPED,
  hemispheres_drawn: NOT_SHIPPED,
  size_class: NOT_SHIPPED,
  has_drawn_shape: false,
  vertex_count: null,
  centroid_x_mm: null,
  centroid_y_mm: null,
  centroid_z_mm: null,
  asset_id: NOT_SHIPPED,
  asset_path: NOT_SHIPPED,
  asset_sha256: NOT_SHIPPED,
  asset_license_id: NOT_SHIPPED,
};

/** The shape's own checks. They follow the mapping's review columns, so a reviewed mapping is never read as a checked shape. */
const UNSHIPPED_CHECK_COLUMNS: AnatomyRow = { visual_check_state: NOT_SHIPPED, position_check: NOT_SHIPPED };

function shapeCheckColumns(asset: IndexAsset): AnatomyRow {
  return { visual_check_state: asset.visual_check.state, position_check: asset.position_check };
}

function nodeColumns(node: IndexStructureNode, asset: IndexAsset): AnatomyRow {
  const [x, y, z] = node.centroid_mm;
  return {
    hemisphere: node.hemisphere,
    hemispheres_drawn: node.hemispheres_drawn,
    size_class: node.size_class,
    has_drawn_shape: node.vertex_count > 0,
    vertex_count: node.vertex_count,
    centroid_x_mm: x,
    centroid_y_mm: y,
    centroid_z_mm: z,
    asset_id: asset.id,
    asset_path: asset.path,
    asset_sha256: asset.sha256,
    asset_license_id: asset.license_id,
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
    mapped_qif_record_keys: joinIds(structure.owners.map((owner) => subjectKey(owner))),
    mapped_qif_record_count: structure.owners.length,
    check_status: structure.check_status,
  };
}

/** Who drafted the crosswalk rows that name this label. Empty for a shape no record is mapped to. */
function listMappingDrafters(structure: IndexStructure, crosswalk: ReviewedCrosswalk): Drafter[] {
  return crosswalk.current
    .filter(({ row }) => row.atlas_ids.some((labelId) => structureKey(row.atlas, labelId) === structure.key))
    .map(({ row }) => row.drafted_by);
}

interface StructureTableContext {
  crosswalk: ReviewedCrosswalk;
  assetsById: ReadonlyMap<string, IndexAsset>;
  templateSpace: string;
}

function toRows(structure: IndexStructure, context: StructureTableContext): AnatomyRow[] {
  const draft = draftColumns(TABLE, listMappingDrafters(structure, context.crosswalk), structure.review_state, ANATOMY_INDEX_STATUS);
  const shared = structureColumns(structure, context.templateSpace);
  const shipped = structure.nodes.map((node) => {
    const asset = findAsset(context.assetsById, node.asset_id, structure.key);
    return { ...draft, ...shapeCheckColumns(asset), ...shared, ...nodeColumns(node, asset) };
  });
  return shipped.length > 0 ? shipped : [{ ...draft, ...UNSHIPPED_CHECK_COLUMNS, ...shared, ...UNSHIPPED_NODE_COLUMNS }];
}

/**
 * @param crosswalk the reviewed crosswalk the index is built from
 * @param structures the index's own structures, built from that crosswalk
 */
export function buildStructureTable(data: AnatomyData, crosswalk: ReviewedCrosswalk, structures: readonly IndexStructure[]): AnatomyRow[] {
  const context: StructureTableContext = { crosswalk, assetsById: new Map(buildAssets(data).map((asset) => [asset.id, asset])), templateSpace: data.sources.declared_space };
  return structures.flatMap((structure) => toRows(structure, context));
}
