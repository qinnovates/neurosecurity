#!/usr/bin/env node
/**
 * Finds anatomy data that has been serialised into a built page.
 *
 * The anatomy index and its evidence file are served as their own static
 * files, and a page is built with only the index's path, length and digest.
 * A source scan can be routed around (a relay module, a glob, a file read);
 * this looks at what was actually built. It is meant for the post-build
 * checks, which run after `npm run build`.
 *
 * Usage (after `npm run build`):
 *   node src/scripts/find-anatomy-payload.mjs                      every tool page and every script it can load
 *   node src/scripts/find-anatomy-payload.mjs built-page.html ...  the HTML of the pages named
 */

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';


/**
 * Column names of the exported anatomy tables (src/lib/anatomy/anatomy-tables.ts) that are too common to
 * mark anything: the Lab's own catalog and code use each of these words today. Every other column name is
 * a marker below, and a test holds the two lists together equal to the tables' columns.
 */
export const UNMARKED_ANATOMY_COLUMN_NAMES = Object.freeze(['atlas', 'layers', 'name', 'part', 'rationale', 'scope', 'technique_id']);

/** Every other column name of the exported anatomy tables. */
export const ANATOMY_TABLE_COLUMN_MARKERS = Object.freeze([
  'addressing_version', 'ai_assigned_term_role', 'ai_reading_permits_shipping', 'ai_verdict', 'arrives_in', 'asset_id', 'asset_license_id',
  'asset_path', 'asset_sha256', 'atlas_label_count', 'atlas_label_ids', 'atlas_label_names', 'band_level_reason', 'blockers',
  'broader_or_narrower_term_count', 'buildable', 'centroid_x_mm', 'centroid_y_mm', 'centroid_z_mm', 'check_status', 'claim_basis',
  'clearance_reason', 'contained_kind', 'definition_contested', 'delineated_in', 'delineation_basis', 'drafted_by', 'drafted_to_draw',
  'extent_match', 'grant', 'handled_as_license_id', 'has_drawn_shape', 'hemisphere', 'hemispheres_drawn', 'human_confirmed', 'label_id',
  'label_name', 'license_read_by', 'license_read_on', 'mapped_qif_record_count', 'mapped_qif_record_keys', 'mapping_drafted_by',
  'mapping_review_mark', 'mapping_review_state', 'mapping_reviewed_by_role', 'mapping_reviewed_on', 'match_kind', 'name_match', 'named_term',
  'named_term_count', 'no_region_term_count', 'other_match_region_id', 'pipeline_only', 'position_check', 'quote_state', 'quoted_field',
  'quoted_file', 'quoted_pointer', 'quoted_terms', 'quoted_text', 'region_band_in_technique_bands', 'region_in_other_band_term_count', 'review_key',
  'review_mark', 'review_state', 'reviewed_by_role', 'reviewed_on', 'reviewed_term_count', 'route_kind', 'route_note', 'route_status', 'row_kind',
  'single_region_id', 'single_region_match', 'single_region_term_count', 'size_class', 'source_id', 'stale_region_term_count', 'stated_license_id',
  'status_sentence', 'structure_key', 'subject_geometry_reason', 'subject_geometry_reason_source', 'subject_geometry_state', 'subject_id',
  'subject_kind', 'subject_name', 'subject_name_at_draft', 'technique_band_ids', 'technique_name', 'template_space', 'terms_drafted_by', 'terms_url',
  'unlocks_when', 'urls', 'valid_for_current_addressing', 'vertex_count', 'visual_check_state',
]);

/**
 * What survives a renaming of every key: the role and match-kind values, the crosswalk row kind and the
 * status sentences of the drafted files. A projection that keeps only a technique id, a word and a region
 * id carries none of these in a page's HTML; a table bundled whole into a script carries all of them.
 */
const ANATOMY_TABLE_VALUE_MARKERS = [
  'named_as_acted_on', 'named_as_recorded_from', 'named_as_delivery_route', 'named_as_pathway_stage', 'named_in_catalog_target_field', 'adjective_for_named_structure',
  'term_is_broader_than_region', 'term_is_narrower_than_region', 'no_region_in_table', 'atlas_correspondence',
  'Links are a reading of the catalog', 'No neuroanatomist has checked these correspondences', 'AI-drafted source registry', 'made by AI and not by a lawyer',
];

/**
 * Strings that appear in the anatomy index or its evidence file and nowhere a
 * page that must not carry them has reason to hold them. The likely accident is
 * a partial projection (one section of the index, or a view model with renamed
 * keys), so the list has three kinds of marker, and every section of the index
 * carries at least one of each of the first two:
 *   - field names that any slice of a section keeps;
 *   - values that survive a renaming of every key;
 *   - a key-and-value pair, which holds quote characters and so is only found
 *     once the page's quote encodings are decoded.
 * A test asserts each marker occurs in a built index or evidence file, and
 * that each named projection is found, so the list cannot go stale.
 */
/** A column of the tables may also be a field of the index; each marker is listed once. */
export const ANATOMY_PAYLOAD_MARKERS = Object.freeze([...new Set([
  'review_state', 'check_status', 'extent_match', 'resolved_region_id', 'claim_basis', 'stated_license_id', 'clearance_reason',
  'quoted_terms', 'unlocks_when', 'declared_children', 'stale_evidence_keys', 'technique_rationales', 'asset_ids',
  'position_check', 'visual_check', 'modification_note',
  'ai_drafted_unreviewed', 'AI-drafted, unreviewed', 'AI-drafted and unreviewed unless an item says otherwise', 'not independently checked',
  'not_drafted', 'not_mapped', 'owner_contains_row_subject', 'row_subject_contains_owner', 'route_not_settled',
  'No device geometry has been recorded for this build', 'qif-anatomy-',
  '"state":"ai_drafted_unreviewed"',
  ...ANATOMY_TABLE_COLUMN_MARKERS,
  ...ANATOMY_TABLE_VALUE_MARKERS,
])]);

/** The quote and ampersand encodings a serialised payload can arrive in: HTML entities, and escapes inside a script string. */
function decodeMarkup(html) {
  return html
    .replaceAll('&quot;', '"').replaceAll('&#34;', '"').replaceAll('&#x22;', '"')
    .replaceAll('&amp;', '&').replaceAll('\\"', '"').replaceAll('\\u0022', '"');
}

/** The markers found in `html`, in list order. An empty list means the page carries no anatomy payload. */
export function findAnatomyPayload(html) {
  const decoded = decodeMarkup(html);
  return ANATOMY_PAYLOAD_MARKERS.filter((marker) => html.includes(marker) || decoded.includes(marker));
}

function isInvokedDirectly() {
  return process.argv[1] !== undefined && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

function checkBuiltPages(pagePaths) {
  for (const pagePath of pagePaths) {
    const markers = findAnatomyPayload(readFileSync(pagePath, 'utf-8'));
    if (markers.length > 0) {
      throw new Error(`${pagePath} carries anatomy data (found: ${markers.join(', ')}). Pass a page only the index's path, length and sha256.`);
    }
    process.stdout.write(`[find-anatomy-payload] ${pagePath}: no anatomy data in the page.\n`);
  }
}

/** With no page named: every tool page and every script it can load, as the post-build check reads them. */
async function checkToolPages() {
  const { findAnatomyPayloadFailures } = await import('./check-post-build.mjs');
  const { DEFAULT_DIST_DIRECTORY, TOOL_PAGES } = await import('./tool-pages.mjs');
  const failures = findAnatomyPayloadFailures(DEFAULT_DIST_DIRECTORY, TOOL_PAGES);
  if (failures.length > 0) throw new Error(`${failures.join('\n  ')}\n  Pass a page only the index's path, length and sha256.`);
  process.stdout.write(`[find-anatomy-payload] ${TOOL_PAGES.map((page) => page.urlPath).join(', ')}: no anatomy data in the page or in any script it can load.\n`);
}

async function runAsCommand(pagePaths) {
  if (pagePaths.length > 0) checkBuiltPages(pagePaths);
  else await checkToolPages();
}

// Not a top-level await: check-post-build.mjs imports this module, and waiting here for it to load would never settle.
if (isInvokedDirectly()) {
  runAsCommand(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`[find-anatomy-payload] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
