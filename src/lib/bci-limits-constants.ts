/**
 * BCI Limits Equation Constants — derived from qif-framework/qif-sec-guardrails.md
 * 13 physics constraints defining the fundamental boundaries of BCI design.
 */

export interface Constraint {
  id: number;
  name: string;
  equation: string;
  explanation: string;
  category: 'thermo-power' | 'em-wireless' | 'scaling-geometry' | 'safety-bio' | 'signal-detection';
}

export const BCI_CONSTRAINT_CATEGORIES = [
  { id: 'thermo-power', label: 'Thermodynamics & Power', color: 'var(--color-accent-primary)' },
  { id: 'em-wireless', label: 'Electromagnetic & Wireless', color: 'var(--color-accent-secondary)' },
  { id: 'scaling-geometry', label: 'Scaling & Geometry', color: 'var(--color-accent-tertiary)' },
  { id: 'safety-bio', label: 'Safety & Biocompatibility', color: 'var(--color-status-warning)' },
  { id: 'signal-detection', label: 'Signal & Detection', color: 'var(--color-status-safe)' },
] as const;

export const BCI_CONSTRAINTS: Constraint[] = [
  {
    id: 1,
    name: 'Thermal Power Ceiling',
    equation: 'P_total(n_ch, node_nm) <= P_thermal(R, n_chips, geometry, perfusion)',
    explanation: 'Total power dissipation must stay below the thermal limit set by brain region, chip count, implant geometry, and local blood perfusion. Exceeding this causes tissue damage.',
    category: 'thermo-power',
  },
  {
    id: 2,
    name: 'Wireless Carrier Frequency',
    equation: 'f_carrier <= f_max(tissue_attenuation, d)',
    explanation: 'The wireless carrier frequency is limited by tissue attenuation at the implant depth. Higher frequencies lose more energy traveling through brain tissue.',
    category: 'em-wireless',
  },
  {
    id: 3,
    name: 'On-Chip Clock Frequency',
    equation: 'f_clock <= f_max_clk(P_budget, C_load, V_dd)',
    explanation: 'The on-chip clock speed is bounded by dynamic power dissipation (P ~ C * V^2 * f). Faster clocks burn more power, which feeds back into the thermal ceiling.',
    category: 'thermo-power',
  },
  {
    id: 4,
    name: "Moore's Law Scaling",
    equation: 'n_ch(t) = n_ch(0) * 2^(t / T_double)',
    explanation: 'BCI channel count doubles approximately every 7.4 years (Stevenson & Kording 2011). This governs when future attack techniques become feasible as hardware scales.',
    category: 'scaling-geometry',
  },
  {
    id: 5,
    name: 'Shannon Electrode Safety',
    equation: 'k = log(D) + log(Q) < 1.75',
    explanation: 'The Shannon safety limit constrains stimulation charge density (D) and charge per phase (Q). Exceeding k = 1.75 risks tissue damage from electrolysis and reactive oxygen species.',
    category: 'safety-bio',
  },
  {
    id: 6,
    name: 'Signal Detectability (SNR)',
    equation: 'V_spike / V_noise_rms >> 1, where V_noise = sqrt(4kT * Re(Z) * df)',
    explanation: 'Neural spikes must exceed the Johnson-Nyquist thermal noise floor. At body temperature (310K) with 1 MOhm impedance and 10 kHz bandwidth, noise is ~13.1 uV rms.',
    category: 'signal-detection',
  },
  {
    id: 7,
    name: 'QIF Coherence Threshold',
    equation: 'Cs(t) >= Cs_min(F)',
    explanation: 'The QIF signal coherence metric must stay above a minimum threshold for each brain function F. When Cs drops below Cs_min, the signal is either degraded, corrupted, or under attack.',
    category: 'signal-detection',
  },
  {
    id: 8,
    name: 'Thermal Ceiling (Coupled)',
    equation: 'DeltaT_total = f(P_total, geometry, perfusion) <= 1.0C',
    explanation: 'Total temperature rise must stay below 1.0C (AAMI conservative guideline). This is coupled to constraint 1 via the Pennes bioheat equation. They are not independent.',
    category: 'thermo-power',
  },
  {
    id: 9,
    name: 'Mechanical Mismatch',
    equation: 'E_implant / E_brain < epsilon_safe',
    explanation: 'The ratio of implant stiffness to brain tissue stiffness must remain below a safe threshold. Silicon is ~6 orders of magnitude stiffer than brain tissue, causing micromotion damage.',
    category: 'safety-bio',
  },
  {
    id: 10,
    name: 'Impedance Timeline',
    equation: 'Z_electrode(t) <= Z_max(signal_type)',
    explanation: 'Electrode impedance rises over time due to gliosis (scar tissue formation). It must stay below the maximum for the target signal type, or recording quality degrades irreversibly.',
    category: 'scaling-geometry',
  },
  {
    id: 11,
    name: 'Geometric Fit',
    equation: 'V_implant(n_ch, packaging) <= V_max(R)',
    explanation: 'The physical volume of the implant (determined by channel count and packaging) must fit within the target brain region. This limits maximum channel density per implant.',
    category: 'scaling-geometry',
  },
  {
    id: 12,
    name: 'Information-Theoretic Minimum',
    equation: 'I_Shannon = B * log2(1 + SNR) >= I_min(F)',
    explanation: 'The Shannon channel capacity must meet the minimum information rate required for the target function. This is a hard floor: no encoding scheme can beat it.',
    category: 'em-wireless',
  },
  {
    id: 13,
    name: 'Wireless Telemetry Bandwidth',
    equation: 'BW_telemetry >= n_ch * f_sample * bit_depth',
    explanation: 'Total wireless data rate must accommodate all channels at their sampling rate and bit depth. This constrains how many channels can transmit simultaneously over the wireless link.',
    category: 'em-wireless',
  },
];

export const BCI_PHYSICS_CONSTANTS = [
  { parameter: 'Max safe tissue temp rise', value: '1.0\u00B0C', source: 'AAMI guideline (conservative)', status: 'Corrected attribution' },
  { parameter: 'Max intracortical power (single 2x2mm chip)', value: '4.8\u20138.4 mW', source: 'Kim et al., Marblestone et al. 2013', status: 'Corrected' },
  { parameter: 'Max intracortical power (distributed/epidural)', value: '15\u201340 mW', source: 'Published BCI thermal analyses', status: 'Verified' },
  { parameter: 'Neural spike bandwidth', value: '300\u201310,000 Hz', source: 'Neurophysiology', status: 'Verified' },
  { parameter: 'Spike amplitude', value: '40\u2013500 \u00B5V', source: 'Neurophysiology', status: 'Verified' },
  { parameter: 'Spike detection range', value: '50\u2013140 \u00B5m', source: 'Electrode characterization', status: 'Verified' },
  { parameter: 'Thermal noise floor (kT at 310K)', value: '4.28 \u00D7 10\u207B\u00B2\u00B9 J', source: 'Boltzmann constant', status: 'Verified' },
  { parameter: 'Johnson noise (1 M\u03A9, 10 kHz BW, 310K)', value: '~13.1 \u00B5V rms', source: 'sqrt(4kT\u00B7Re(Z)\u00B7df), T=310K', status: 'Corrected' },
  { parameter: 'Shannon safety limit (k)', value: '1.75\u20131.85', source: 'Shannon 1992, AAMI, DBS lit.', status: 'Verified' },
  { parameter: 'Neuronal kill zone', value: '40\u2013150 \u00B5m', source: 'Implant pathology', status: 'Corrected' },
  { parameter: 'Brain micromotion (cardiac)', value: '1\u20134 \u00B5m', source: 'Biomechanics', status: 'Corrected' },
  { parameter: 'Brain micromotion (all sources)', value: '10\u201330 \u00B5m', source: 'Cardiac + respiratory + postural', status: 'Clarified' },
  { parameter: 'BCI channel doubling time', value: '~7.4 yr', source: 'Stevenson & Kording 2011', status: 'Corrected' },
  { parameter: 'DC leakage tissue damage threshold', value: '0.4 \u00B5A', source: 'Preclinical studies (PMC6049833)', status: 'Added' },
] as const;

export const BCI_VALIDATION = {
  validator: 'Gemini 2.5 Pro',
  phase: 9,
  constraintsVerified: 12,
  constraintsTotal: 13,
  corrections: [
    'Constraint 9 (mechanical mismatch): inverted ratio corrected to E_implant/E_brain < epsilon_safe',
    'Johnson noise temperature corrected from 300K to 310K (body temperature): ~13.1 \u00B5V rms',
  ],
} as const;
