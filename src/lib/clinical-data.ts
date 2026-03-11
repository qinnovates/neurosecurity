/**
 * Clinical Data Compiler — builds cross-referenced clinical view data
 * from all shared JSON sources at build time.
 *
 * Sources:
 *   - qif-neural-pathways.json (38+ pathways)
 *   - qif-neurotransmitters.json (17+ neurotransmitters + cofactors)
 *   - qif-brain-bci-atlas.json (37+ brain regions)
 *   - qif-dsm-mappings.json (DSM-5-TR clusters)
 *   - qtara-registrar.json (threat techniques via threat-data.ts)
 *
 * All computation runs at build time. React components receive typed props.
 * Any JSON update automatically propagates to all dashboards.
 */

import pathwayData from '@shared/qif-neural-pathways.json';
import neurotransmitterData from '@shared/qif-neurotransmitters.json';
import atlas from '@shared/qif-brain-bci-atlas.json';
import dsmData from '@shared/qif-dsm-mappings.json';
import { THREAT_VECTORS, type ThreatVector, type BandId } from './threat-data';
import { HOURGLASS_BANDS } from './qif-constants';

// ═══ Types ═══

export interface ClinicalPathway {
  id: string;
  name: string;
  type: string;
  neurotransmitter: string | null;
  originRegions: string[];
  originBand: string;
  targetRegions: string[];
  targetBands: string[];
  function: string;
  bciRelevance: string;
  dsmCodes: string[];
  dsmNames: string[];
  disruptionEffects: string;
  therapeuticApplications: string[];
  confidence: string;
}

export interface ClinicalNeurotransmitter {
  id: string;
  name: string;
  abbreviation: string;
  chemicalClass: string;
  primaryBands: string[];
  primaryRegions: string[];
  receptorCount: number;
  receptorIds: string[];
  cofactors: { name: string; role: string; deficiencyEffect: string }[];
  dsmConditions: { code: string; name: string; mechanism: string }[];
  bciRelevance: string;
  synthesisSteps: number;
  keyEnzymes: string[];
  confidence: string;
}

export interface ClinicalRegion {
  id: string;
  name: string;
  abbreviation: string;
  band: string;
  function: string;
  pathwayCount: number;
  pathwayIds: string[];
  neurotransmitters: string[];
  dsmCodes: string[];
  threatCount: number;
  connections: string[];
}

export interface ClinicalDsmCondition {
  code: string;
  name: string;
  cluster: string;
  clusterColor: string;
  bands: string[];
  pathways: string[];
  neurotransmitters: string[];
  regions: string[];
  threatCount: number;
}

export interface NeuralImpactChain {
  /** Technique → Band → Pathway → Region → DSM */
  technique: { id: string; name: string; severity: string; niss: number };
  band: { id: string; name: string };
  pathways: { id: string; name: string; type: string }[];
  regions: { id: string; name: string }[];
  dsmConditions: { code: string; name: string; cluster: string }[];
}

export interface ClinicalStats {
  totalPathways: number;
  totalNeurotransmitters: number;
  totalRegions: number;
  totalDsmConditions: number;
  totalCofactors: number;
  totalReceptors: number;
  chainLinks: number; // total unique technique→DSM connections
}

export interface ClinicalData {
  pathways: ClinicalPathway[];
  neurotransmitters: ClinicalNeurotransmitter[];
  regions: ClinicalRegion[];
  dsmConditions: ClinicalDsmCondition[];
  impactChains: NeuralImpactChain[];
  stats: ClinicalStats;
  /** Band-level aggregation for the hourglass spine */
  bandClinicalData: Record<string, {
    pathways: string[];
    neurotransmitters: string[];
    regions: string[];
    dsmCodes: string[];
    threatCount: number;
  }>;
}

// ═══ Helpers ═══

function getPathways(): ClinicalPathway[] {
  const raw = (pathwayData as any).pathways ?? [];
  return raw.map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    neurotransmitter: p.neurotransmitter ?? null,
    originRegions: p.origin ?? [],
    originBand: p.origin_band ?? '',
    targetRegions: p.targets ?? [],
    targetBands: p.target_bands ?? [],
    function: p.function ?? '',
    bciRelevance: p.bci_relevance ?? '',
    dsmCodes: p.dsm_conditions ?? [],
    dsmNames: p.dsm_names ?? [],
    disruptionEffects: p.disruption_effects ?? '',
    therapeuticApplications: p.therapeutic_applications ?? [],
    confidence: p.confidence ?? 'MEDIUM',
  }));
}

function getNeurotransmitters(): ClinicalNeurotransmitter[] {
  const raw = (neurotransmitterData as any).neurotransmitters ?? [];
  return raw.map((nt: any) => ({
    id: nt.id,
    name: nt.name,
    abbreviation: nt.abbreviation ?? nt.id,
    chemicalClass: nt.chemical_class ?? '',
    primaryBands: nt.primary_qif_bands ?? [],
    primaryRegions: Array.isArray(nt.primary_regions) ? nt.primary_regions : [],
    receptorCount: Array.isArray(nt.receptors) ? nt.receptors.length : 0,
    receptorIds: Array.isArray(nt.receptors) ? nt.receptors.map((r: any) => r.id) : [],
    cofactors: (nt.cofactor_dependencies ?? []).map((c: any) => ({
      name: c.cofactor,
      role: c.role,
      deficiencyEffect: c.deficiency_effect ?? '',
    })),
    dsmConditions: (nt.dsm_conditions ?? []).map((d: any) => ({
      code: d.code,
      name: d.name,
      mechanism: d.mechanism ?? '',
    })),
    bciRelevance: nt.bci_relevance ?? '',
    synthesisSteps: (nt.synthesis_pathway ?? []).length,
    keyEnzymes: (nt.synthesis_pathway ?? []).map((s: any) => s.enzyme_gene).filter(Boolean),
    confidence: nt.confidence ?? 'MEDIUM',
  }));
}

function getRegions(): ClinicalRegion[] {
  const rawRegions = (atlas as any).brain_regions ?? [];
  const pathways = getPathways();
  const nts = getNeurotransmitters();

  return rawRegions.map((r: any) => {
    // Find pathways involving this region
    const regionPathways = pathways.filter(
      (p) => p.originRegions.includes(r.id) || p.targetRegions.includes(r.id)
    );

    // Find neurotransmitters active in this region
    const regionNTs = nts
      .filter((nt) => {
        const regions = nt.primaryRegions;
        return regions.some((pr: string) =>
          pr === r.id || pr.includes(r.id) || r.id.includes(pr)
        );
      })
      .map((nt) => nt.id);

    // DSM codes from pathways
    const dsmCodes = [...new Set(regionPathways.flatMap((p) => p.dsmCodes))];

    // Threat count
    const band = r.qif_band;
    const threats = THREAT_VECTORS.filter((t) => t.bands.includes(band as BandId));

    return {
      id: r.id,
      name: r.name,
      abbreviation: r.abbreviation ?? r.id.toUpperCase(),
      band: r.qif_band,
      function: r.function ?? '',
      pathwayCount: regionPathways.length,
      pathwayIds: regionPathways.map((p) => p.id),
      neurotransmitters: regionNTs,
      dsmCodes,
      threatCount: threats.length,
      connections: r.connections ?? [],
    };
  });
}

function getDsmConditions(): ClinicalDsmCondition[] {
  const dsm = dsmData as any;
  const pathways = getPathways();
  const nts = getNeurotransmitters();
  const conditions: ClinicalDsmCondition[] = [];

  for (const [clusterId, cluster] of Object.entries(dsm.diagnostic_clusters ?? {})) {
    const c = cluster as any;
    for (const cond of c.conditions ?? []) {
      // Find pathways mentioning this DSM code
      const relPathways = pathways
        .filter((p) => p.dsmCodes.includes(cond.code))
        .map((p) => p.id);

      // Find neurotransmitters linked to this condition
      const relNTs = nts
        .filter((nt) => nt.dsmConditions.some((d) => d.code === cond.code))
        .map((nt) => nt.id);

      // Find regions from band mappings
      const regions = (atlas as any).brain_regions
        ?.filter((r: any) => cond.bands?.includes(r.qif_band))
        .map((r: any) => r.id) ?? [];

      // Count threats targeting these bands
      const threatCount = THREAT_VECTORS.filter((t) =>
        (cond.bands ?? []).some((b: string) => t.bands.includes(b as BandId))
      ).length;

      conditions.push({
        code: cond.code,
        name: cond.name,
        cluster: clusterId,
        clusterColor: c.color ?? '#94a3b8',
        bands: cond.bands ?? [],
        pathways: relPathways,
        neurotransmitters: relNTs,
        regions,
        threatCount,
      });
    }
  }

  return conditions;
}

function buildImpactChains(): NeuralImpactChain[] {
  const pathways = getPathways();
  const dsmConditions = getDsmConditions();
  const chains: NeuralImpactChain[] = [];

  // For each threat technique, trace its chain through the neural layers
  for (const threat of THREAT_VECTORS) {
    for (const bandId of threat.bands) {
      // Find pathways that pass through this band
      const bandPathways = pathways.filter(
        (p) => p.originBand === bandId || p.targetBands.includes(bandId)
      );
      if (bandPathways.length === 0) continue;

      // Get regions in this band
      const regions = (atlas as any).brain_regions
        ?.filter((r: any) => r.qif_band === bandId)
        .map((r: any) => ({ id: r.id, name: r.name })) ?? [];

      // Get DSM conditions linked to these pathways
      const pathwayDsmCodes = [...new Set(bandPathways.flatMap((p) => p.dsmCodes))];
      const dsmMatches = dsmConditions.filter((d) => pathwayDsmCodes.includes(d.code));

      if (dsmMatches.length === 0) continue;

      const band = HOURGLASS_BANDS.find((b) => b.id === bandId);
      chains.push({
        technique: {
          id: threat.id,
          name: threat.name,
          severity: threat.severity,
          niss: threat.niss.score,
        },
        band: { id: bandId, name: band?.name ?? bandId },
        pathways: bandPathways.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
        })),
        regions: regions.slice(0, 5),
        dsmConditions: dsmMatches.slice(0, 5).map((d) => ({
          code: d.code,
          name: d.name,
          cluster: d.cluster,
        })),
      });
    }
  }

  return chains;
}

// ═══ Main builder ═══

export function getClinicalData(): ClinicalData {
  const pathways = getPathways();
  const neurotransmitters = getNeurotransmitters();
  const regions = getRegions();
  const dsmConditions = getDsmConditions();
  const impactChains = buildImpactChains();

  // Band-level aggregation
  const bandClinicalData: Record<string, {
    pathways: string[];
    neurotransmitters: string[];
    regions: string[];
    dsmCodes: string[];
    threatCount: number;
  }> = {};

  for (const band of HOURGLASS_BANDS) {
    const bandPathways = pathways.filter(
      (p) => p.originBand === band.id || p.targetBands.includes(band.id)
    );
    const bandNTs = neurotransmitters.filter((nt) =>
      nt.primaryBands.includes(band.id)
    );
    const bandRegions = regions.filter((r) => r.band === band.id);
    const bandDsm = [...new Set(bandPathways.flatMap((p) => p.dsmCodes))];
    const bandThreats = THREAT_VECTORS.filter((t) =>
      t.bands.includes(band.id as BandId)
    );

    bandClinicalData[band.id] = {
      pathways: bandPathways.map((p) => p.id),
      neurotransmitters: bandNTs.map((nt) => nt.id),
      regions: bandRegions.map((r) => r.id),
      dsmCodes: bandDsm,
      threatCount: bandThreats.length,
    };
  }

  // Count unique receptors
  const totalReceptors = neurotransmitters.reduce((sum, nt) => sum + nt.receptorCount, 0);
  const totalCofactors = ((neurotransmitterData as any).cofactor_master_list ?? []).length;

  // Count unique technique→DSM links
  const chainLinks = new Set(
    impactChains.flatMap((c) =>
      c.dsmConditions.map((d) => `${c.technique.id}→${d.code}`)
    )
  ).size;

  return {
    pathways,
    neurotransmitters,
    regions,
    dsmConditions,
    impactChains,
    stats: {
      totalPathways: pathways.length,
      totalNeurotransmitters: neurotransmitters.length,
      totalRegions: regions.length,
      totalDsmConditions: dsmConditions.length,
      totalCofactors,
      totalReceptors,
      chainLinks,
    },
    bandClinicalData,
  };
}
