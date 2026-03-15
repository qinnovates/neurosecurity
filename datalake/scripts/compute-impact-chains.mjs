#!/usr/bin/env node
/**
 * Precompute impact chains from source JSON files.
 *
 * Eliminates the O(n⁴) nested-loop computation from kql-tables.ts build time.
 * The output (shared/impact-chains.json) is imported directly as a flat table.
 *
 * Source data:
 *   - qtara-registrar.json    → techniques (with band_ids, severity, niss)
 *   - qif-brain-bci-atlas.json → qif_bands, brain_regions
 *   - qif-neural-pathways.json → pathways (with origin, targets, dsm_conditions)
 *   - qif-dsm-mappings.json   → diagnostic_clusters
 *   - qif-neurological-mappings.json → conditions
 *
 * Usage:
 *   node shared/scripts/compute-impact-chains.mjs
 *   node shared/scripts/compute-impact-chains.mjs --dry-run   # print stats only
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sharedDir = join(__dirname, '..');

function loadJSON(filename) {
  return JSON.parse(readFileSync(join(sharedDir, filename), 'utf-8'));
}

// Load source data
const registrar = loadJSON('qtara-registrar.json');
const atlas = loadJSON('qif-brain-bci-atlas.json');
const pathwaysData = loadJSON('qif-neural-pathways.json');
const dsm = loadJSON('qif-dsm-mappings.json');
const neuro = loadJSON('qif-neurological-mappings.json');

const techniques = registrar.techniques || [];
const bands = atlas.qif_bands || [];
const regions = atlas.brain_regions || [];
const allPathways = pathwaysData.pathways || [];
const dsmClusters = dsm.diagnostic_clusters || {};

// Build band lookup for O(1) access
const bandMap = new Map(bands.map(b => [b.id, b]));

// Build region-by-band lookup for O(1) access
const regionsByBand = new Map();
for (const r of regions) {
  const key = r.qif_band;
  if (!regionsByBand.has(key)) regionsByBand.set(key, []);
  regionsByBand.get(key).push(r);
}

// Build pathway-by-region lookup for O(1) access
const pathwaysByRegion = new Map();
for (const pw of allPathways) {
  const touchedRegions = new Set([...(pw.origin || []), ...(pw.targets || [])]);
  for (const rid of touchedRegions) {
    if (!pathwaysByRegion.has(rid)) pathwaysByRegion.set(rid, []);
    pathwaysByRegion.get(rid).push(pw);
  }
}

// Build DSM condition lookup for O(1) access
const dsmLookup = new Map();
for (const [cId, cluster] of Object.entries(dsmClusters)) {
  for (const cond of cluster.conditions || []) {
    dsmLookup.set(cond.code, { name: cond.name, cluster: cluster.label || cId });
  }
}

// Build neurological condition lookup
const neuroLookup = new Map();
for (const nc of neuro.conditions || []) {
  neuroLookup.set(nc.code, { name: nc.name, cluster: `Neurological/${nc.category}` });
}

// Compute impact chains with optimized lookups
const chains = [];

for (const tech of techniques) {
  for (const bandId of tech.band_ids || []) {
    const band = bandMap.get(bandId);
    const bandRegions = regionsByBand.get(bandId) || [];

    for (const region of bandRegions) {
      const regionPws = pathwaysByRegion.get(region.id) || [];

      for (const pw of regionPws) {
        for (const condCode of pw.dsm_conditions || []) {
          const dsmMatch = dsmLookup.get(condCode);
          const neuroMatch = !dsmMatch ? neuroLookup.get(condCode) : null;

          chains.push({
            technique_id: tech.id,
            technique_name: tech.attack || tech.name,
            severity: tech.severity,
            niss_score: tech.niss?.score || 0,
            band_id: bandId,
            band_name: band?.name || bandId,
            region_id: region.id,
            region_name: region.name,
            pathway_id: pw.id,
            pathway_name: pw.name,
            neurotransmitter: pw.neurotransmitter || '',
            dsm_code: condCode,
            dsm_name: dsmMatch?.name || neuroMatch?.name || condCode,
            dsm_cluster: dsmMatch?.cluster || neuroMatch?.cluster || '',
          });
        }
      }
    }
  }
}

const dryRun = process.argv.includes('--dry-run');

console.log(`Impact chains computed: ${chains.length} rows`);
console.log(`Source: ${techniques.length} techniques × ${bands.length} bands × ${regions.length} regions × ${allPathways.length} pathways`);

if (dryRun) {
  console.log('Dry run — no file written.');
  // Show sample
  if (chains.length > 0) {
    console.log('\nSample (first 3):');
    for (const c of chains.slice(0, 3)) {
      console.log(`  ${c.technique_id} → ${c.band_name} → ${c.region_name} → ${c.pathway_name} → ${c.dsm_code}`);
    }
  }
} else {
  const outPath = join(sharedDir, 'impact-chains.json');
  writeFileSync(outPath, JSON.stringify(chains, null, 2));
  console.log(`Written to: ${outPath}`);
  console.log(`File size: ${(JSON.stringify(chains).length / 1024).toFixed(0)} KB`);
}
