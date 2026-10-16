#!/usr/bin/env node
/**
 * Derive origin_band and target_bands on every pathway from the atlas structure table.
 *
 * The atlas (brain_regions[].qif_band) is the single source of truth for where a structure is.
 * Bands on pathways are computed from it and must never be hand-entered.
 *
 * Usage:
 *   node datalake/scripts/derive-pathway-bands.mjs --check   # exit 1 if any stored band differs
 *   node datalake/scripts/derive-pathway-bands.mjs --write   # rewrite the stored bands in place
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATALAKE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const ATLAS_PATH = join(DATALAKE_DIR, 'qif-brain-bci-atlas.json');
const PATHWAYS_PATH = join(DATALAKE_DIR, 'qif-neural-pathways.json');

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`derive-pathway-bands: cannot read ${path}: ${error.message}. Check the file exists and is valid JSON.`);
  }
}

function buildBandResolver(atlas) {
  const bandByRegion = new Map(atlas.brain_regions.map((region) => [region.id, region.qif_band]));
  const aliases = atlas.region_aliases ?? {};
  return (structureId) => {
    const band = bandByRegion.get(structureId) ?? bandByRegion.get(aliases[structureId]);
    if (!band) throw new Error(`derive-pathway-bands: structure "${structureId}" is not in the atlas or its aliases. Add it to brain_regions first.`);
    return band;
  };
}

function uniqueBands(structureIds, resolveBand) {
  return [...new Set(structureIds.map(resolveBand))];
}

function sameSet(left, right) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function deriveMismatches(pathways, resolveBand) {
  const mismatches = [];
  for (const pathway of pathways) {
    const originBands = uniqueBands(pathway.origin ?? [], resolveBand);
    const targetBands = uniqueBands(pathway.targets ?? [], resolveBand);
    const originMatches = originBands.length === 1 && originBands[0] === pathway.origin_band;
    if (!originMatches || !sameSet(targetBands, pathway.target_bands ?? [])) {
      mismatches.push({ pathway, originBands, targetBands });
    }
  }
  return mismatches;
}

function main() {
  const mode = process.argv[2];
  if (mode !== '--check' && mode !== '--write') {
    console.error('usage: derive-pathway-bands.mjs --check | --write');
    process.exit(2);
  }
  const atlas = readJson(ATLAS_PATH);
  const pathwaysData = readJson(PATHWAYS_PATH);
  const mismatches = deriveMismatches(pathwaysData.pathways, buildBandResolver(atlas));
  for (const { pathway, originBands, targetBands } of mismatches) {
    console.log(`${pathway.id}: origin ${pathway.origin_band} -> ${originBands.join(',')}; targets ${(pathway.target_bands ?? []).join(',')} -> ${targetBands.join(',')}`);
  }
  if (mode === '--check') {
    console.log(`${mismatches.length} pathway(s) with stored bands that differ from the atlas`);
    process.exit(mismatches.length ? 1 : 0);
  }
  const multiOrigin = mismatches.filter(({ originBands }) => originBands.length !== 1);
  if (multiOrigin.length) {
    throw new Error(`derive-pathway-bands: ${multiOrigin.map(({ pathway }) => pathway.id).join(', ')} have origins in more than one band; origin_band holds one value. Split the pathway or its origin.`);
  }
  let text = readFileSync(PATHWAYS_PATH, 'utf8');
  for (const { pathway, originBands, targetBands } of mismatches) {
    const start = text.indexOf(`"id": "${pathway.id}"`);
    const end = text.indexOf('"function"', start);
    const block = text.slice(start, end)
      .replace(/"origin_band":\s*"[^"]*"/, `"origin_band": "${originBands[0]}"`)
      .replace(/"target_bands":\s*\[[^\]]*\]/, `"target_bands": ${JSON.stringify(targetBands).replaceAll(',', ', ')}`);
    text = text.slice(0, start) + block + text.slice(end);
  }
  JSON.parse(text);
  writeFileSync(PATHWAYS_PATH, text);
  console.log(`rewrote bands on ${mismatches.length} pathway(s)`);
}

main();
