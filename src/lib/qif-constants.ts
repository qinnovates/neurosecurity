/**
 * QIF Framework Constants — derived from qif_equations.py
 * Single source of truth for all QIF values used on the site.
 */

export const QIF_VERSION = '4.0';
export const QIF_ARCHITECTURE = 'Hourglass';
export const QIF_BANDS = 11;
export const QIF_ESTABLISHED = 2026;

/** Hourglass bands (7-1-3 asymmetric) */
export const HOURGLASS_BANDS = [
  { id: 'N7', name: 'Neocortex', zone: 'neural', color: '#22c55e', description: 'PFC, M1, V1, Broca, Wernicke — executive function, language, movement, perception' },
  { id: 'N6', name: 'Limbic System', zone: 'neural', color: '#4ade80', description: 'Hippocampus, amygdala, insula — emotion, memory, interoception' },
  { id: 'N5', name: 'Basal Ganglia', zone: 'neural', color: '#86efac', description: 'Striatum, STN, substantia nigra — motor selection, reward, habit' },
  { id: 'N4', name: 'Diencephalon', zone: 'neural', color: '#a3e635', description: 'Thalamus, hypothalamus — sensory gating, consciousness relay' },
  { id: 'N3', name: 'Cerebellum', zone: 'neural', color: '#bef264', description: 'Cerebellar cortex, deep nuclei — motor coordination, timing' },
  { id: 'N2', name: 'Brainstem', zone: 'neural', color: '#d9f99d', description: 'Medulla, pons, midbrain — vital functions, arousal, reflexes' },
  { id: 'N1', name: 'Spinal Cord', zone: 'neural', color: '#ecfccb', description: 'Cervical through sacral — reflexes, peripheral relay' },
  { id: 'I0', name: 'Neural Interface', zone: 'interface', color: '#f59e0b', description: 'Electrode-tissue boundary — measurement/collapse, quasi-quantum zone' },
  { id: 'S1', name: 'Analog / Near-Field', zone: 'silicon', color: '#93c5fd', description: 'Amplification, ADC, near-field EM (0-10 kHz)' },
  { id: 'S2', name: 'Digital / Telemetry', zone: 'silicon', color: '#60a5fa', description: 'Decoding, BLE/WiFi, telemetry (10 kHz - 1 GHz)' },
  { id: 'S3', name: 'Radio / Wireless / DE', zone: 'silicon', color: '#3b82f6', description: 'RF, directed energy, application layer (1 GHz+)' },
] as const;

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

/** Three pillars of Qinnovate */
export const PILLARS = [
  {
    id: 'qif',
    name: 'QIF',
    fullName: 'Quantum Indeterministic Framework',
    tagline: 'The security architecture',
    description: 'An 11-band hourglass model that maps every threat surface — from neural tissue to silicon — into a single, auditable framework.',
    href: '/framework/',
    icon: '&#9670;',
    color: 'var(--color-accent-primary)',
    version: QIF_VERSION,
    status: 'Published',
  },
  {
    id: 'nsp',
    name: 'NSP',
    fullName: 'Neural Sensory Protocol',
    tagline: 'The wire protocol',
    description: 'An RFC-style post-quantum protocol that secures BCI data links with five defense layers at 3.25% power overhead.',
    href: '/nsp/',
    icon: '&#9632;',
    color: 'var(--color-accent-secondary)',
    version: '0.3',
    status: 'Draft RFC',
  },
  {
    id: 'runemate',
    name: 'Runemate',
    fullName: 'Project Runemate',
    toolName: 'Runemate Forge',
    tagline: 'The compression engine',
    description: 'An HTML-to-bytecode compiler that compresses content 65-90%, making post-quantum encryption cost-free above 30 KB. Runemate Forge compiles HTML into Staves bytecode.',
    href: '/runemate/',
    icon: '&#8734;',
    color: 'var(--color-accent-tertiary)',
    version: '0.1',
    status: 'PoC Complete',
  },
] as const;

/** Publication stats */
export const STATS = {
  publications: 11,
  frameworkVersion: `v${QIF_VERSION}`,
  architecture: `${QIF_BANDS}-Band ${QIF_ARCHITECTURE}`,
  established: QIF_ESTABLISHED,
} as const;
