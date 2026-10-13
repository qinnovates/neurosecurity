/**
 * The names of the exported anatomy tables and of the columns every one of
 * them carries, with the two vocabularies a description has to count by. This
 * module imports no code, so code that runs in a page may read a name from it
 * without reaching the tables themselves.
 */

import type { Resolution } from './resolve-region-term';

/**
 * Every anatomy table shares this prefix. src/scripts/generate-parquet.py and
 * src/scripts/propagation-check.mjs each hold a copy; a test compares both
 * with this one.
 */
export const ANATOMY_TABLE_PREFIX = 'anatomy_';

export const ANATOMY_TABLE_NAMES = ['anatomy_sources', 'anatomy_structures', 'anatomy_crosswalk', 'anatomy_technique_terms', 'anatomy_technique_term_summary'] as const;
export type AnatomyTableName = typeof ANATOMY_TABLE_NAMES[number];

/** The review columns, in the order they open every row, so a preview shows them before anything else. */
export const REVIEW_COLUMNS = ['review_mark', 'review_state', 'reviewed_by_role', 'reviewed_on'] as const;
export const STATUS_COLUMN = 'status_sentence';

/**
 * The column that says who drafted a row. It is named for what was drafted:
 * a source reading, a crosswalk row and a technique term each store their own
 * drafter; a structure's shape is built by a pipeline, so only its mapping to
 * QIF records has one; a summary row has none of its own, only its terms'.
 */
export const DRAFTER_COLUMN_BY_TABLE: Readonly<Record<AnatomyTableName, string>> = {
  anatomy_sources: 'drafted_by',
  anatomy_structures: 'mapping_drafted_by',
  anatomy_crosswalk: 'drafted_by',
  anatomy_technique_terms: 'drafted_by',
  anatomy_technique_term_summary: 'terms_drafted_by',
};

/** The six columns that open every row of a table, in order. No anatomy table may lack one. */
export function listDraftColumns(table: AnatomyTableName): string[] {
  return [...REVIEW_COLUMNS, DRAFTER_COLUMN_BY_TABLE[table], STATUS_COLUMN];
}

export function isAnatomyTableName(name: string): boolean {
  return name.startsWith(ANATOMY_TABLE_PREFIX);
}

/** The resolver's match, named for what it says about the word. The resolver decides; this only renames. */
export const MATCH_KINDS = {
  id: 'region_id',
  synonym: 'synonym',
  whole_to_part: 'term_is_broader_than_region',
  part_to_whole: 'term_is_narrower_than_region',
  unclassified: 'no_region_in_table',
} as const satisfies Record<Resolution, string>;
export type MatchKind = typeof MATCH_KINDS[Resolution];

/** The match kinds under which a word names exactly one listed region. */
export const ONE_REGION_MATCH_KINDS: readonly MatchKind[] = [MATCH_KINDS.id, MATCH_KINDS.synonym];

export const CROSSWALK_ROW_KINDS = { CORRESPONDENCE: 'atlas_correspondence', NO_GEOMETRY: 'no_geometry' } as const;
