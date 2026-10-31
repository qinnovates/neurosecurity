/**
 * QIF Framework Constants — derived from qif_equations.py
 * Single source of truth for all QIF values used on the site.
 */

import registrar from '../../datalake/qtara-registrar.json';
import atlas from '../../datalake/qif-brain-bci-atlas.json';

export const QIF_VERSION = '8.0';
export const LATEST_WHITEPAPER_VERSION = '8.0';
export const LATEST_WHITEPAPER_HREF = '/research/whitepaper/';
export const QIF_ARCHITECTURE = 'Hourglass';
export const QIF_BANDS = 11;
export const QIF_ESTABLISHED = 2026;

/** TARA technique count — derived dynamically from qtara-registrar.json */
export const TARA_TECHNIQUES = (registrar as { techniques: unknown[] }).techniques.length;

/** Hourglass bands (7-1-3 asymmetric) */
export const HOURGLASS_BANDS = [
  { id: 'N7', name: 'Neocortex', zone: 'neural', color: '#166534', description: 'PFC, M1, V1, Broca, Wernicke, posterior cingulate — executive function, language, movement, perception' },
  { id: 'N6', name: 'Limbic System', zone: 'neural', color: '#3a7d44', description: 'Hippocampus, basolateral amygdala, insula, anterior cingulate — emotion, memory, interoception' },
  { id: 'N5', name: 'Basal Ganglia', zone: 'neural', color: '#5c7a38', description: 'Striatum, pallidum, central amygdala — motor selection, reward, habit' },
  { id: 'N4', name: 'Diencephalon', zone: 'neural', color: '#72772f', description: 'Thalamus, hypothalamus, subthalamic nucleus — sensory gating, state-dependent relay' },
  { id: 'N3', name: 'Cerebellum', zone: 'neural', color: '#877226', description: 'Cerebellar cortex, deep nuclei — motor coordination, timing' },
  { id: 'N2', name: 'Brainstem', zone: 'neural', color: '#9b6c1e', description: 'Medulla, pons, midbrain, substantia nigra, VTA — vital functions, arousal, dopamine sources' },
  { id: 'N1', name: 'Spinal Cord', zone: 'neural', color: '#ae6616', description: 'Cervical through sacral — reflexes, peripheral relay' },
  { id: 'I0', name: 'Neural Interface', zone: 'interface', color: '#f59e0b', description: 'Electrode-tissue boundary — measurement/collapse, quasi-quantum zone' },
  { id: 'S1', name: 'Near-Field / On-Device', zone: 'synthetic', color: '#93c5fd', description: 'Amplification, ADC, near-field EM coupling (0-10 kHz, on-device)' },
  { id: 'S2', name: 'Guided-Wave / Host-Local', zone: 'synthetic', color: '#60a5fa', description: 'Firmware, drivers, host compute, USB, decoding, BLE/WiFi baseband (10 kHz - 1 GHz, device-local)' },
  { id: 'S3', name: 'Far-Field / Wide-Area', zone: 'synthetic', color: '#3b82f6', description: 'RF transmission, directed energy, application layer (1 GHz+, off-device)' },
] as const;

/** Neural bands (N7–N1) as id, name and description. Derived from HOURGLASS_BANDS; do not redeclare elsewhere. */
export const NEURAL_BAND_REGIONS = HOURGLASS_BANDS
  .filter((band) => band.zone === 'neural')
  .map(({ id, name, description }) => ({ id, name, description }));

export type BandId = (typeof HOURGLASS_BANDS)[number]['id'];

/** A public layer: a presentation grouping over band ids. The band id stays the address. */
export interface QifLayer {
  id: string;
  name: string;
  band_ids: BandId[];
  zone: 'neural' | 'silicon' | 'interface';
  public_order: number;
  description: string;
  status: 'proposed';
}

type AtlasLayers = { layers: { entries: QifLayer[]; seam: Omit<QifLayer, 'public_order'> & { between: [string, string] } } };

/** The eight public layers (seven neural, one classical stack), read from the atlas; proposed and unvalidated. */
export const QIF_LAYERS: readonly QifLayer[] = (atlas as unknown as AtlasLayers).layers.entries;

/** The seam between the neural layers and the classical stack (I0). Drawn as an edge, never counted as a layer. */
export const QIF_LAYER_SEAM = (atlas as unknown as AtlasLayers).layers.seam;

/** The layer or seam a band id belongs to. Throws on an unknown id so a bad tag fails the build, not the page. */
export function layerOf(bandId: BandId): QifLayer | typeof QIF_LAYER_SEAM {
  const layer = QIF_LAYERS.find((entry) => entry.band_ids.includes(bandId));
  if (layer) return layer;
  if (QIF_LAYER_SEAM.band_ids.includes(bandId)) return QIF_LAYER_SEAM;
  throw new Error(`layerOf: band id "${bandId}" is in no layer and not the seam; check datalake/qif-brain-bci-atlas.json layers`);
}

const bandsInZone = (zone: string) => HOURGLASS_BANDS.filter((band) => band.zone === zone).length;

/** Model counts for published copy. Derived, so a changed band or layer cannot leave a stale number on a page. */
export const QIF_MODEL_COUNTS = {
  bands: HOURGLASS_BANDS.length,
  neuralBands: bandsInZone('neural'),
  interfaceBands: bandsInZone('interface'),
  syntheticBands: bandsInZone('synthetic'),
  layers: QIF_LAYERS.length,
} as const;

/** Techniques tagged to each band, counted from the registrar. A technique counts once per band it tags. */
export function countTechniquesByBand(): Record<BandId, number> {
  const techniques = (registrar as unknown as { techniques: { band_ids?: string[] }[] }).techniques;
  const entries = HOURGLASS_BANDS.map((band) => {
    const count = techniques.filter((technique) => technique.band_ids?.includes(band.id)).length;
    return [band.id, count];
  });
  return Object.fromEntries(entries) as Record<BandId, number>;
}

/** Hourglass band radii for 3D visualization (maps 1:1 to HOURGLASS_BANDS) */
export const HOURGLASS_RADII = [1.4, 1.3, 1.15, 1.0, 0.85, 0.7, 0.55, 0.45, 0.7, 0.9, 1.2] as const;

/** Hourglass band widths for 2D visualization (percentage, maps 1:1 to HOURGLASS_BANDS) */
export const HOURGLASS_WIDTHS = [90, 82, 72, 62, 55, 45, 38, 30, 45, 58, 75] as const;

/** Coherence metric thresholds */
export const COHERENCE = {
  formula: 'Cₛ = e^(−(σ²ᵩ + σ²τ + σ²ᵧ))',
  thresholds: {
    safe: { min: 0.6, label: 'Coherent', color: '#10b981' },
    gateway: { min: 0.3, max: 0.6, label: 'Gateway', color: '#f59e0b' },
    breach: { max: 0.3, label: 'Breach', color: '#ef4444' },
  },
} as const;

/** Scale-frequency invariant */
export const SCALE_FREQUENCY = {
  formula: 'v = f × λ',
  k_range: '1-10 m/s',
  bands: [
    { name: 'Gamma', frequency: '30-100 Hz', extent: '~1 cm', k: '~1' },
    { name: 'Theta', frequency: '4-8 Hz', extent: '~5 cm', k: '~3' },
    { name: 'Alpha', frequency: '8-13 Hz', extent: '~15 cm', k: '~8' },
    { name: 'Delta', frequency: '0.5-4 Hz', extent: '~18 cm', k: '~5' },
  ],
} as const;

/** QI candidate equations */
export const QI_CANDIDATES = {
  additive: {
    name: 'Candidate 1 (Additive)',
    formula: 'QI(t) = C_class + (1-ΓD(t))·[Qi + Q_entangle] − Q_tunnel',
  },
  tensor: {
    name: 'Candidate 2 (Tensor)',
    formula: 'QI = C_class ⊗ e^(−S_quantum)',
  },
} as const;

export const QIF_NAME = "Quantified Interconnection Framework";
export const QIF_FULL_NAME = "Quantified Interconnection Framework (QIF)";
export const QIF_DESCRIPTION = "A proposed open framework for brain-computer interface security, mapping the boundary where silicon meets neuron through an 11-band hourglass architecture.";

/** Three pillars of Qinnovate */
export const PILLARS = [
  {
    id: 'qif',
    name: 'QIF Model',
    fullName: 'Quantified Interconnection Framework',
    tagline: 'The governance architecture',
    description: 'The OSI of Mind. An 11-band hourglass model mapping every surface — from neural tissue to synthetic systems — where security threats and ethical risks converge. One auditable framework for both.',
    href: '/research/whitepaper/',
    icon: '\u25C6',
    color: 'var(--color-accent-primary)',
    version: QIF_VERSION,
    status: 'Published',
  },
  {
    id: 'tara',
    name: 'TARA',
    fullName: 'Therapeutic Applications & Risk Assessment',
    tagline: 'The TARA Atlas',
    description: `${TARA_TECHNIQUES} BCI techniques mapped across four projections — modality, clinical, diagnostic (DSM-5-TR), and governance — each scored with NISS and associated with clinical outcomes through the Neural Impact Chain (by shared band, not a demonstrated neural path).`,
    href: '/atlas/tara/',
    icon: '\u25B2',
    color: '#f59e0b',
    version: '1.7',
    status: 'Atlas Published',
  },
  {
    id: 'nsp',
    name: 'NSP',
    fullName: 'Neural Sensory Protocol',
    tagline: 'The wire protocol',
    description: 'An RFC-style post-quantum protocol ensuring patient safety and data privacy — securing BCI data links with five defense layers at 3.25% power overhead.',
    href: '/guardrails/nsp/',
    icon: '\u25A0',
    color: 'var(--color-accent-secondary)',
    version: '0.4',
    status: 'Secure Core Complete',
  },
] as const;

/** Publication stats — publications count is updated at build time via prebuild script */
export const STATS = {
  publications: 18,
  frameworkVersion: `v${QIF_VERSION}`,
  architecture: `${QIF_BANDS}-Band ${QIF_ARCHITECTURE}`,
  established: QIF_ESTABLISHED,
} as const;
