/**
 * BCI Hardware Explorer Data Adapter — build-time pipeline merging:
 *   - bci-hardware-inventory.json (24 devices with full specs)
 *   - qif-brain-bci-atlas.json (device_region_mappings, brain regions, QIF bands)
 *   - threat-data.ts (TARA techniques per band, NISS scores)
 *
 * Exports getBciDevices() for the BCI Explorer page.
 * All computation runs at build time in Astro frontmatter.
 */

import hardwareInventory from '../../docs/bci-hardware-inventory.json';
import atlas from '@shared/qif-brain-bci-atlas.json';
import { THREAT_VECTORS, type ThreatVector, type BandId, SEVERITY_COLORS } from './threat-data';
import { HOURGLASS_BANDS } from './qif-constants';

// ═══ Types ═══

export interface SpecField {
  value: string | number | null;
  unit?: string | null;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  source?: string | null;
  notes?: string | null;
}

export interface BciDeviceRegion {
  id: string;
  name: string;
  abbreviation: string;
  band: string;
  function: string;
}

export interface BciDeviceThreat {
  id: string;
  name: string;
  severity: string;
  niss: number;
  category: string;
  status: string;
}

export interface BciDevice {
  // Identity
  id: string;
  name: string;
  manufacturer: string;
  deviceType: string;
  deviceTypeLabel: string;
  category: 'invasive' | 'noninvasive' | 'research';
  fdaStatus: string | null;
  targetIndication: string | null;

  // Core specs
  channels: SpecField;
  samplingRate: SpecField;
  power: SpecField;
  dimensions: SpecField;
  wireless: SpecField;
  directionality: string | null;
  batteryLife: SpecField;

  // Electrode specs
  electrodeMaterial: SpecField;
  electrodeImpedance: SpecField;
  adcResolution: SpecField;
  snr: SpecField;

  // Physics
  thermalBudget: SpecField;
  frequencyRange: SpecField;
  dataRate: SpecField;

  // Brain targeting (from atlas mappings)
  targetRegions: BciDeviceRegion[];
  qifBands: string[];
  i0Depth: string | null;
  interfaceType: string | null;

  // Security (cross-referenced from threats)
  threatCount: number;
  topThreats: BciDeviceThreat[];
  threatsBySeverity: Record<string, number>;
}

// ═══ Helpers ═══

/** Sub-category for devices whose raw type is the broad "invasive_implantable" */
const DEVICE_SUBCATEGORY: Record<string, string> = {
  // Cortical BCI
  'neuralink-n1': 'Cortical BCI',
  'neuralink-n2': 'Cortical BCI',
  'blackrock-utah-array': 'Cortical BCI',
  'braingate': 'Cortical BCI',
  'paradromics-connexus': 'Cortical BCI',
  // Deep Brain Stimulation
  'medtronic-percept-pc': 'DBS',
  'medtronic-percept-rc': 'DBS',
  'boston-scientific-vercise': 'DBS',
  'abbott-infinity-dbs': 'DBS',
  // Neuromodulation (responsive)
  'neuropace-rns': 'Neuromodulation',
  // Cochlear Implant
  'cochlear-nucleus-profile-plus': 'Cochlear Implant',
  'medel-cochlear': 'Cochlear Implant',
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  // Sub-categories (resolved from DEVICE_SUBCATEGORY)
  'Cortical BCI': 'Cortical BCI',
  'DBS': 'Deep Brain Stimulation',
  'Neuromodulation': 'Neuromodulation',
  'Cochlear Implant': 'Cochlear Implant',
  // Raw types that are already specific enough
  invasive_implantable_temporary: 'Invasive (Temporary)',
  invasive_endovascular: 'Endovascular',
  invasive_minimally_invasive: 'Minimally Invasive',
  non_invasive_eeg: 'EEG (Consumer)',
  non_invasive_eeg_board: 'EEG (Research Board)',
  non_invasive_fnirs: 'fNIRS',
  non_invasive_or_minutely_invasive: 'Non/Minimally Invasive',
};

/** Resolve the effective device type, applying sub-category where available */
function resolveDeviceType(id: string, rawType: string): string {
  const sub = DEVICE_SUBCATEGORY[id];
  if (sub) return sub;
  return rawType;
}

function makeSpecField(raw: any): SpecField {
  if (!raw || typeof raw !== 'object') {
    return { value: null };
  }
  return {
    value: raw.value ?? null,
    unit: raw.unit ?? null,
    confidence: raw.confidence ?? null,
    source: raw.source ?? null,
    notes: raw.notes ?? null,
  };
}

function getThreatsForBands(bands: string[]): ThreatVector[] {
  return THREAT_VECTORS.filter(t =>
    t.bands.some(b => bands.includes(b))
  );
}

// ═══ Main builder ═══

export function getBciDevices(): BciDevice[] {
  const hwDevices: any[] = hardwareInventory?.devices ?? [];
  const deviceMappings: any[] = (atlas as any).device_region_mappings ?? [];
  const brainRegions: any[] = (atlas as any).brain_regions ?? [];

  return hwDevices.map((d: any) => {
    const mapping = deviceMappings.find((m: any) => m.device_id === d.id);
    const qifBands = mapping?.qif_bands ?? [];

    // Resolve target regions
    const regionIds: string[] = mapping?.target_regions ?? [];
    const targetRegions: BciDeviceRegion[] = regionIds
      .map((rid: string) => {
        const region = brainRegions.find((r: any) => r.id === rid);
        if (!region) return null;
        return {
          id: region.id,
          name: region.name,
          abbreviation: region.abbreviation ?? region.id.toUpperCase(),
          band: region.qif_band,
          function: region.function ?? '',
        };
      })
      .filter(Boolean) as BciDeviceRegion[];

    // Get threats for this device's bands
    const threats = getThreatsForBands(qifBands);
    const topThreats = [...threats]
      .sort((a, b) => b.niss.score - a.niss.score)
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.name,
        severity: t.severity,
        niss: t.niss.score,
        category: t.category,
        status: t.status,
      }));

    const threatsBySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of threats) {
      threatsBySeverity[t.severity] = (threatsBySeverity[t.severity] ?? 0) + 1;
    }

    const specs = d.core_specs ?? {};
    const physics = d.physics_constraints ?? {};

    const effectiveType = resolveDeviceType(d.id, d.device_type ?? 'unknown');
    const rawType = d.device_type ?? 'unknown';
    const category: 'invasive' | 'noninvasive' | 'research' =
      rawType.startsWith('invasive') || effectiveType === 'Cortical BCI' || effectiveType === 'DBS' || effectiveType === 'Neuromodulation' || effectiveType === 'Cochlear Implant'
        ? 'invasive'
        : rawType === 'non_invasive_eeg_board' ? 'research'
        : 'noninvasive';

    return {
      id: d.id,
      name: d.device_name ?? d.id,
      manufacturer: d.manufacturer ?? '',
      deviceType: effectiveType,
      deviceTypeLabel: DEVICE_TYPE_LABELS[effectiveType] ?? effectiveType,
      category,
      fdaStatus: d.fda_status ?? null,
      targetIndication: d.target_indication ?? null,

      channels: makeSpecField(specs.channel_count),
      samplingRate: makeSpecField(specs.sampling_rate ?? physics.sampling_rate),
      power: makeSpecField(specs.power_consumption_total),
      dimensions: makeSpecField(specs.implant_dimensions ?? specs.device_dimensions),
      wireless: makeSpecField(specs.wireless_protocol ?? physics.wireless_protocol ?? specs.data_interface),
      directionality: specs.directionality ?? mapping?.interface_type ?? null,
      batteryLife: makeSpecField(specs.battery_life),

      electrodeMaterial: makeSpecField(physics.electrode_material ?? specs.electrode_material),
      electrodeImpedance: makeSpecField(physics.electrode_impedance ?? specs.electrode_impedance),
      adcResolution: makeSpecField(specs.adc_resolution ?? physics.adc_resolution),
      snr: makeSpecField(specs.signal_to_noise_ratio ?? physics.signal_to_noise_ratio),

      thermalBudget: makeSpecField(physics.thermal_dissipation),
      frequencyRange: makeSpecField(physics.operating_frequency_neural),
      dataRate: makeSpecField(physics.data_rate),

      targetRegions,
      qifBands,
      i0Depth: mapping?.i0_depth ?? null,
      interfaceType: mapping?.interface_type ?? null,

      threatCount: threats.length,
      topThreats,
      threatsBySeverity,
    };
  });
}

/** Summary stats for the explorer header */
export function getBciStats() {
  const devices = getBciDevices();
  const manufacturers = new Set(devices.map(d => d.manufacturer));
  const channelValues = devices
    .map(d => typeof d.channels.value === 'number' ? d.channels.value : null)
    .filter((v): v is number => v !== null);

  const types: Record<string, number> = {};
  for (const d of devices) {
    types[d.deviceTypeLabel] = (types[d.deviceTypeLabel] ?? 0) + 1;
  }

  const meta = (hardwareInventory as any)._metadata ?? {};

  return {
    totalDevices: devices.length,
    manufacturers: manufacturers.size,
    channelRange: channelValues.length > 0
      ? { min: Math.min(...channelValues), max: Math.max(...channelValues) }
      : null,
    types,
    compiledDate: meta.created ?? null,
  };
}
