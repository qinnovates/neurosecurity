/**
 * QIF Threat Map Data — extracted from hourglass.html QIF_DATA.threat_model
 * Single source of truth for all attack vectors used on the threat map.
 *
 * Categories are inspired by MITRE ATT&CK but adapted for BCI/neural security.
 */

import { HOURGLASS_BANDS } from './qif-constants';

/** Attack categories (columns in the threat map) */
export const THREAT_CATEGORIES = [
  { id: 'SI', name: 'Signal Injection', description: 'Injecting false neural or electronic signals' },
  { id: 'SE', name: 'Signal Eavesdropping', description: 'Intercepting signals in transit' },
  { id: 'DM', name: 'Data Manipulation', description: 'Altering decoded intent or recordings' },
  { id: 'DS', name: 'Denial of Service', description: 'Disrupting BCI function' },
  { id: 'PE', name: 'Privilege Escalation', description: 'Gaining unauthorized access depth' },
  { id: 'CI', name: 'Cognitive Integrity', description: 'Thought privacy, perception, identity threats' },
  { id: 'PS', name: 'Physical Safety', description: 'Tissue damage, seizures, involuntary movement' },
  { id: 'EX', name: 'Data Exfiltration', description: 'Extracting neural data for exploitation' },
] as const;

export type CategoryId = typeof THREAT_CATEGORIES[number]['id'];
export type BandId = typeof HOURGLASS_BANDS[number]['id'];
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AccessLevel = 'PUBLIC' | 'LICENSED' | 'RESTRICTED' | 'CLASSIFIED' | null;

export interface ThreatVector {
  /** Unique ID: QTM-{primaryBand}-{category}-{seq} */
  id: string;
  /** Display name */
  name: string;
  /** Category assignment */
  category: CategoryId;
  /** Hourglass bands affected */
  bands: BandId[];
  /** Severity level */
  severity: Severity;
  /** Coupling mechanism (for frequency-domain attacks) */
  coupling: string | null;
  /** Access level required */
  access: AccessLevel;
  /** Classical detection capability */
  classicalDetection: string;
  /** Quantum detection capability */
  quantumDetection: string;
  /** Full description */
  description: string;
  /** Original band string from hourglass data */
  bandsStr: string;
}

export const THREAT_VECTORS: ThreatVector[] = [
  // ── Signal Injection ──
  {
    id: 'QTM-I0-SI-001',
    name: 'Signal Injection',
    category: 'SI',
    bands: ['I0', 'N1'],
    severity: 'high',
    coupling: null,
    access: null,
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (coherence metric)',
    description: 'Inject false signals at electrode-tissue boundary. Classical detection via impedance anomaly. QI coherence metric flags phase/timing inconsistency.',
    bandsStr: 'I0–N1',
  },
  {
    id: 'QTM-N4-SI-002',
    name: 'ELF Neural Entrainment',
    category: 'SI',
    bands: ['S1', 'N4', 'N5', 'N6', 'N7'],
    severity: 'critical',
    coupling: 'DIRECT',
    access: 'RESTRICTED',
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (Dsf anomaly detection)',
    description: '3-76 Hz government-restricted. IS neural frequency. Penetrates globally. Direct gamma/alpha/theta cortical entrainment. US Navy operated at 76 Hz (Clam Lake) and 45 Hz (Republic). Russia, China maintain capability.',
    bandsStr: 'S1→N4–N7',
  },
  {
    id: 'QTM-N4-SI-003',
    name: 'Intermodulation (BCI Weaponized)',
    category: 'SI',
    bands: ['S2', 'N4', 'N5', 'N6'],
    severity: 'critical',
    coupling: 'INTERMODULATION',
    access: 'RESTRICTED',
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (coherence + Dsf)',
    description: 'UHF-Mil (225-400 MHz) + MICS (402 MHz) = neural-range beat frequency. BCI\'s own telemetry signal becomes part of the attack. 398 MHz mil + 402 MHz BCI = 4 Hz → theta → N4 thalamus. Most dangerous coupling mechanism.',
    bandsStr: 'S2→N4–N6',
  },
  {
    id: 'QTM-N7-SI-004',
    name: 'Pulsed Microwave (Frey Effect)',
    category: 'SI',
    bands: ['S3', 'N2', 'N7'],
    severity: 'high',
    coupling: 'ENVELOPE',
    access: 'RESTRICTED',
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (temporal coherence)',
    description: 'S-band (2-4 GHz) pulsed microwave. Thermoelastic expansion → cochlea perceives as sound. \'Havana Syndrome\' model. PRF selects neural target: 40 Hz → N7 gamma, 10 Hz → N6 alpha, 4 Hz → N4 theta, 1 Hz → N2 delta.',
    bandsStr: 'S3→N2,N7',
  },
  {
    id: 'QTM-N4-SI-005',
    name: 'Temporal Interference (Deep Targeting)',
    category: 'SI',
    bands: ['S2', 'N4', 'N5', 'N6'],
    severity: 'high',
    coupling: 'TEMPORAL_INTERFERENCE',
    access: 'LICENSED',
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (beat frequency detection)',
    description: 'Two kHz+ signals create neural-range beat frequency at tissue intersection. Can target deep brain structures non-invasively. Grossman et al. 2017, Cell. Licensed frequencies — lower barrier than restricted.',
    bandsStr: 'S2→N4–N6',
  },
  {
    id: 'QTM-N1-SI-006',
    name: 'Envelope Modulation (Stealth Carrier)',
    category: 'SI',
    bands: ['S1', 'S2', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'],
    severity: 'high',
    coupling: 'ENVELOPE',
    access: 'PUBLIC',
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (demodulation detection)',
    description: 'Any carrier frequency modulated at neural frequency. Tissue demodulates the envelope. Stealth: carrier looks normal, attack is in the modulation. Lowest barrier to entry — PUBLIC access. tACS therapeutic principle weaponized.',
    bandsStr: 'S1–S2→any N',
  },
  {
    id: 'QTM-I0-SI-007',
    name: 'Quantum Tunneling Exploit',
    category: 'SI',
    bands: ['I0', 'N1'],
    severity: 'high',
    coupling: null,
    access: null,
    classicalDetection: 'No',
    quantumDetection: 'Yes (tunneling profile anomaly)',
    description: 'Exploit ion channel quantum tunneling to inject false synaptic events. Detectable via Q_tunnel term anomaly in QI equation.',
    bandsStr: 'I0–N1',
  },
  {
    id: 'QTM-I0-SI-008',
    name: 'Davydov Soliton Attack',
    category: 'SI',
    bands: ['I0', 'N1'],
    severity: 'high',
    coupling: null,
    access: null,
    classicalDetection: 'No',
    quantumDetection: 'Yes (tunneling term Q_tunnel)',
    description: 'Use THz stimulation to trigger Davydov solitons in SNARE protein complexes, causing false neurotransmitter release at I0.',
    bandsStr: 'I0–N1',
  },

  // ── Signal Eavesdropping ──
  {
    id: 'QTM-I0-SE-001',
    name: 'Eavesdropping',
    category: 'SE',
    bands: ['I0', 'N1'],
    severity: 'high',
    coupling: null,
    access: null,
    classicalDetection: 'No',
    quantumDetection: 'Yes (Heisenberg disturbance)',
    description: 'Passive interception of neural signals at I0. Classically undetectable. Quantum: measurement disturbs state — detectable via QI anomaly.',
    bandsStr: 'I0–N1',
  },
  {
    id: 'QTM-S1-SE-002',
    name: 'BLE/RF Side-Channel',
    category: 'SE',
    bands: ['S1', 'S2'],
    severity: 'medium',
    coupling: null,
    access: 'PUBLIC',
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (signal correlation)',
    description: 'Extract neural data from BLE/RF emissions via timing, power, or EM side-channels. All wireless BCIs vulnerable. Consumer devices (Muse, EMOTIV) transmit unencrypted. QI cross-band correlation detects exfiltration patterns.',
    bandsStr: 'S1–S2',
  },

  // ── Data Manipulation ──
  {
    id: 'QTM-I0-DM-001',
    name: 'Man-in-the-Middle',
    category: 'DM',
    bands: ['I0'],
    severity: 'critical',
    coupling: null,
    access: null,
    classicalDetection: 'Partial',
    quantumDetection: 'Yes (no-cloning + Bell test)',
    description: 'Intercept and modify signals at I0 boundary. No-cloning theorem prevents perfect copy of quantum neural states. Bell test detects entanglement disruption.',
    bandsStr: 'I0',
  },
  {
    id: 'QTM-S2-DM-002',
    name: 'Supply Chain Compromise',
    category: 'DM',
    bands: ['S2', 'S3'],
    severity: 'high',
    coupling: null,
    access: null,
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (firmware attestation)',
    description: 'Tamper with BCI hardware/firmware during manufacturing or distribution. Firmware rootkits persist across updates. Affects all device classes. QI-enhanced firmware attestation detects unauthorized modifications.',
    bandsStr: 'S2–S3',
  },

  // ── Denial of Service ──
  {
    id: 'QTM-N3-DS-001',
    name: 'Neural Ransomware',
    category: 'DS',
    bands: ['N3', 'N7', 'N6'],
    severity: 'critical',
    coupling: null,
    access: null,
    classicalDetection: 'Partial',
    quantumDetection: 'Yes (QI score drop)',
    description: 'Disrupt or lock neural function via stimulation manipulation. Closed-loop devices (RNS, DBS) most vulnerable. QI detects anomalous coherence collapse.',
    bandsStr: 'N3',
  },

  // ── Privilege Escalation ──
  {
    id: 'QTM-N3-PE-001',
    name: 'Identity Spoofing',
    category: 'PE',
    bands: ['N3', 'N7', 'N6'],
    severity: 'high',
    coupling: null,
    access: null,
    classicalDetection: 'Partial',
    quantumDetection: 'Yes (quantum biometric)',
    description: 'Replicate user\'s neural signature to bypass authentication. Classical biometrics partially spoofable. Quantum neural signatures (if proven) are physically unclonable.',
    bandsStr: 'N3–N7',
  },

  // ── Cognitive Integrity ──
  {
    id: 'QTM-N1-CI-001',
    name: 'Neural Data Privacy Breach',
    category: 'CI',
    bands: ['N1', 'S1', 'S2', 'S3'],
    severity: 'high',
    coupling: null,
    access: null,
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (cross-band encryption)',
    description: 'Unauthorized access to recorded neural data across any band. Harvest raw EEG from consumer devices, decode intent/emotion. GDPR Article 9 (special category data). NSP end-to-end encryption from I0 to cloud.',
    bandsStr: 'N1–S3',
  },

  // ── Physical Safety ──
  {
    id: 'QTM-I0-PS-001',
    name: 'Directed Energy (Thermal I0 Damage)',
    category: 'PS',
    bands: ['S3', 'I0'],
    severity: 'critical',
    coupling: null,
    access: 'CLASSIFIED',
    classicalDetection: 'Yes',
    quantumDetection: 'N/A (physical damage, not signal)',
    description: 'mm-wave/ADS (95 GHz) directed energy. Excites water molecules in top 0.4mm of skin. For surface implants: electrode heating, tissue damage at I0 boundary. Destroys interface integrity. Nation-state only.',
    bandsStr: 'S3→I0',
  },

  // ── Data Exfiltration ──
  {
    id: 'QTM-S3-EX-001',
    name: 'Cloud Infrastructure Attack',
    category: 'EX',
    bands: ['S3'],
    severity: 'medium',
    coupling: null,
    access: 'PUBLIC',
    classicalDetection: 'Yes',
    quantumDetection: 'Enhanced (QKD for data-in-transit)',
    description: 'Compromise cloud services processing neural data (EMOTIV Cortex API, Neuralink cloud). Data exfiltration, model poisoning, API manipulation. PQC/QKD protects data in transit.',
    bandsStr: 'S3',
  },
  {
    id: 'QTM-S3-EX-002',
    name: 'Harvest-Now-Decrypt-Later',
    category: 'EX',
    bands: ['S3'],
    severity: 'critical',
    coupling: null,
    access: null,
    classicalDetection: 'No',
    quantumDetection: 'Prevented (QKD/PQC)',
    description: 'Record encrypted BCI traffic now, decrypt when quantum computers arrive (2030-2035). Neural data is permanently sensitive — can\'t change your brain like a password. PQC (ML-KEM/Kyber) prevents. 10-20 year implant lifetime > quantum arrival.',
    bandsStr: 'S3',
  },
] as const;

/** Severity color map */
export const SEVERITY_COLORS = {
  critical: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' },
  high: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
  medium: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', text: '#eab308' },
  low: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
} as const;

/** Zone color map (matches hourglass bands) */
export const ZONE_COLORS = {
  neural: { accent: '#22c55e', bg: 'rgba(34, 197, 94, 0.05)' },
  interface: { accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  synthetic: { accent: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)' },
} as const;

/** Helper: get threats for a specific band+category intersection */
export function getThreatsForCell(bandId: BandId, categoryId: CategoryId): ThreatVector[] {
  return THREAT_VECTORS.filter(t => t.bands.includes(bandId) && t.category === categoryId);
}

/** Helper: get max severity for a cell */
export function getCellSeverity(bandId: BandId, categoryId: CategoryId): Severity | null {
  const threats = getThreatsForCell(bandId, categoryId);
  if (threats.length === 0) return null;
  const order: Severity[] = ['critical', 'high', 'medium', 'low'];
  for (const s of order) {
    if (threats.some(t => t.severity === s)) return s;
  }
  return null;
}

/** Helper: count threats per severity */
export function getThreatStats() {
  const stats = { critical: 0, high: 0, medium: 0, low: 0, total: THREAT_VECTORS.length };
  for (const t of THREAT_VECTORS) {
    stats[t.severity]++;
  }
  return stats;
}
