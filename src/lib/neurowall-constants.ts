/**
 * Neurowall Constants — derived from osi-of-mind/tools/neurowall/ documentation
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

/**
 * Sovereignty Attacks — the hardest class to detect.
 * These attacks slowly drift cognition without the subject's awareness,
 * violating Cognitive Liberty (the right to direct one's own thinking).
 * Named "sovereignty" because they compromise the subject's sovereignty
 * over their own neural state.
 */
export const NEUROWALL_SOVEREIGNTY_ATTACKS = [
  {
    id: 'T0066',
    name: 'Boiling Frog (Adiabatic Slow Drift)',
    niss: 7.4,
    severity: 'High',
    neurorights: ['CL', 'MI', 'PC'],
    description: 'Manipulates BCI parameters along adiabatic paths in neural phase space, keeping instantaneous change rates below detection thresholds while accumulating significant cognitive displacement over time. The attack is invisible to AC-coupled systems because AC coupling mathematically removes the DC component being manipulated.',
    detectionGap: 'AC-coupled EEG systems filter out DC drift entirely. This is not a detector failure — it is a fundamental thermodynamic trade-off in signal acquisition.',
    defense: 'Hardware reference electrode (Phase 1), cumulative phase-space displacement tracking',
    precedent: 'Not new to BCIs. Subliminal advertising via imperceptible screen flicker has been studied since the 1950s. The human critical flicker fusion (CFF) threshold is approximately 60 Hz — displays refreshing above this rate can embed visual stimuli that the conscious mind cannot perceive but the visual cortex still processes and responds to.',
  },
  {
    id: 'T0067',
    name: 'Phase Dynamics Replay / Mimicry',
    niss: 6.4,
    severity: 'Medium',
    neurorights: ['CL', 'MI', 'PC'],
    description: 'GAN-synthesized or RF-injected neural trajectories that are statistically indistinguishable from genuine brain activity. No unsupervised detector can distinguish two identical distributions — this is an information-theoretic limit, not a software bug.',
    detectionGap: 'Information-theoretic: if the injected signal has identical statistics to genuine neural activity, no passive monitor can tell them apart.',
    defense: 'Biological TLS challenge-response protocol (Phase 2) — requires a model of the specific brain\'s unique response patterns',
    precedent: 'Analogous to replay attacks in network security, but operating on neural signal dynamics rather than packet contents.',
  },
  {
    id: 'T0103',
    name: 'SSVEP Frequency Hijack (Neural Steganography)',
    niss: 6.4,
    severity: 'Medium',
    neurorights: ['MP', 'MI'],
    description: 'Embeds imperceptible flicker in displays above the critical flicker fusion threshold (~60 Hz). The visual cortex phase-locks to the flicker frequency even though the user cannot consciously perceive it, enabling covert command injection, neural side-channel exfiltration, or seizure induction.',
    detectionGap: 'The flicker operates above conscious perception but below visual cortex response thresholds. Standard display monitoring cannot distinguish attack flicker from normal refresh.',
    defense: 'SSVEP response correlation checking (Guardrail G3), sub-frame luminance monitoring, display firmware integrity verification',
    precedent: 'Screen flicker as a subliminal channel predates BCIs entirely. Ming et al. (2023) demonstrated a 60 Hz SSVEP BCI achieving 52.8 bits/min information transfer rate from stimuli users could not consciously see (DOI: 10.1088/1741-2552/acb51e). Bian, Meng & Wu (2022) showed trivial square wave injection forces any target classification (DOI: 10.1007/s11432-022-3440-5).',
  },
  {
    id: 'T0040',
    name: 'Neurophishing (Subliminal Stimuli)',
    niss: 5.7,
    severity: 'Medium',
    neurorights: ['MP', 'CL', 'MI'],
    description: 'Presents carefully designed visual, auditory, or haptic stimuli through BCI applications to elicit specific neural responses (P300, SSVEP, emotional markers) that reveal private information or prime the brain for subsequent attack.',
    detectionGap: 'Dual-use: subliminal priming is a legitimate clinical research tool (e.g., Implicit Association Test). Distinguishing therapeutic from adversarial use requires intent analysis, not signal analysis.',
    defense: 'TARA-validated content delivery via Runemate, stimulus ceiling enforcement, consent boundary monitoring',
    precedent: 'Greenwald et al. (2009) Implicit Association Test uses subliminal priming in clinical settings. The technique is identical — only the intent differs.',
  },
] as const;

/** Duration sweep results */
export const NEUROWALL_DURATION_SWEEP = [
  { duration: '10s', detected: '6/9', evaded: '3/9', notes: 'Cascade, boiling frog, phase replay evade' },
  { duration: '15s', detected: '8/9', evaded: '1/9', notes: 'Only boiling frog evades' },
  { duration: '20s', detected: '9/9', evaded: '0/9', notes: 'All attacks caught' },
  { duration: '30s', detected: '9/9', evaded: '0/9', notes: 'All attacks caught' },
] as const;
