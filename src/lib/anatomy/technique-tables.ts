/**
 * The two technique tables.
 *
 * `anatomy_technique_terms`: one row per drafted link. A row says the
 * technique's own registrar text uses a word for a brain structure, quotes
 * that text, and says what the word resolves to in the region table. It does
 * not say the technique targets the region: most terms resolve to a broader
 * or narrower structure, or to nothing, and `lights_region` is false for them.
 *
 * `anatomy_technique_scopes`: one row per registrar technique with a neural
 * band that has an entry in the technique-regions file, saying whether any
 * link was drafted and, if none, the stated reason.
 */

import type { AnatomyData } from './anatomy-inputs';
import type { IndexTechnique, IndexTechniqueLink } from './anatomy-index-types';
import { DRAFTERS } from './anatomy-types';
import { buildTechniques, type ReviewedLink } from './build-index-techniques';
import { REGISTRAR_FILE, readBandLevelReason } from './parse-technique-regions';
import { toIndexReviewState, worstReviewState } from './review-state';
import { draftColumns, evidenceColumns, joinIds, type AnatomyRow } from './table-columns';
import { findTermRole } from './term-roles';

/** The technique-regions file drafts every entry by AI and stores the drafter on links only, so an entry's is stated here. */
const ENTRY_DRAFTER = DRAFTERS[0];
/** A technique with no entry in the file has nothing drafted, so it has no row: a row would have to name a drafter. */
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

function resolutionColumns(entry: IndexTechniqueLink): AnatomyRow {
  return {
    resolution: entry.resolution,
    resolved_region_id: entry.resolved_region_id ?? NO_REGION,
    band_agrees: entry.band_agrees,
    valid_for_current_addressing: entry.valid_for_current_addressing,
    lights_region: entry.lit,
  };
}

function toTermRow(reviewed: ReviewedLink, technique: IndexTechnique, roles: ReadonlyMap<string, string>, statusSentence: string): AnatomyRow {
  const { link, entry } = reviewed;
  return {
    ...techniqueColumns(technique),
    named_term: link.term,
    term_role: findTermRole(roles, technique.id, link.term),
    quoted_field: toQuotedField(link.evidence.source_ref.pointer),
    ...evidenceColumns(link.evidence, reviewed),
    ...resolutionColumns(entry),
    review_key: reviewed.key,
    ...draftColumns(link.drafted_by, entry.review_state, statusSentence),
  };
}

/** The distinct regions a technique's lit links resolve to. Empty for most techniques. */
function listLitRegionIds(technique: IndexTechnique): string[] {
  const litIds = technique.links.flatMap((link) => (link.lit && link.resolved_region_id !== null ? [link.resolved_region_id] : []));
  return [...new Set(litIds)];
}

function toScopeRow(technique: IndexTechnique, data: AnatomyData): AnatomyRow {
  const entry = data.techniqueRegions.techniques[technique.id];
  const litRegionIds = listLitRegionIds(technique);
  const reviewState = toIndexReviewState(worstReviewState(technique.links.map((link) => link.review_state)));
  return {
    ...techniqueColumns(technique),
    scope: technique.scope,
    band_level_reason: (entry === undefined ? null : readBandLevelReason(entry)) ?? NO_REASON,
    rationale: entry?.rationale ?? NO_RATIONALE,
    named_term_count: technique.links.length,
    lighting_term_count: technique.links.filter((link) => link.lit).length,
    lit_region_ids: joinIds(litRegionIds),
    lit_region_count: litRegionIds.length,
    ...draftColumns(ENTRY_DRAFTER, reviewState, data.techniqueRegions.status),
  };
}

export interface TechniqueTables {
  terms: AnatomyRow[];
  scopes: AnatomyRow[];
}

/**
 * @param links the reviewed links the index is built from
 * @param roles each curated link's role, by ledger key
 */
export function buildTechniqueTables(data: AnatomyData, links: readonly ReviewedLink[], roles: ReadonlyMap<string, string>): TechniqueTables {
  const techniques = buildTechniques(data, links, data.documentsByFile.get(REGISTRAR_FILE)).filter((technique) => technique.scope !== NOT_DRAFTED);
  const statusSentence = data.techniqueRegions.status;
  const terms = techniques.flatMap((technique) => links
    .filter((reviewed) => reviewed.technique_id === technique.id)
    .map((reviewed) => toTermRow(reviewed, technique, roles, statusSentence)));
  return { terms, scopes: techniques.map((technique) => toScopeRow(technique, data)) };
}
