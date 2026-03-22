// Autodidactive — Neurowall (Neural Firewall) Data
// Source: tools/neurowall/ARCHITECTURE.md, BLUEPRINT.md

export const NEUROWALL = {
  status: 'Simulation only. No hardware prototype exists. Performance claims are simulation-derived.',
  concept: 'A zero-trust firewall that sits at the I0 interface band between brain and silicon. It validates every signal crossing the boundary in both directions.',
  formFactors: [
    { name: 'Neural-Embedded Eyeglasses', sensors: 'Dry EEG (temporal), EOG (eye tracking), EMG (facial)' },
    { name: 'Subvocal Collar (AlterEgo Style)', sensors: 'High-density jaw/neck EMG arrays for silent speech' }
  ],
  inbound: {
    label: 'Inbound Pipeline (Signals entering the brain)',
    stages: [
      { name: 'Authentication', desc: 'Is this signal from a trusted source? NSP verifies sender identity with post-quantum signatures (ML-DSA).' },
      { name: 'Authorization', desc: 'Is this signal type allowed? Policy engine checks Runemate bytecode rules.' },
      { name: 'Safety Bounds', desc: 'Is the amplitude/frequency within safe limits? Checks against IEC 60601-1 thermal ceiling (1.0C max tissue temp rise).' },
      { name: 'Rate Limiting', desc: 'Is the stimulation frequency within safe range? Prevents DoS-style overstimulation.' },
      { name: 'Pattern Matching', desc: 'Does this signal match known attack signatures? TARA-informed detection rules.' }
    ]
  },
  outbound: {
    label: 'Outbound Pipeline (Neural data leaving the brain)',
    stages: [
      { name: 'Anomaly Detection', desc: 'Is the neural signal pattern within expected bounds? Coherence Metric (Cs) baseline comparison.' },
      { name: 'Privacy Filtering', desc: 'Does the outgoing data contain more information than the recipient needs? Differential privacy (epsilon-bounded noise).' },
      { name: 'Encryption', desc: 'All outbound data encrypted with AES-256-GCM-SIV via NSP before leaving the device.' },
      { name: 'Compression', desc: 'Delta encoding + LZ4 reduces payload 65-90% before encryption.' }
    ]
  },
  constraints: [
    { metric: 'Power Budget', value: '25 mW', why: 'Must run on coin cell or energy harvesting. Cannot heat tissue.' },
    { metric: 'Latency', value: '<1 ms', why: 'Must not interfere with real-time neural signal processing.' },
    { metric: 'Silicon Area', value: '~1 mm²', why: 'Must fit on implant-grade or wearable MCU.' },
    { metric: 'Memory', value: '<64 KB SRAM', why: 'Runemate interpreter footprint. No heap allocation.' }
  ],
  detections: [
    { attack: 'SSVEP Flicker Attack', method: 'Frequency-domain analysis of visual cortex signals. Detects abnormal power at known flicker frequencies (5-20 Hz).', band: 'N7' },
    { attack: 'TMS Injection', method: 'Detects magnetic field-induced artifacts that differ from endogenous neural patterns.', band: 'I0' },
    { attack: 'Seizure Induction', method: 'Monitors for abnormal synchronization patterns (hypersynchrony) that precede seizure onset.', band: 'N7/N6' },
    { attack: 'Signal Replay', method: 'Timestamp and nonce validation. Replayed frames fail freshness check.', band: 'S1' },
    { attack: 'Data Exfiltration', method: 'Outbound bandwidth monitoring. Alerts on anomalous data volume or unexpected recipients.', band: 'S3' }
  ]
};

export const NSP_OVERVIEW = {
  name: 'Neural Sensory Protocol (NSP)',
  status: 'Proposed specification. Not implemented in production hardware.',
  purpose: 'Secure, authenticated transmission of neural telemetry from wearable/implant to receiving endpoint.',
  crypto: [
    { layer: 'Key Exchange', algorithm: 'ECDH-P256 + ML-KEM-768 (FIPS 203)', purpose: 'Hybrid classical + post-quantum session key' },
    { layer: 'Encryption', algorithm: 'AES-256-GCM-SIV', purpose: 'Nonce-misuse-resistant frame encryption' },
    { layer: 'Signatures', algorithm: 'ML-DSA-65 (FIPS 204)', purpose: 'Per-frame-group authentication' },
    { layer: 'Key Rotation', algorithm: 'SPHINCS+-SHA2-192s (FIPS 205)', purpose: 'Stateless hash-based signing for key lifecycle' },
    { layer: 'Key Derivation', algorithm: 'HKDF-SHA-384', purpose: 'Session key and sub-key derivation' }
  ],
  whyPostQuantum: 'Neural data is permanently sensitive — you cannot reset your brain signals like a password. Classical key exchange (ECDH/RSA) will be broken by quantum computers. NSP protects against harvest-now-decrypt-later attacks.',
  compression: 'Delta encoding + LZ4. Compress before encrypt (encrypted data cannot be compressed). 65-90% payload reduction.',
  merkle: 'ML-DSA signatures (3.3 KB each) are too large per frame. Merkle tree amortization: group 100 frames, sign only the root. Per-frame overhead drops from 3,309 bytes to ~144 bytes.'
};

export const RUNEMATE_OVERVIEW = {
  name: 'Runemate (The Scribe)',
  status: 'Proposed. Rust no_std implementation exists but not hardware-validated.',
  purpose: 'On-chip bytecode execution engine for firewall policy logic. Keeps security decisions local — the device is not dependent on a phone or cloud.',
  footprint: '<200 KB Flash, <64 KB SRAM',
  language: 'Staves v2 bytecode (compiled from QIF policy DSL)',
  safety: 'Every policy Stave is TARA-validated at compile time. If it does not compile safely, it does not run on-chip.',
  update: 'Zero-downtime policy updates. New rules compiled, signed, transmitted via NSP, verified, then atomically swapped. Old policy stays active until new one is verified.'
};
