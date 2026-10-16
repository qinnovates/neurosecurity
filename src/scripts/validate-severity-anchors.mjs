#!/usr/bin/env node
/**
 * Validate datalake/severity-anchors.json.
 *
 * Two jobs. The first is ordinary schema validation: every row carries the five
 * fields that make a rate a measurement rather than a number — endpoint as the
 * source itself defines it, denominator family, N, rate, and time base — plus a
 * band and at least one source id.
 *
 * The second is the scope guard, and it is the reason this file exists rather
 * than a JSON schema. This table is keyed by recoverability band and device
 * CLASS. A per-record map of stimulation target to mental state is the artefact
 * this project stopped building, and the way such a table comes back is by
 * accretion: one `target` field added for a good local reason. So any field
 * naming an anatomical target or a stimulation setting is a hard failure, at
 * any depth, and so is any value that looks like one.
 *
 * Exit 0 clean, 1 on any error. Run: node src/scripts/validate-severity-anchors.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FILE = join(ROOT, 'datalake', 'severity-anchors.json');

/** Bands this table may use. Death is not among them and must not be added. */
export const VALID_BANDS = ['B1', 'B2', 'B3', 'B4', 'B2-B4'];

/** Required on every row; `time_base` may be null but must be present. */
export const REQUIRED_FIELDS = ['id', 'band', 'device_class', 'endpoint', 'denominator_family', 'n', 'rate', 'time_base', 'source_ids'];

/**
 * Field names that would turn this into a site-to-state map. Matched as
 * substrings of a lowercased key, so `anatomical_target` and `targetSite` both
 * trip `target`.
 */
export const FORBIDDEN_FIELD_SUBSTRINGS = [
  'target', 'site', 'contact', 'amplitude', 'frequency', 'pulse_width', 'pulsewidth',
  'programming', 'parameter', 'electrode', 'lead_position', 'coordinate', 'voltage',
  'current_density', 'anatomy', 'anatomical', 'structure', 'region', 'nucleus',
];

/**
 * Anatomical structures and stimulation units. Matched against string values as
 * whole words, so prose like "device class" is unaffected while a value naming
 * a target is not.
 */
export const FORBIDDEN_VALUE_TERMS = [
  'thalamus', 'thalamic', 'subthalamic', 'stn', 'globus pallidus', 'gpi', 'gpe',
  'hippocampus', 'hippocampal', 'amygdala', 'internal capsule', 'cingulate',
  'nucleus accumbens', 'substantia nigra', 'ventral capsule', 'anterior nucleus',
  'centromedian', 'fornix', 'putamen', 'caudate', 'insula', 'motor cortex',
  'milliamp', 'microamp', 'hertz', 'microsecond pulse',
];

function walk(value, path, visit) {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((child, i) => walk(child, `${path}[${i}]`, visit));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`, visit);
  }
}

/** [{ path, field }] for every forbidden field name, at any depth. */
export function findForbiddenFields(doc) {
  const hits = [];
  walk(doc, '$', (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const key of Object.keys(value)) {
      const lower = key.toLowerCase();
      // `source_ids` and `rate_unit` are legitimate and must not trip `site`/`parameter`.
      if (['source_ids', 'rate_unit', 'rate_value', 'finding_direction'].includes(lower)) continue;
      const hit = FORBIDDEN_FIELD_SUBSTRINGS.find((bad) => lower.includes(bad));
      if (hit) hits.push({ path: `${path}.${key}`, field: key, matched: hit });
    }
  });
  return hits;
}

/**
 * [{ path, term }] for every forbidden value term. `_metadata` is skipped: it
 * states the guard and the forbidden join by name, which is the point of it.
 */
export function findForbiddenValues(doc) {
  const hits = [];
  walk(doc.anchors ?? [], '$.anchors', (value, path) => {
    if (typeof value !== 'string') return;
    const lower = value.toLowerCase();
    for (const term of FORBIDDEN_VALUE_TERMS) {
      if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)) {
        hits.push({ path, term, value: value.slice(0, 120) });
      }
    }
  });
  return hits;
}

/** [string] of schema errors. */
export function findSchemaErrors(doc) {
  const errors = [];
  const anchors = doc.anchors;
  if (!Array.isArray(anchors) || anchors.length === 0) {
    errors.push('anchors must be a non-empty array');
    return errors;
  }
  const seen = new Set();
  for (const row of anchors) {
    const id = row?.id ?? '<no id>';
    for (const field of REQUIRED_FIELDS) {
      if (!(field in row)) errors.push(`${id}: missing required field ${field}`);
    }
    if (seen.has(row.id)) errors.push(`${id}: duplicate id`);
    seen.add(row.id);
    if (!VALID_BANDS.includes(row.band)) {
      errors.push(`${id}: band ${JSON.stringify(row.band)} is not one of ${VALID_BANDS.join(', ')}`);
    }
    if (!Array.isArray(row.source_ids) || row.source_ids.length === 0) {
      errors.push(`${id}: source_ids must be a non-empty array — a rate with no citation is not a measurement`);
    }
    if (typeof row.endpoint !== 'string' || row.endpoint.trim().length < 10) {
      errors.push(`${id}: endpoint must state the endpoint as the source defines it`);
    }
    if (typeof row.denominator_family !== 'string' || row.denominator_family.trim() === '') {
      errors.push(`${id}: denominator_family is required; a rate without one cannot be compared`);
    }
    if (!Number.isFinite(row.n) || row.n <= 0) errors.push(`${id}: n must be a positive number`);
    // time_base may be null (the source did not report one) but the key must exist,
    // because a null is the fact that makes the row non-comparable.
    if (row.time_base !== null && typeof row.time_base !== 'string') {
      errors.push(`${id}: time_base must be a string or null`);
    }
  }
  const stated = doc._metadata?.total_rows;
  if (stated !== undefined && stated !== anchors.length) {
    errors.push(`_metadata.total_rows says ${stated} but there are ${anchors.length} rows`);
  }
  return errors;
}

function main() {
  const doc = JSON.parse(readFileSync(FILE, 'utf-8'));
  const schema = findSchemaErrors(doc);
  const fields = findForbiddenFields(doc);
  const values = findForbiddenValues(doc);

  for (const error of schema) console.error(`[schema] ${error}`);
  for (const hit of fields) {
    console.error(`[scope] forbidden field ${hit.path} (matched "${hit.matched}") — this table is keyed by band and device class only`);
  }
  for (const hit of values) {
    console.error(`[scope] forbidden value at ${hit.path}: "${hit.term}" in ${JSON.stringify(hit.value)}`);
  }

  const total = schema.length + fields.length + values.length;
  if (total > 0) {
    console.error(`\nseverity-anchors.json: ${total} error(s)`);
    process.exit(1);
  }
  console.log(`severity-anchors.json: ${doc.anchors.length} rows valid, scope guard clean`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
