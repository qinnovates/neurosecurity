/**
 * Brain Impact Data — groups TARA techniques by brain region for the QIF brain viewer.
 *
 * Processes impact-chains.json at build time to produce per-region technique lists
 * with severity stats, NISS scores, and links to TARA detail pages.
 *
 * Data source: datalake/impact-chains.json (4,428 chains across 10 brain regions)
 */

import impactChainsRaw from '../../datalake/impact-chains.json';

// ═══ Types ═══

export interface ImpactChain {
  technique_id: string;
  technique_name: string;
  severity: string;
  niss_score: number;
  band_id: string;
  band_name: string;
  region_id: string;
  region_name: string;
  pathway_id: string;
  pathway_name: string;
  neurotransmitter: string;
  dsm_code: string;
  dsm_name: string;
  dsm_cluster: string;
}

export interface RegionTechnique {
  id: string;
  name: string;
  severity: string;
  nissScore: number;
  pathways: string[];
  neurotransmitters: string[];
  dsmOutcomes: { code: string; name: string }[];
  href: string;
}

export interface BrainRegionData {
  regionId: string;
  regionName: string;
  bandId: string;
  bandName: string;
  techniques: RegionTechnique[];
  totalChains: number;
  severityCounts: Record<string, number>;
  maxNiss: number;
  avgNiss: number;
}

// ═══ 3D Hotspot Positions (model-space coordinates on fsaverage5) ═══
//
// Positioned anatomically relative to the fsaverage5 mesh centroid.
// Cortical regions are on the surface; subcortical are interior.

export const REGION_HOTSPOT_POSITIONS: Record<string, [number, number, number]> = {
  // N7 cortical
  broca: [-42, 12, 18],        // left inferior frontal gyrus
  wernicke: [-52, -30, 12],    // left posterior superior temporal / supramarginal

  // N6 cortical (medial surface)
  hippocampus: [-24, -18, -18], // medial temporal, parahippocampal
  cingulate: [-4, 8, 32],       // medial, above corpus callosum

  // N5 subcortical
  striatum: [-14, 8, 6],
  substantia_nigra: [-8, -16, -8],

  // N4 subcortical
  thalamus: [-4, -8, 6],
  hypothalamus: [-2, -2, -8],

  // N2 subcortical
  pons: [-2, -24, -24],
  midbrain: [-2, -14, -10],
};

// ═══ Build-time computation ═══

const impactChains = impactChainsRaw as ImpactChain[];

function buildRegionData(): Map<string, BrainRegionData> {
  const regionMap = new Map<string, BrainRegionData>();

  // Group chains by region
  const chainsByRegion = new Map<string, ImpactChain[]>();
  for (const chain of impactChains) {
    const key = chain.region_id;
    if (!chainsByRegion.has(key)) chainsByRegion.set(key, []);
    chainsByRegion.get(key)!.push(chain);
  }

  for (const [regionId, chains] of chainsByRegion) {
    if (chains.length === 0) continue;

    const firstChain = chains[0];

    // Group chains by technique to build per-technique summaries
    const techMap = new Map<string, {
      id: string;
      name: string;
      severity: string;
      nissScore: number;
      pathways: Set<string>;
      neurotransmitters: Set<string>;
      dsmOutcomes: Map<string, string>;
    }>();

    const severityCounts: Record<string, number> = {};
    let maxNiss = 0;
    let totalNiss = 0;

    for (const chain of chains) {
      if (!techMap.has(chain.technique_id)) {
        techMap.set(chain.technique_id, {
          id: chain.technique_id,
          name: chain.technique_name,
          severity: chain.severity,
          nissScore: chain.niss_score,
          pathways: new Set(),
          neurotransmitters: new Set(),
          dsmOutcomes: new Map(),
        });
      }

      const tech = techMap.get(chain.technique_id)!;
      if (chain.pathway_name) tech.pathways.add(chain.pathway_name);
      if (chain.neurotransmitter) tech.neurotransmitters.add(chain.neurotransmitter);
      if (chain.dsm_code && chain.dsm_name) {
        tech.dsmOutcomes.set(chain.dsm_code, chain.dsm_name);
      }

      severityCounts[chain.severity] = (severityCounts[chain.severity] ?? 0) + 1;
      maxNiss = Math.max(maxNiss, chain.niss_score);
      totalNiss += chain.niss_score;
    }

    // Convert to sorted array (highest NISS first)
    const techniques: RegionTechnique[] = Array.from(techMap.values())
      .map((t) => ({
        id: t.id,
        name: t.name,
        severity: t.severity,
        nissScore: t.nissScore,
        pathways: Array.from(t.pathways),
        neurotransmitters: Array.from(t.neurotransmitters),
        dsmOutcomes: Array.from(t.dsmOutcomes.entries()).map(([code, name]) => ({
          code,
          name,
        })),
        href: `/atlas/tara/${t.id}/`,
      }))
      .sort((a, b) => b.nissScore - a.nissScore);

    regionMap.set(regionId, {
      regionId,
      regionName: firstChain.region_name,
      bandId: firstChain.band_id,
      bandName: firstChain.band_name,
      techniques,
      totalChains: chains.length,
      severityCounts,
      maxNiss,
      avgNiss: totalNiss / chains.length,
    });
  }

  return regionMap;
}

// ═══ Computed data (runs once at build time) ═══

const REGION_DATA = buildRegionData();

// ═══ Public API ═══

/** Get all brain regions with TARA data */
export function getAllRegions(): BrainRegionData[] {
  return Array.from(REGION_DATA.values());
}

/** Get data for a specific brain region */
export function getRegionData(regionId: string): BrainRegionData | null {
  return REGION_DATA.get(regionId) ?? null;
}

/** Get techniques targeting a specific region, sorted by NISS score */
export function getTechniquesForRegion(regionId: string): RegionTechnique[] {
  return REGION_DATA.get(regionId)?.techniques ?? [];
}

/** Get severity color for a region based on max NISS */
export function getRegionSeverityColor(regionId: string): string {
  const data = REGION_DATA.get(regionId);
  if (!data) return '#94a3b8';
  if (data.maxNiss >= 8) return '#ef4444'; // critical
  if (data.maxNiss >= 6) return '#f97316'; // high
  if (data.maxNiss >= 4) return '#eab308'; // medium
  return '#94a3b8';                         // low
}
