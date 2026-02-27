/**
 * Neurowall Constants — derived from tools/neurowall/ documentation
 * Single source of truth for all Neurowall values used on the site.
 */

export const NEUROWALL_VERSION = '0.8';
export const NEUROWALL_STATUS = 'Phase 1 Architecture (Design-Complete)';

/** Three concentric defense layers */
export const NEUROWALL_LAYERS = [
  {
    id: 1,
    name: 'Signal Boundary',
    type: 'Physical / EMV',
    description: 'Prevents hardware-level signal injection and SSVEP-based adversarial attacks. Includes notch filters, impedance guard, and frequency-domain anomaly detection.',
    defenses: ['Notch filters', 'Impedance monitoring', 'SSVEP detection', 'Spectral peak detection'],
    color: 'var(--color-accent-primary)',
  },
  {
    id: 2,
    name: 'Inference Guard',
    type: 'Privacy',
    description: 'Prevents neural fingerprinting and intent exfiltration via on-device Differential Privacy. Laplace noise applied pre-transmission so raw neural signals never leave the device.',
    defenses: ['Local Differential Privacy', 'Laplace noise (epsilon = 0.5)', 'Pre-transmission application'],
    color: 'var(--color-accent-secondary)',
  },
  {
    id: 3,
    name: 'Policy Agent',
    type: 'Enforcement',
    description: 'RunematePolicy engine: a prioritized rule-stack that evaluates NISS scores, anomaly levels, and detector flags to dynamically adjust DP epsilon, suppress stimulation, and escalate alerts.',
    defenses: ['NISS threshold evaluation', 'Dynamic epsilon adjustment', 'Stimulation suppression', 'Alert escalation'],
    color: 'var(--color-accent-tertiary)',
  },
] as const;

/** Target form factors */
export const NEUROWALL_FORM_FACTORS = [
  {
    name: 'Neural-Embedded Eyeglasses',
    description: 'Dry EEG (temporal), EOG (eye tracking), and EMG (facial) sensors integrated into smart glasses.',
  },
  {
    name: 'Subvocal Collars',
    description: 'High-density jaw/neck EMG arrays for silent speech decoding (AlterEgo-style).',
  },
] as const;

/** Detection results from v0.7 simulation (15 scenarios) */
export const NEUROWALL_DETECTION_RESULTS = [
  { id: 0, attack: 'Clean Signal (Control)', detectedBy: '--', result: 'baseline' as const },
  { id: 1, attack: 'SSVEP 15Hz', detectedBy: 'SSVEP', result: 'detected' as const },
  { id: 2, attack: 'SSVEP 13Hz (novel freq)', detectedBy: 'Spectral Peak', result: 'detected' as const },
  { id: 3, attack: 'Impedance Spike', detectedBy: 'L1', result: 'detected' as const },
  { id: 4, attack: 'Slow DC Drift', detectedBy: 'Spectral Peak', result: 'detected' as const },
  { id: 5, attack: 'Neuronal Flooding (T0026)', detectedBy: 'L1 + SSVEP', result: 'detected' as const },
  { id: 6, attack: 'Boiling Frog (T0066)', detectedBy: '--', result: 'evaded' as const },
  { id: 7, attack: 'Envelope Modulation (T0014)', detectedBy: 'Monitor', result: 'detected' as const },
  { id: 8, attack: 'Phase Replay (T0067)', detectedBy: '--', result: 'evaded' as const },
  { id: 9, attack: 'Closed-Loop Cascade (T0023)', detectedBy: 'Monitor', result: 'detected' as const },
  { id: 10, attack: 'Notch-Aware SSVEP 12Hz', detectedBy: 'Spectral Peak', result: 'detected' as const },
  { id: 11, attack: 'Freq-Hopping SSVEP', detectedBy: 'Monitor', result: 'detected' as const },
  { id: 12, attack: 'Threshold-Aware Ramp', detectedBy: '--', result: 'evaded' as const },
  { id: 13, attack: 'CUSUM-Aware Intermittent', detectedBy: 'Monitor', result: 'detected' as const },
  { id: 14, attack: 'Spectral Mimicry', detectedBy: 'Monitor', result: 'detected' as const },
] as const;

/** Key stats */
export const NEUROWALL_STATS = {
  detectedCount: 11,
  totalAttacks: 14,
  detectionRate: '78.6%',
  adversarialDetected: '4/5',
  rocOptimal: {
    threshold: 12,
    duration_s: 20,
    fpr: '5%',
    tpr: '100%',
  },
  brainflow: {
    detectionRate: '100%',
    fpr: '0%',
    channels: 16,
    csSpread: 0.089,
  },
} as const;

/** Policy engine rules (L3) */
export const NEUROWALL_POLICY_RULES = [
  { priority: 1, name: 'critical_niss', condition: 'NISS >= 8 AND anomaly >= 3.0 for 2+ windows', epsilon: 0.05, alert: 'critical' },
  { priority: 2, name: 'high_niss', condition: 'NISS >= 7', epsilon: 0.10, alert: 'warning' },
  { priority: 3, name: 'sustained_anomaly', condition: 'anomaly >= 2.0 for 3+ windows', epsilon: 0.20, alert: 'advisory' },
  { priority: 4, name: 'growth_detected', condition: 'growth detector triggered', epsilon: 0.10, alert: 'warning' },
  { priority: 5, name: 'spectral_peak', condition: 'spectral peak detector triggered', epsilon: 0.20, alert: 'advisory' },
] as const;

/** Technical properties */
export const NEUROWALL_SPECS = {
  transport: 'NSP v0.5 (hybrid ML-KEM-768 + AES-256-GCM-SIV)',
  signatureAmortization: 'Merkle grouping (100 frames), ~144 bytes per-frame overhead',
  compression: 'Delta + LZ4 (4KB SRAM window), 65-90% size reduction',
  chipFootprint: '< 200KB (Runemate Scribe)',
  powerBudget: '< 5% overhead on 40mW wearable thermal budget',
  differentialPrivacy: 'Local-DP, Laplace noise (epsilon = 0.5) applied pre-transmission',
} as const;

/** Duration sweep results */
export const NEUROWALL_DURATION_SWEEP = [
  { duration: '10s', detected: '6/9', evaded: '3/9', notes: 'Cascade, boiling frog, phase replay evade' },
  { duration: '15s', detected: '8/9', evaded: '1/9', notes: 'Only boiling frog evades' },
  { duration: '20s', detected: '9/9', evaded: '0/9', notes: 'All attacks caught' },
  { duration: '30s', detected: '9/9', evaded: '0/9', notes: 'All attacks caught' },
] as const;
