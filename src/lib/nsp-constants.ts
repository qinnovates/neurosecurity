/**
 * NSP (Neural Sensory Protocol) Constants — derived from NSP-PROTOCOL-SPEC.md v0.5
 * Single source of truth for all NSP values used on the site.
 */

export const NSP_VERSION = '0.5';
export const NSP_STATUS = 'Protocol Core & Handshake Complete';
export const NSP_FIPS = ['FIPS 203 (ML-KEM)', 'FIPS 204 (ML-DSA)', 'FIPS 205 (SLH-DSA)', 'FIPS 197 (AES-256-GCM-SIV)'] as const;

/** Five independent defense layers */
export const NSP_LAYERS = [
  {
    id: 1,
    name: 'Hardware Root of Trust',
    scope: 'SPHINCS+-signed secure boot, firmware attestation, TRNG',
    qifBand: 'S3 (Physical Layer)',
    tiers: ['T2', 'T3'],
  },
  {
    id: 2,
    name: 'Hybrid Post-Quantum Key Exchange',
    scope: 'ECDH + ML-KEM, ML-DSA signatures, AES-256-GCM-SIV encryption',
    qifBand: 'S1 (Protocol Security)',
    tiers: ['T1', 'T2', 'T3'],
  },
  {
    id: 3,
    name: 'QI Signal Integrity',
    scope: 'Per-frame QI scoring, anomaly detection',
    qifBand: 'N3-N1 (Neural Signal Bands)',
    tiers: ['T1', 'T2', 'T3'],
  },
  {
    id: 4,
    name: 'Adaptive Per-User Detection (TTT)',
    scope: 'Personalized baseline, test-time training',
    qifBand: 'N6 (Neural Semantics)',
    tiers: ['T2', 'T3'],
  },
  {
    id: 5,
    name: 'EM Environment Monitoring',
    scope: 'Spectral scanning, resonance shield interface',
    qifBand: 'I0 (Neural Interface)',
    tiers: ['T3'],
  },
] as const;

/** Device class tiers */
export const NSP_DEVICE_TIERS = [
  {
    id: 'T1',
    name: 'Consumer',
    examples: ['Consumer EEG headbands', 'Hobby-grade BCIs'],
    activeLayers: [2, 3],
    keyExchange: 'Hybrid ECDH-P256 + ML-KEM-768',
    secureEnclave: 'Recommended',
  },
  {
    id: 'T2',
    name: 'Clinical',
    examples: ['Endovascular stent-electrodes', 'Research EEG'],
    activeLayers: [1, 2, 3, 4],
    keyExchange: 'Hybrid ECDH-P256 + ML-KEM-768 (minimum)',
    secureEnclave: 'Required',
  },
  {
    id: 'T3',
    name: 'Implanted',
    examples: ['Cortical implants', 'Deep brain stimulators'],
    activeLayers: [1, 2, 3, 4, 5],
    keyExchange: 'Hybrid ECDH-P384 + ML-KEM-1024',
    secureEnclave: 'Required (dedicated co-processor)',
  },
] as const;

/** Power budget (reference: representative cortical implant, 40 mW) */
export const NSP_POWER = {
  referencePlatform: 'Representative cortical implant',
  nominalPower_mW: 24.7,
  budgetPower_mW: 40,
  totalOverhead_mW: 1.3,
  totalOverheadPercent: 3.25,
  maxAllowedPercent: 5,
  breakdown: [
    { operation: 'Delta + LZ4 compression', power_mW: 0.2, frequency: 'Per sample window', percent: 0.50 },
    { operation: 'QI score computation', power_mW: 0.5, frequency: 'Per time window (~4 ms)', percent: 1.25 },
    { operation: 'AES-256-GCM-SIV (hw accel.)', power_mW: 0.1, frequency: 'Per frame', percent: 0.25 },
    { operation: 'ML-DSA-65 sign (amortized)', power_mW: 0.5, frequency: 'Per frame group', percent: 1.25 },
  ],
} as const;

/** PQC vs classical key/signature sizes */
export const NSP_PQC_SIZES = {
  keyExchange: {
    classical: { algorithm: 'ECDH-P256', publicKey_bytes: 65, sharedSecret_bytes: 32 },
    postQuantum: { algorithm: 'ML-KEM-768', publicKey_bytes: 1184, ciphertext_bytes: 1088, sharedSecret_bytes: 32 },
    multiplier: 18.2,
  },
  signatures: {
    classical: { algorithm: 'ECDSA-P256', publicKey_bytes: 65, signature_bytes: 72 },
    postQuantum: { algorithm: 'ML-DSA-65', publicKey_bytes: 1952, signature_bytes: 3309 },
    multiplier: 46.0,
  },
  hashBased: {
    algorithm: 'SPHINCS+-SHA2-192s (T2/T3) / 128s (T1)',
    publicKey_bytes: 48,
    signature_bytes: 16224,
    usage: 'Firmware signing, key rotation, Merkle group sigs (clinical/implant)',
  },
  symmetric: {
    algorithm: 'AES-256-GCM-SIV',
    key_bits: 256,
    nonce_bytes: 12,
    tag_bytes: 16,
    commitment_bytes: 32,
    quantumNote: 'Grover reduces to 128-bit effective. Sufficient per NIST. Nonce-misuse resistant (RFC 8452). Key-committing via Bellare-Hoang transform.',
  },
} as const;

/** Pipeline order (non-negotiable per spec) */
export const NSP_PIPELINE = ['Compress', 'Compute QI', 'Build Frame', 'Encrypt (GCM-SIV)', 'Sign (Merkle)'] as const;

/** Key lifecycle */
export const NSP_KEY_LIFECYCLE = {
  deviceLifetime_years: 20,
  sessionKeyRotation_seconds: '30-60',
  drkRotation_days_T1_T2: 90,
  drkRotation_days_T3: 30,
  sessionTicket_hours_T1: 24,
  sessionTicket_hours_T2: 8,
  sessionTicket_hours_T3: 1,
} as const;
