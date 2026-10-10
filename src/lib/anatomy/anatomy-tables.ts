/**
 * Builds the anatomy tables published outside the atlas page: the query
 * console's tables and, from the same rows, the parquet files. Every derived
 * value (review state, check status, geometry state, what a term resolves to,
 * whether it lights a region) comes from the functions the anatomy index is
 * built with, called on the same reviewed rows, so a table cannot disagree
 * with the index.
 *
 * Build time only (digests use node:crypto). Pure: the parsed files go in and
 * rows come out.
 */

import type { AnatomyData } from './anatomy-inputs';
import { reviewTechniqueLinks } from './build-index-techniques';
import { buildCrosswalkTable } from './crosswalk-table';
import { reviewCrosswalkRows, reviewNoGeometry } from './review-rows';
import { buildSourceTable } from './source-table';
import { buildStructureTable } from './structure-table';
import type { AnatomyRow } from './table-columns';
import { buildTechniqueTables } from './technique-tables';
import { readTermRoles } from './term-roles';

/** Every anatomy table shares this prefix. The parquet generator and the health check find the tables by it. */
export const ANATOMY_TABLE_PREFIX = 'anatomy_';
export const ANATOMY_TABLE_NAMES = ['anatomy_sources', 'anatomy_structures', 'anatomy_crosswalk', 'anatomy_technique_terms', 'anatomy_technique_scopes'] as const;
export type AnatomyTableName = typeof ANATOMY_TABLE_NAMES[number];
export type AnatomyTables = Record<AnatomyTableName, AnatomyRow[]>;

/**
 * @param data every anatomy data file, parsed and cross-checked
 * @param techniqueRegionCuration the parsed curation record the technique links were generated from; only each link's role is read
 */
export function buildAnatomyTables(data: AnatomyData, techniqueRegionCuration: unknown): AnatomyTables {
  const crosswalk = reviewCrosswalkRows(data);
  const noGeometry = reviewNoGeometry(data);
  const techniqueTables = buildTechniqueTables(data, reviewTechniqueLinks(data), readTermRoles(techniqueRegionCuration));
  return {
    anatomy_sources: buildSourceTable(data),
    anatomy_structures: buildStructureTable(data, crosswalk),
    anatomy_crosswalk: buildCrosswalkTable(data, crosswalk, noGeometry),
    anatomy_technique_terms: techniqueTables.terms,
    anatomy_technique_scopes: techniqueTables.scopes,
  };
}
