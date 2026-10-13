/**
 * The two technique tables.
 *
 * `anatomy_technique_terms`: one row per drafted link. A row says the
 * technique's own registrar text uses a word for a brain structure, quotes
 * that text, and says how the word matches the QIF region table. It does not
 * say the technique acts on a region.
 *
 * `single_region_id` is filled only on a single-region match: the word is a
 * region's id or a listed synonym, that region's band is among the technique's
 * band tags, the row is valid for the current addressing and its quote still
 * stands (the index's `lit`). Whatever else the alias table returns for the
 * word goes in `alias_match_region_id`, with `match_kind` saying why it is not
 * a single-region match.
 *
 * `anatomy_technique_term_summary`: one row per registrar technique that has
 * an entry in the technique-regions file, with counts only. It names no region:
 * a region without its quote and match kind would be a bare claim.
 */

import type { AnatomyData } from './anatomy-inputs';
import type { IndexTechnique, IndexTechniqueLink } from './anatomy-index-types';
import { buildTechniques, type ReviewedLink } from './build-index-techniques';
import { REGISTRAR_FILE, readBandLevelReason } from './parse-technique-regions';
import { lightsRegion, type Resolution } from './resolve-region-term';
import { UNREVIEWED, toIndexReviewState } from './review-state';
import { draftColumns, evidenceColumns, joinIds, type AnatomyRow } from './table-columns';
import { findTermRole, type ExportedTermRole } from './term-roles';

const TERMS_TABLE = 'anatomy_technique_terms';
const SUMMARY_TABLE = 'anatomy_technique_term_summary';

/** The resolver's match, named for what it says about the word. The resolver decides; this only renames. */
export const MATCH_KINDS = {
  id: 'region_id',
  synonym: 'synonym',
  whole_to_part: 'term_is_broader_than_region',
  part_to_whole: 'term_is_narrower_than_region',
  unclassified: 'no_region_in_table',
} as const satisfies Record<Resolution, string>;

/** A technique with no entry in the file has nothing drafted, so it has no row. */
const NOT_DRAFTED: IndexTechnique['scope'] = 'not_drafted';
const NO_REGION = '';
const NO_REASON = '';
const NO_RATIONALE = '';
const POINTER_SEPARATOR = '/';
const FIELD_NAME_SEPARATOR = '.';
/** A link's pointer is `/techniques/<id>/<field path>`: an empty token, `techniques`, the id, then the field. */
const FIELD_PATH_START = 3;

/** `/techniques/QIF-T0127/tara/dsm5/pathway` as `tara.dsm5.pathway`, the way the registrar's fields are spoken of. */
export function toQuotedField(pointer: string): string {
  return pointer.split(POINTER_SEPARATOR).slice(FIELD_PATH_START).join(FIELD_NAME_SEPARATOR);
}

function techniqueColumns(technique: IndexTechnique): AnatomyRow {
  return { technique_id: technique.id, technique_name: technique.name, technique_band_ids: joinIds(technique.band_ids) };
}

/** The region id goes in exactly one of two columns, so a filter on `single_region_id` can only return single-region matches. */
function matchColumns(entry: IndexTechniqueLink): AnatomyRow {
  const resolverHit = entry.resolved_region_id ?? NO_REGION;
  return {
    match_kind: MATCH_KINDS[entry.resolution],
    single_region_match: entry.lit,
    single_region_id: entry.lit ? resolverHit : NO_REGION,
    alias_match_region_id: entry.lit ? NO_REGION : resolverHit,
    region_band_in_technique_bands: entry.band_agrees,
    valid_for_current_addressing: entry.valid_for_current_addressing,
  };
}

function toTermRow(reviewed: ReviewedLink, technique: IndexTechnique, roles: ReadonlyMap<string, ExportedTermRole>, statusSentence: string): AnatomyRow {
  const { link, entry } = reviewed;
  return {
    ...draftColumns(TERMS_TABLE, [link.drafted_by], entry.review_state, statusSentence),
    ...techniqueColumns(technique),
    named_term: link.term,
    ai_assigned_term_role: findTermRole(roles, technique.id, link.term),
    quoted_field: toQuotedField(link.evidence.source_ref.pointer),
    ...evidenceColumns(link.evidence, reviewed),
    ...matchColumns(entry),
    review_key: reviewed.key,
  };
}

/**
 * How a technique's terms fall out, as counts that add up to `named_term_count`.
 * A term that names one listed region is a single-region match, or sits in a
 * band the technique does not carry, or is stale (out of date for the
 * addressing, or its quote is gone).
 */
function countColumns(links: readonly IndexTechniqueLink[]): AnatomyRow {
  const count = (test: (link: IndexTechniqueLink) => boolean): number => links.filter(test).length;
  const namesOneRegion = (link: IndexTechniqueLink): boolean => lightsRegion(link.resolution);
  return {
    named_term_count: links.length,
    single_region_term_count: count((link) => link.lit),
    region_in_other_band_term_count: count((link) => namesOneRegion(link) && !link.band_agrees),
    stale_region_term_count: count((link) => namesOneRegion(link) && link.band_agrees && !link.lit),
    broader_or_narrower_term_count: count((link) => !namesOneRegion(link) && link.resolved_region_id !== null),
    no_region_term_count: count((link) => link.resolved_region_id === null),
  };
}

/**
 * A summary row has no ledger key, so nothing can review it: it reads
 * unreviewed whatever its terms' states are. `reviewed_term_count` says how
 * many of its terms a review covers.
 */
function toSummaryRow(technique: IndexTechnique, drafters: readonly ReviewedLink[], data: AnatomyData): AnatomyRow {
  const entry = data.techniqueRegions.techniques[technique.id];
  return {
    ...draftColumns(SUMMARY_TABLE, drafters.map((reviewed) => reviewed.link.drafted_by), toIndexReviewState(UNREVIEWED), data.techniqueRegions.status),
    ...techniqueColumns(technique),
    scope: technique.scope,
    band_level_reason: (entry === undefined ? null : readBandLevelReason(entry)) ?? NO_REASON,
    rationale: entry?.rationale ?? NO_RATIONALE,
    ...countColumns(technique.links),
    reviewed_term_count: technique.links.filter((link) => link.review_state.state === 'reviewed').length,
  };
}

export interface TechniqueTables {
  terms: AnatomyRow[];
  summary: AnatomyRow[];
}

/**
 * @param links the reviewed links the index is built from
 * @param roles each curated link's exported role, by ledger key
 */
export function buildTechniqueTables(data: AnatomyData, links: readonly ReviewedLink[], roles: ReadonlyMap<string, ExportedTermRole>): TechniqueTables {
  const techniques = buildTechniques(data, links, data.documentsByFile.get(REGISTRAR_FILE)).filter((technique) => technique.scope !== NOT_DRAFTED);
  const statusSentence = data.techniqueRegions.status;
  const linksOf = (technique: IndexTechnique): ReviewedLink[] => links.filter((reviewed) => reviewed.technique_id === technique.id);
  return {
    terms: techniques.flatMap((technique) => linksOf(technique).map((reviewed) => toTermRow(reviewed, technique, roles, statusSentence))),
    summary: techniques.map((technique) => toSummaryRow(technique, linksOf(technique), data)),
  };
}
