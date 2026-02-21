/**
 * Atlas Data Adapter — build-time pipeline unifying:
 *   - qif-brain-bci-atlas.json (brain regions, bands, physics)
 *   - qif-ethics-controls.json (neurorights, governance)
 *   - qif-dsm-mappings.json (DSM-5-TR diagnostics)
 *   - qif-security-controls.json (security controls per band)
 *   - bci-hardware-inventory.json (device specs)
 *   - threat-data.ts (TARA techniques, NISS scores)
 *
 * All computation runs at build time in Astro frontmatter.
 * React components receive pre-computed, typed props.
 */

import atlas from '@shared/qif-brain-bci-atlas.json';
import ethicsData from '@shared/qif-ethics-controls.json';
import dsmData from '@shared/qif-dsm-mappings.json';
import securityData from '@shared/qif-security-controls.json';
import hardwareInventory from '../../docs/bci-hardware-inventory.json';
import { HOURGLASS_BANDS, HOURGLASS_WIDTHS } from './qif-constants';
import { THREAT_VECTORS, type ThreatVector, type BandId } from './threat-data';

// ═══ Types ═══

export interface AtlasBand {
  id: string;
  name: string;
  zone: 'neural' | 'interface' | 'silicon';
  color: string;
  width: number; // percentage width for hourglass rendering
  determinacy: string;
  qiRange: [number, number];
  severity: string;
  description: string;
  // Aggregated data
  threatCount: number;
  topThreats: { id: string; name: string; severity: string; niss: number }[];
  brainRegions: AtlasBrainRegion[];
  neurorights: string[];
  dsmConditions: string[];
  securityControls: { detection: string[]; prevention: string[]; response: string[] };
}

export interface AtlasBrainRegion {
  id: string;
  name: string;
  abbreviation: string;
  band: string;
  function: string;
  latencyMs: number | null;
  oscillationBands: string[];
  connections: string[];
}

export interface AtlasDevice {
  id: string;
  name: string;
  manufacturer: string;
  channels: number | null;
  samplingHz: number | null;
  wireless: string;
  deviceClass: string;
  bands: string[];
  power?: string | null;
  dimensions?: string | null;
  fdaStatus?: string | null;
  directionality?: string | null;
}

export interface AtlasNeuroright {
  id: string;
  name: string;
  shortDef: string;
  source: string;
  color: string;
  bands: string[];
  frameworks: string[];
  threatCount: number;
}

export interface AtlasDsmCluster {
  id: string;
  label: string;
  color: string;
  bands: string[];
  description: string;
  conditions: { code: string; name: string; bands: string[] }[];
}

export interface AtlasData {
  bands: AtlasBand[];
  devices: AtlasDevice[];
  neurorights: AtlasNeuroright[];
  dsmClusters: AtlasDsmCluster[];
}

// ═══ Helpers ═══

function getThreatsForBand(bandId: string): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.bands.includes(bandId as BandId));
}

function getRegionsForBand(bandId: string): AtlasBrainRegion[] {
  const regions = (atlas as any).brain_regions ?? [];
  return regions
    .filter((r: any) => r.qif_band === bandId)
    .map((r: any) => ({
      id: r.id,
      name: r.name,
      abbreviation: r.abbreviation ?? r.id.toUpperCase(),
      band: r.qif_band,
      function: r.function ?? '',
      latencyMs: r.response_latency_ms?.value ?? null,
      oscillationBands: r.oscillation_bands ?? [],
      connections: r.connections ?? [],
    }));
}

// ═══ Main builder ═══

export function getAtlasData(): AtlasData {
  const ethics = ethicsData as any;
  const dsm = dsmData as any;
  const security = securityData as any;

  // Build bands
  const bands: AtlasBand[] = HOURGLASS_BANDS.map((band, i) => {
    const atlasBand = (atlas as any).qif_bands?.find((b: any) => b.id === band.id);
    const threats = getThreatsForBand(band.id);
    const topThreats = [...threats]
      .sort((a, b) => b.niss.score - a.niss.score)
      .slice(0, 5)
      .map(t => ({ id: t.id, name: t.name, severity: t.severity, niss: t.niss.score }));

    // Neurorights protecting this band
    const neurorights = Object.entries(ethics.neurorights ?? {})
      .filter(([_, nr]: [string, any]) => nr.bands?.includes(band.id))
      .map(([id]) => id);

    // DSM conditions for this band
    const dsmConditions: string[] = (dsm.band_conditions?.[band.id] ?? []);

    // Security controls
    const controls = security.controls_by_band?.[band.id] ?? { detection: [], prevention: [], response: [] };

    return {
      id: band.id,
      name: band.name,
      zone: band.zone as 'neural' | 'interface' | 'silicon',
      color: band.color,
      width: HOURGLASS_WIDTHS[i],
      determinacy: atlasBand?.determinacy ?? '',
      qiRange: atlasBand?.qi_range ?? [0, 0],
      severity: atlasBand?.severity_if_compromised ?? '',
      description: band.description,
      threatCount: threats.length,
      topThreats,
      brainRegions: getRegionsForBand(band.id),
      neurorights,
      dsmConditions,
      securityControls: controls,
    };
  });

  // Build devices from hardware inventory JSON + atlas device_region_mappings
  const hwInventory: any[] = hardwareInventory?.devices ?? [];
  const deviceMappings: any[] = (atlas as any).device_region_mappings ?? [];

  const devices: AtlasDevice[] = hwInventory.map((d: any) => {
    // Find band mappings for this device
    const mapping = deviceMappings.find((m: any) => m.device_id === d.id);
    const bands = mapping?.qif_bands ?? [];

    return {
      id: d.id ?? '',
      name: d.device_name ?? '',
      manufacturer: d.manufacturer ?? '',
      channels: d.core_specs?.channel_count?.value ?? null,
      samplingHz: typeof d.core_specs?.sampling_rate?.value === 'number' ? d.core_specs.sampling_rate.value : null,
      wireless: d.core_specs?.wireless_protocol?.value ?? d.core_specs?.data_interface?.value ?? null,
      deviceClass: d.device_type ?? '',
      bands,
      power: d.core_specs?.power_consumption_total?.value != null ? `${d.core_specs.power_consumption_total.value} ${d.core_specs.power_consumption_total.unit ?? 'mW'}` : null,
      dimensions: d.core_specs?.device_dimensions?.value ?? null,
      fdaStatus: d.fda_status ?? null,
      directionality: d.core_specs?.directionality ?? null,
    };
  });

  // Build neurorights
  const neurorightEntries = Object.entries(ethics.neurorights ?? {});
  const neurorights: AtlasNeuroright[] = neurorightEntries.map(([id, nr]: [string, any]) => {
    const threatCount = THREAT_VECTORS.filter(t => {
      const affected = (t as any).neurorights?.affected ?? [];
      return affected.includes(id);
    }).length;

    return {
      id,
      name: nr.name,
      shortDef: nr.shortDef,
      source: nr.source,
      color: nr.color,
      bands: nr.bands,
      frameworks: nr.frameworks ?? [],
      threatCount,
    };
  });

  // Build DSM clusters
  const dsmClusters: AtlasDsmCluster[] = Object.entries(dsm.diagnostic_clusters ?? {}).map(
    ([id, cluster]: [string, any]) => ({
      id,
      label: cluster.label,
      color: cluster.color,
      bands: cluster.bands,
      description: cluster.description,
      conditions: cluster.conditions ?? [],
    })
  );

  return { bands, devices, neurorights, dsmClusters };
}

/** Get a single band by ID */
export function getAtlasBand(bandId: string): AtlasBand | undefined {
  return getAtlasData().bands.find(b => b.id === bandId);
}

/** Get devices targeting a specific band */
export function getDevicesForBand(bandId: string): AtlasDevice[] {
  return getAtlasData().devices.filter(d => d.bands.includes(bandId));
}

/** Get threats for a band with full detail */
export function getThreatsForBandDetail(bandId: string) {
  const threats = getThreatsForBand(bandId);
  const categories: Record<string, number> = {};
  for (const t of threats) {
    categories[t.category] = (categories[t.category] ?? 0) + 1;
  }
  return {
    total: threats.length,
    categories,
    bySeverity: {
      critical: threats.filter(t => t.severity === 'critical').length,
      high: threats.filter(t => t.severity === 'high').length,
      medium: threats.filter(t => t.severity === 'medium').length,
      low: threats.filter(t => t.severity === 'low').length,
    },
    avgNiss: threats.length > 0
      ? Math.round(threats.reduce((sum, t) => sum + t.niss.score, 0) / threats.length * 100) / 100
      : 0,
  };
}
