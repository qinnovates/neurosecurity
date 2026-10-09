#!/usr/bin/env node
/**
 * Precompute impact chains from source JSON files.
 *
 * One row per technique -> band -> brain region -> pathway -> condition. The
 * output (datalake/impact-chains.json) is imported as a flat table by
 * src/lib/kql-tables.ts and exported to Parquet, so the nested join never runs
 * at site build time.
 *
 * Source data:
 *   - qtara-registrar.json           -> techniques (band_ids, severity, niss)
 *   - qif-brain-bci-atlas.json       -> qif_bands, brain_regions, region_aliases
 *   - qif-neural-pathways.json       -> pathways (origin, targets, dsm_conditions)
 *   - qif-dsm-mappings.json          -> diagnostic_clusters
 *   - qif-neurological-mappings.json -> conditions
 *
 * Pathways name regions by long ids and the atlas by short ones; the join goes
 * through region-resolver.mjs. Each row's `region_match` says how the pathway
 * reached the region: `id` (same id), `synonym` (alias for the same structure),
 * `part_to_whole` or `whole_to_part` (alias that changes anatomical scope; see
 * region_alias_relations in the atlas).
 *
 * Usage:
 *   npm run compute:chains                 # write datalake/impact-chains.json
 *   npm run compute:chains -- --dry-run    # print stats only
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REGION_MATCH,
  REGION_MATCH_PRECEDENCE,
  createRegionResolver,
  listPathwayEndpoints,
} from './region-resolver.mjs';

const DATALAKE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const IMPACT_CHAINS_PATH = path.join(DATALAKE_DIR, 'impact-chains.json');

const SOURCE_FILES = Object.freeze({
  registrar: 'qtara-registrar.json',
  atlas: 'qif-brain-bci-atlas.json',
  pathways: 'qif-neural-pathways.json',
  dsm: 'qif-dsm-mappings.json',
  neuro: 'qif-neurological-mappings.json',
});

const OUTPUT_INDENT = 2;
const BYTES_PER_KILOBYTE = 1024;
const DRY_RUN_SAMPLE_SIZE = 3;
const INEXACT_MATCHES = Object.freeze([REGION_MATCH.PART_TO_WHOLE, REGION_MATCH.WHOLE_TO_PART]);

export function loadChainSources() {
  return Object.fromEntries(
    Object.entries(SOURCE_FILES).map(([key, filename]) => [
      key,
      JSON.parse(readFileSync(path.join(DATALAKE_DIR, filename), 'utf-8')),
    ]),
  );
}

function groupRegionsByBand(regions) {
  const regionsByBand = new Map();
  for (const region of regions) {
    if (!regionsByBand.has(region.qif_band)) regionsByBand.set(region.qif_band, []);
    regionsByBand.get(region.qif_band).push(region);
  }
  return regionsByBand;
}

function isMoreExact(candidateMatch, currentMatch) {
  return REGION_MATCH_PRECEDENCE.indexOf(candidateMatch) < REGION_MATCH_PRECEDENCE.indexOf(currentMatch);
}

/** The regions one pathway touches, each with the most exact match that reaches it. */
function matchPathwayRegions(pathway, resolver) {
  const matchByRegionId = new Map();
  for (const endpointId of listPathwayEndpoints(pathway)) {
    const { region, match } = resolver.resolve(endpointId, `pathway "${pathway.id}"`);
    const currentMatch = matchByRegionId.get(region.id);
    if (currentMatch === undefined || isMoreExact(match, currentMatch)) matchByRegionId.set(region.id, match);
  }
  return matchByRegionId;
}

/** Atlas region id -> [{ pathway, match }], in pathway file order. */
export function indexPathwaysByRegion(pathways, atlas) {
  const resolver = createRegionResolver(atlas);
  const pathwaysByRegion = new Map();
  for (const pathway of pathways) {
    for (const [regionId, match] of matchPathwayRegions(pathway, resolver)) {
      if (!pathwaysByRegion.has(regionId)) pathwaysByRegion.set(regionId, []);
      pathwaysByRegion.get(regionId).push({ pathway, match });
    }
  }
  return pathwaysByRegion;
}

function indexConditions(dsm, neuro) {
  const conditionByCode = new Map();
  for (const condition of neuro.conditions ?? []) {
    conditionByCode.set(condition.code, { name: condition.name, cluster: `Neurological/${condition.category}` });
  }
  for (const [clusterId, cluster] of Object.entries(dsm.diagnostic_clusters ?? {})) {
    for (const condition of cluster.conditions ?? []) {
      conditionByCode.set(condition.code, { name: condition.name, cluster: cluster.label || clusterId });
    }
  }
  return conditionByCode;
}

function buildChainRow({ technique, bandId, band, region, pathway, match, conditionCode, condition }) {
  return {
    technique_id: technique.id,
    technique_name: technique.attack || technique.name,
    severity: technique.severity,
    niss_score: technique.niss?.score || 0,
    band_id: bandId,
    band_name: band?.name || bandId,
    region_id: region.id,
    region_name: region.name,
    region_match: match,
    pathway_id: pathway.id,
    pathway_name: pathway.name,
    neurotransmitter: pathway.neurotransmitter || '',
    dsm_code: conditionCode,
    dsm_name: condition?.name || conditionCode,
    dsm_cluster: condition?.cluster || '',
  };
}

/** One technique's band joined to every region in it, pathway through it and condition on that pathway. */
function buildBandRows(technique, bandId, indexes) {
  const band = indexes.bandById.get(bandId);
  const rows = [];
  for (const region of indexes.regionsByBand.get(bandId) ?? []) {
    for (const { pathway, match } of indexes.pathwaysByRegion.get(region.id) ?? []) {
      for (const conditionCode of pathway.dsm_conditions ?? []) {
        const condition = indexes.conditionByCode.get(conditionCode);
        rows.push(buildChainRow({ technique, bandId, band, region, pathway, match, conditionCode, condition }));
      }
    }
  }
  return rows;
}

/**
 * Pure computation: source JSON in, chain rows out.
 * Throws UnresolvedRegionError if a pathway names a region the atlas cannot resolve.
 */
export function computeImpactChains({ registrar, atlas, pathways, dsm, neuro }) {
  const indexes = {
    bandById: new Map((atlas.qif_bands ?? []).map((band) => [band.id, band])),
    regionsByBand: groupRegionsByBand(atlas.brain_regions ?? []),
    pathwaysByRegion: indexPathwaysByRegion(pathways.pathways ?? [], atlas),
    conditionByCode: indexConditions(dsm, neuro),
  };
  return (registrar.techniques ?? []).flatMap((technique) =>
    (technique.band_ids ?? []).flatMap((bandId) => buildBandRows(technique, bandId, indexes)),
  );
}

export function serializeImpactChains(chains) {
  return JSON.stringify(chains, null, OUTPUT_INDENT);
}

function countDistinct(chains, field) {
  return new Set(chains.map((chain) => chain[field])).size;
}

function reportChains(chains, sources) {
  const inexactRows = chains.filter((chain) => INEXACT_MATCHES.includes(chain.region_match));
  process.stdout.write(
    `Impact chains computed: ${chains.length} rows, ${countDistinct(chains, 'technique_id')} of `
    + `${sources.registrar.techniques.length} techniques, ${countDistinct(chains, 'region_id')} of `
    + `${sources.atlas.brain_regions.length} regions\n`,
  );
  if (inexactRows.length > 0) {
    process.stdout.write(
      `Warning: ${inexactRows.length} rows join through an alias that changes anatomical scope `
      + `(pathways: ${[...new Set(inexactRows.map((chain) => chain.pathway_id))].join(', ')}). `
      + 'They are labelled in region_match.\n',
    );
  }
}

function runCli() {
  const sources = loadChainSources();
  const chains = computeImpactChains(sources);
  reportChains(chains, sources);

  if (process.argv.includes('--dry-run')) {
    process.stdout.write('Dry run: no file written.\n');
    for (const chain of chains.slice(0, DRY_RUN_SAMPLE_SIZE)) {
      process.stdout.write(
        `  ${chain.technique_id} -> ${chain.band_name} -> ${chain.region_name} -> ${chain.pathway_name} -> ${chain.dsm_code}\n`,
      );
    }
    return;
  }
  const serialized = serializeImpactChains(chains);
  writeFileSync(IMPACT_CHAINS_PATH, serialized);
  process.stdout.write(
    `Written to datalake/impact-chains.json (${(Buffer.byteLength(serialized) / BYTES_PER_KILOBYTE).toFixed(0)} KB)\n`,
  );
}

const isRunDirectly = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isRunDirectly) {
  try {
    runCli();
  } catch (error) {
    process.stderr.write(`[compute-impact-chains] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
