#!/usr/bin/env node
/**
 * Derives `origin_band` and `target_bands` of every pathway in
 * qif-neural-pathways.json from `brain_regions[].qif_band` in
 * qif-brain-bci-atlas.json.
 *
 * Why this exists: a region's band was stored in both files and they
 * disagreed (the ventral tegmental area was N5 in the atlas and N2 as a
 * pathway origin). The atlas region table is the one source; the pathway band
 * fields are kept because the site, the KQL tables and the Parquet export read
 * them, but they are now a derived copy that this script regenerates.
 *
 *   origin_band  = the single band shared by every origin region
 *   target_bands = the bands of the target regions, deduplicated, in target order
 *
 * Order is part of the value: a stored target_bands list in any other order
 * counts as stale, so the committed file is exactly what this script writes.
 *
 * This makes the two files agree. It does not judge whether a region's band in
 * the atlas is right; change the band there and rerun this script.
 *
 * The pathway file is hand-formatted, so only the two fields are rewritten in
 * place; nothing else in the file moves.
 *
 * Usage:
 *   npm run derive:pathway-bands             # rewrite stale fields
 *   npm run derive:pathway-bands -- --check  # exit 1 if any field is stale
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DATALAKE_DIR, runAsCli } from './datalake-cli.mjs';
import { createClassifiedRegionResolver } from './region-resolver.mjs';

const ATLAS_PATH = path.join(DATALAKE_DIR, 'qif-brain-bci-atlas.json');
const PATHWAYS_PATH = path.join(DATALAKE_DIR, 'qif-neural-pathways.json');

const PATHWAY_ID_LINE = /^\s*"id": "([^"]+)",?\s*$/;
const ORIGIN_BAND_LINE = /^(\s*"origin_band": )"[^"]*"(,?\s*)$/;
const TARGET_BANDS_LINE = /^(\s*"target_bands": )\[[^\]]*\](,?\s*)$/;

export class MixedOriginBandError extends Error {
  constructor(pathwayId, bands) {
    super(
      `Pathway "${pathwayId}" must have origins in exactly one band, but its origins resolve to ${bands.length} `
      + `(${bands.join(', ') || 'no origin listed'}). Give it an origin, split it, or change the origin_band schema; `
      + 'do not pick a band by hand.',
    );
    this.name = 'MixedOriginBandError';
  }
}

export class PathwayRewriteError extends Error {
  constructor(detail) {
    super(
      `Could not rewrite the band fields of qif-neural-pathways.json in place: ${detail}. `
      + 'Each pathway needs "id", "origin_band" and "target_bands" on single lines.',
    );
    this.name = 'PathwayRewriteError';
  }
}

function listDistinctBands(regionIds, resolveRegion, pathwayId) {
  const bands = regionIds.map((regionId) => resolveRegion(regionId, `pathway "${pathwayId}"`).region.qif_band);
  return [...new Set(bands)];
}

/** The band fields one pathway should hold, given the atlas region table. */
export function derivePathwayBands(pathway, resolveRegion) {
  const originBands = listDistinctBands(pathway.origin ?? [], resolveRegion, pathway.id);
  if (originBands.length !== 1) throw new MixedOriginBandError(pathway.id, originBands);
  return {
    origin_band: originBands[0],
    target_bands: listDistinctBands(pathway.targets ?? [], resolveRegion, pathway.id),
  };
}

function isSameBandList(left, right) {
  return left.length === right.length && left.every((band, index) => band === right[index]);
}

/** Every stored band field that differs from the value derived from the atlas. */
export function findPathwayBandDrift(pathways, atlas) {
  const resolveRegion = createClassifiedRegionResolver(atlas);
  const drift = [];
  for (const pathway of pathways) {
    const derived = derivePathwayBands(pathway, resolveRegion);
    if (pathway.origin_band !== derived.origin_band) {
      drift.push({ pathway_id: pathway.id, field: 'origin_band', stored: pathway.origin_band, derived: derived.origin_band });
    }
    if (!isSameBandList(pathway.target_bands ?? [], derived.target_bands)) {
      drift.push({ pathway_id: pathway.id, field: 'target_bands', stored: pathway.target_bands, derived: derived.target_bands });
    }
  }
  return drift;
}

function formatBandList(bands) {
  return `[${bands.map((band) => JSON.stringify(band)).join(', ')}]`;
}

function rewriteLine(line, derived) {
  if (ORIGIN_BAND_LINE.test(line)) {
    return line.replace(ORIGIN_BAND_LINE, (_match, prefix, suffix) => `${prefix}${JSON.stringify(derived.origin_band)}${suffix}`);
  }
  return line.replace(TARGET_BANDS_LINE, (_match, prefix, suffix) => `${prefix}${formatBandList(derived.target_bands)}${suffix}`);
}

/** Rewrites only the band-field lines of the pathway file text, then proves the result is drift-free. */
export function rewritePathwayBands(pathwaysText, atlas) {
  const resolveRegion = createClassifiedRegionResolver(atlas);
  const derivedById = new Map(
    JSON.parse(pathwaysText).pathways.map((pathway) => [pathway.id, derivePathwayBands(pathway, resolveRegion)]),
  );
  let currentDerived;
  const rewrittenText = pathwaysText.split('\n').map((line) => {
    const pathwayId = line.match(PATHWAY_ID_LINE)?.[1];
    if (pathwayId !== undefined) currentDerived = derivedById.get(pathwayId);
    return currentDerived === undefined ? line : rewriteLine(line, currentDerived);
  }).join('\n');

  const remainingDrift = findPathwayBandDrift(JSON.parse(rewrittenText).pathways, atlas);
  if (remainingDrift.length > 0) {
    throw new PathwayRewriteError(`${remainingDrift.map((entry) => `${entry.pathway_id}.${entry.field}`).join(', ')} still stale`);
  }
  return rewrittenText;
}

function describeDrift(entry) {
  return `  ${entry.pathway_id}.${entry.field}: stored ${JSON.stringify(entry.stored)} -> derived ${JSON.stringify(entry.derived)}\n`;
}

function runCli() {
  const atlas = JSON.parse(readFileSync(ATLAS_PATH, 'utf-8'));
  const pathwaysText = readFileSync(PATHWAYS_PATH, 'utf-8');
  const drift = findPathwayBandDrift(JSON.parse(pathwaysText).pathways, atlas);

  if (drift.length === 0) {
    process.stdout.write('[derive-pathway-bands] pathway band fields match the atlas region table.\n');
    return;
  }
  process.stdout.write(`[derive-pathway-bands] ${drift.length} stale band field(s):\n${drift.map(describeDrift).join('')}`);
  if (process.argv.includes('--check')) {
    process.stderr.write('[derive-pathway-bands] run `npm run derive:pathway-bands` to regenerate.\n');
    process.exit(1);
  }
  writeFileSync(PATHWAYS_PATH, rewritePathwayBands(pathwaysText, atlas));
  process.stdout.write('[derive-pathway-bands] rewrote datalake/qif-neural-pathways.json.\n');
}

runAsCli(import.meta.url, 'derive-pathway-bands', runCli);
