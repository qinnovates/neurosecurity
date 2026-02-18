/**
 * QIF Framework Constants — derived from qif_equations.py
 * Single source of truth for all QIF values used on the site.
 */

export const QIF_VERSION = '6.2.2';
export const LATEST_WHITEPAPER_VERSION = '6.2.2';
export const LATEST_WHITEPAPER_HREF = '/whitepaper/';
export const QIF_ARCHITECTURE = 'Hourglass';
export const QIF_BANDS = 11;
export const QIF_ESTABLISHED = 2026;

/** Hourglass bands (7-1-3 asymmetric) */
export const HOURGLASS_BANDS = [
  { id: 'N7', name: 'Neocortex', zone: 'neural', color: '#166534', description: 'PFC, M1, V1, Broca, Wernicke — executive function, language, movement, perception' },
  { id: 'N6', name: 'Limbic System', zone: 'neural', color: '#3a7d44', description: 'Hippocampus, amygdala, insula — emotion, memory, interoception' },
  { id: 'N5', name: 'Basal Ganglia', zone: 'neural', color: '#5c7a38', description: 'Striatum, STN, substantia nigra — motor selection, reward, habit' },
  { id: 'N4', name: 'Diencephalon', zone: 'neural', color: '#72772f', description: 'Thalamus, hypothalamus — sensory gating, consciousness relay' },
  { id: 'N3', name: 'Cerebellum', zone: 'neural', color: '#877226', description: 'Cerebellar cortex, deep nuclei — motor coordination, timing' },
  { id: 'N2', name: 'Brainstem', zone: 'neural', color: '#9b6c1e', description: 'Medulla, pons, midbrain — vital functions, arousal, reflexes' },
  { id: 'N1', name: 'Spinal Cord', zone: 'neural', color: '#ae6616', description: 'Cervical through sacral — reflexes, peripheral relay' },
  { id: 'I0', name: 'Neural Interface', zone: 'interface', color: '#f59e0b', description: 'Electrode-tissue boundary — measurement/collapse, quasi-quantum zone' },
  { id: 'S1', name: 'Analog / Near-Field', zone: 'synthetic', color: '#93c5fd', description: 'Amplification, ADC, near-field EM (0-10 kHz)' },
  { id: 'S2', name: 'Digital / Telemetry', zone: 'synthetic', color: '#60a5fa', description: 'Decoding, BLE/WiFi, telemetry (10 kHz - 1 GHz)' },
  { id: 'S3', name: 'Radio / Wireless / DE', zone: 'synthetic', color: '#3b82f6', description: 'RF, directed energy, application layer (1 GHz+)' },
] as const;

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
export const QIF_DESCRIPTION = "The first open standard for brain-computer interface security, mapping the boundary where silicon meets neuron through an 11-band hourglass architecture.";

/** Three pillars of Qinnovate */
export const PILLARS = [
  {
    id: 'qif',
    name: 'QIF Model',
    fullName: 'Quantified Interconnection Framework',
    tagline: 'The governance architecture',
    description: 'The OSI of Mind. An 11-band hourglass model mapping every surface — from neural tissue to synthetic systems — where security threats and ethical risks converge. One auditable framework for both.',
    href: '/whitepaper/',
    icon: '&#9670;',
    color: 'var(--color-accent-primary)',
    version: QIF_VERSION,
    status: 'Published',
  },
  {
    id: 'tara',
    name: 'TARA',
    fullName: 'Therapeutic Applications & Risk Assessment',
    tagline: 'The TARA Atlas',
    description: '102 BCI techniques mapped across four projections — modality, clinical, diagnostic (DSM-5-TR), and governance — each scored with NISS and traced through the Neural Impact Chain from attack to clinical outcome.',
    href: '/TARA/',
    icon: '&#9650;',
    color: '#f59e0b',
    version: '1.0',
    status: 'Atlas Published',
  },
  {
    id: 'nsp',
    name: 'NSP',
    fullName: 'Neural Sensory Protocol',
    tagline: 'The wire protocol',
    description: 'An RFC-style post-quantum protocol ensuring patient safety and data privacy — securing BCI data links with five defense layers at 3.25% power overhead.',
    href: '/nsp/',
    icon: '&#9632;',
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
