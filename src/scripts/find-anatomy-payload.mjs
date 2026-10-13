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
 * Markers of the HTML scan as the atlas pages have always used them: strings that appear in the anatomy
 * index or its evidence file and nowhere a page that must not carry them has reason to hold them. The
 * likely accident is a partial projection (one section of the index, or a view model with renamed keys),
 * so the list has three kinds of marker, and every section of the index carries at least one of each of
 * the first two:
 *   - field names that any slice of a section keeps;
 *   - values that survive a renaming of every key;
 *   - a key-and-value pair, which holds quote characters and so is only found once the page's quote
 *     encodings are decoded.
 * They are matched as plain text, and are for a page's HTML only: a script that reads the index holds
 * these names legitimately, so the script scan does not use them. A test asserts each marker occurs in a
 * built index or evidence file, and that each named projection is found, so the list cannot go stale.
 */
export const ANATOMY_PAYLOAD_MARKERS = Object.freeze([
  'review_state', 'check_status', 'extent_match', 'resolved_region_id', 'claim_basis', 'stated_license_id', 'clearance_reason',
  'quoted_terms', 'unlocks_when', 'declared_children', 'stale_evidence_keys', 'technique_rationales', 'asset_ids',
  'position_check', 'visual_check', 'modification_note',
  'ai_drafted_unreviewed', 'AI-drafted, unreviewed', 'AI-drafted and unreviewed unless an item says otherwise', 'not independently checked',
  'not_drafted', 'not_mapped', 'owner_contains_row_subject', 'row_subject_contains_owner', 'route_not_settled',
  'No device geometry has been recorded for this build', 'qif-anatomy-',
  '"state":"ai_drafted_unreviewed"',
]);

/**
 * Column names that only the exported anatomy tables (src/lib/anatomy/anatomy-tables.ts) use: each is
 * several words, and none is a field of the anatomy index, of its evidence file or of another site table.
 * One is matched only as an object key, with a boundary before it and a colon after, never inside a longer
 * word. Every table has several, so a table bundled whole or serialised into a page is found by its keys.
 */
export const ANATOMY_TABLE_KEY_MARKERS = Object.freeze([
  'ai_assigned_term_role', 'ai_reading_permits_shipping', 'ai_verdict', 'asset_license_id', 'atlas_label_count', 'atlas_label_ids',
  'atlas_label_names', 'band_level_reason', 'broader_or_narrower_term_count', 'drafted_to_draw', 'handled_as_license_id', 'has_drawn_shape',
  'license_read_by', 'license_read_on', 'mapped_qif_record_count', 'mapped_qif_record_keys', 'mapping_drafted_by', 'mapping_review_mark',
  'mapping_review_state', 'mapping_reviewed_by_role', 'mapping_reviewed_on', 'named_term_count', 'no_region_term_count', 'other_match_region_id',
  'quoted_pointer', 'region_band_in_technique_bands', 'region_in_other_band_term_count', 'reviewed_term_count', 'single_region_id',
  'single_region_match', 'single_region_term_count', 'stale_region_term_count', 'subject_geometry_reason', 'subject_geometry_reason_source',
  'subject_geometry_state', 'technique_band_ids', 'terms_drafted_by',
]);

/**
 * The tables' other column names. None is a marker: each is an ordinary word (`name`, `grant`, `urls`,
 * `hemisphere`), or a field the anatomy index and the code that reads it also use (`review_state`,
 * `check_status`, `position_check`), or a name unrelated code could plausibly choose (`structure_key`,
 * `match_kind`, `status_sentence`). A test holds this list and the markers above together equal to the
 * tables' columns, so a new column is put in one of the two on purpose.
 */
export const UNMARKED_ANATOMY_COLUMN_NAMES = Object.freeze([
  'addressing_version', 'arrives_in', 'asset_id', 'asset_path', 'asset_sha256', 'atlas', 'blockers', 'buildable', 'centroid_x_mm', 'centroid_y_mm',
  'centroid_z_mm', 'check_status', 'claim_basis', 'clearance_reason', 'contained_kind', 'definition_contested', 'delineated_in', 'delineation_basis',
  'drafted_by', 'extent_match', 'grant', 'hemisphere', 'hemispheres_drawn', 'human_confirmed', 'label_id', 'label_name', 'layers', 'match_kind',
  'name', 'name_match', 'named_term', 'part', 'pipeline_only', 'position_check', 'quote_state', 'quoted_field', 'quoted_file', 'quoted_terms',
  'quoted_text', 'rationale', 'review_key', 'review_mark', 'review_state', 'reviewed_by_role', 'reviewed_on', 'route_kind', 'route_note',
  'route_status', 'row_kind', 'scope', 'size_class', 'source_id', 'stated_license_id', 'status_sentence', 'structure_key', 'subject_id',
  'subject_kind', 'subject_name', 'subject_name_at_draft', 'technique_id', 'technique_name', 'template_space', 'terms_url', 'unlocks_when', 'urls',
  'valid_for_current_addressing', 'vertex_count', 'visual_check_state',
]);

/**
 * Values that survive a renaming of every key: the roles an AI gave a term, the match kinds that are not
 * ordinary words, and the crosswalk row kind. One is matched only as a whole quoted string.
 */
export const ANATOMY_TABLE_VALUE_MARKERS = Object.freeze([
  'named_as_acted_on', 'named_as_recorded_from', 'named_as_delivery_route', 'named_as_pathway_stage', 'named_in_catalog_target_field', 'adjective_for_named_structure',
  'term_is_broader_than_region', 'term_is_narrower_than_region', 'no_region_in_table', 'atlas_correspondence',
]);

/**
 * Keys of the anatomy data files and the asset manifest that the served index and evidence do not use.
 * In a script they mean a data file was bundled. Matched as object keys, like the table markers.
 */
export const ANATOMY_DATA_FILE_KEY_MARKERS = Object.freeze([
  'subject_name_at_draft', 'valid_for_addressing', 'considered_and_refused', 'attribution_text', 'digest_origin',
  'pipeline_code_hash', 'stage_fingerprints', 'input_fingerprint', 'computed_with_source_ids',
]);

const QUOTE_CHARACTERS = ['"', "'", '`'];

/** The quote and ampersand encodings a serialised payload can arrive in: HTML entities, and escapes inside a script string. */
function decodeMarkup(text) {
  return text
    .replaceAll('&quot;', '"').replaceAll('&#34;', '"').replaceAll('&#x22;', '"')
    .replaceAll('&amp;', '&').replaceAll('\\"', '"').replaceAll('\\u0022', '"');
}

/** `name` as an object key: quoted or bare, not part of a longer word, followed by a colon. */
function hasKey(text, name) {
  return new RegExp(`(?<![\\w$-])(?:"${name}"|'${name}'|${name})\\s*:`).test(text);
}

function hasQuotedValue(text, value) {
  return QUOTE_CHARACTERS.some((quote) => text.includes(`${quote}${value}${quote}`));
}

/** The table markers found in text whose quotes are already decoded: keys, then values. */
function findTableMarkers(decoded) {
  return [...ANATOMY_TABLE_KEY_MARKERS.filter((name) => hasKey(decoded, name)), ...ANATOMY_TABLE_VALUE_MARKERS.filter((value) => hasQuotedValue(decoded, value))];
}

/**
 * The markers found in a built page's HTML, in list order. An empty list means the page carries no anatomy
 * data that this scan can see. It cannot see a projection that keeps none of the marked keys or values
 * (a technique id, a word and a region id), an array of bare values, or an encoded payload such as base64.
 * Stopping those is the source walk's job (tool-page-imports.mjs).
 */
export function findAnatomyPayload(html) {
  const decoded = decodeMarkup(html);
  return [...ANATOMY_PAYLOAD_MARKERS.filter((marker) => html.includes(marker) || decoded.includes(marker)), ...findTableMarkers(decoded)];
}

/**
 * The markers found in a built script: the anatomy tables or an anatomy data file bundled into it, known
 * by their own keys and values. It does not look for the index's field names, which code that reads the
 * index holds legitimately, and it has the HTML scan's blind spots.
 */
export function findAnatomyPayloadInScript(source) {
  const decoded = decodeMarkup(source);
  return [...findTableMarkers(decoded), ...ANATOMY_DATA_FILE_KEY_MARKERS.filter((name) => hasKey(decoded, name))];
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

/** With no page named: every tool page as the post-build check reads it, saying what was scanned for each. */
async function checkToolPages() {
  const { findAnatomyPayloadFailures } = await import('./check-post-build.mjs');
  const { DEFAULT_DIST_DIRECTORY, TOOL_PAGES } = await import('./tool-pages.mjs');
  const failures = findAnatomyPayloadFailures(DEFAULT_DIST_DIRECTORY, TOOL_PAGES);
  if (failures.length > 0) throw new Error(`${failures.join('\n  ')}\n  Pass a page only the index's path, length and sha256.`);
  for (const page of TOOL_PAGES) {
    const scanned = page.scriptsMayCarryAnatomy === true ? 'the page (its scripts may carry anatomy code and were not scanned)' : 'the page or in any script it can load';
    process.stdout.write(`[find-anatomy-payload] ${page.urlPath}: no anatomy data in ${scanned}.\n`);
  }
}

async function runAsCommand(pagePaths) {
  if (pagePaths.length > 0) checkBuiltPages(pagePaths);
  else await checkToolPages();
}

// Not a top-level await: check-post-build.mjs imports this module, and waiting here for it to load would never settle.
if (isInvokedDirectly()) {
  runAsCommand(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`[find-anatomy-payload] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
