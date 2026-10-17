/**
 * The names of the exported anatomy tables and of the columns every one of
 * them carries, with the two vocabularies a description has to count by.
 * Build time only: a page that needs to recognise an anatomy table by name
 * imports table-prefix.ts, which holds the prefix and nothing else.
 */

import type { Resolution } from './resolve-region-term';
import { ANATOMY_TABLE_PREFIX, isAnatomyTableName } from './table-prefix';

export { ANATOMY_TABLE_PREFIX, isAnatomyTableName };

export const ANATOMY_TABLE_NAMES = ['anatomy_sources', 'anatomy_structures', 'anatomy_crosswalk', 'anatomy_technique_terms', 'anatomy_technique_term_summary'] as const;
export type AnatomyTableName = typeof ANATOMY_TABLE_NAMES[number];

/** The four review columns, in the order they open every row, so a preview shows them before anything else. */
const REVIEW_COLUMN_STEMS = ['review_mark', 'review_state', 'reviewed_by_role', 'reviewed_on'] as const;
export type ReviewColumnStem = typeof REVIEW_COLUMN_STEMS[number];
export const STATUS_COLUMN = 'status_sentence';
const DRAFTER_STEM = 'drafted_by';

/**
 * What a table's review and drafter columns describe, as a column-name prefix.
 * A source reading, a crosswalk row and a technique term are each reviewed and
 * drafted as themselves. A structure's shape is built by a pipeline and checked
 * by `visual_check_state` and `position_check`; only its mapping to QIF records
 * is drafted and reviewed, so its columns say `mapping_`. A summary row is
 * never reviewed itself, and its drafter is its terms'.
 */
const REVIEWED_THING_PREFIX: Readonly<Record<AnatomyTableName, string>> = {
  anatomy_sources: '',
  anatomy_structures: 'mapping_',
  anatomy_crosswalk: '',
  anatomy_technique_terms: '',
  anatomy_technique_term_summary: '',
};
const DRAFTED_THING_PREFIX: Readonly<Record<AnatomyTableName, string>> = { ...REVIEWED_THING_PREFIX, anatomy_technique_term_summary: 'terms_' };

export function reviewColumn(table: AnatomyTableName, stem: ReviewColumnStem): string {
  return `${REVIEWED_THING_PREFIX[table]}${stem}`;
}

export function drafterColumn(table: AnatomyTableName): string {
  return `${DRAFTED_THING_PREFIX[table]}${DRAFTER_STEM}`;
}

/** The six columns that open every row of a table, in order. No anatomy table may lack one. */
export function listDraftColumns(table: AnatomyTableName): string[] {
  return [...REVIEW_COLUMN_STEMS.map((stem) => reviewColumn(table, stem)), drafterColumn(table), STATUS_COLUMN];
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
