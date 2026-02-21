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

/**
 * Known gaps in the constraint system. These are real phenomena with published
 * literature, but cannot be formalized as universal constraints yet because
 * the available data is device-specific, material-specific, or application-specific.
 * Documenting them here keeps them tracked without introducing false precision.
 */
export interface ConstraintGap {
  id: string;
  name: string;
  relatedConstraints: number[];
  category: Constraint['category'];
  reason: string;
  bestAvailableData: string;
  literature: string[];
  status: 'documented' | 'partially-addressed' | 'no-data';
}

export const BCI_CONSTRAINT_GAPS: ConstraintGap[] = [
  {
    id: 'GAP-1',
    name: 'Inter-Channel Crosstalk',
    relatedConstraints: [6, 13],
    category: 'signal-detection',
    reason: 'Crosstalk at high electrode density is measured per-device (Utah array, Neuropixels), not governed by a universal equation. Values depend on electrode geometry, spacing, and shielding.',
    bestAvailableData: 'Neuropixels 2.0: <1% crosstalk at 20 um pitch. Utah arrays: measurable above 400 um spacing. No general parametric model exists.',
    literature: [
      'Jun et al. 2017 (Neuropixels)',
      'Steinmetz et al. 2021 (Neuropixels 2.0)',
      'Maynard et al. 1997 (Utah array crosstalk)',
    ],
    status: 'documented',
  },
  {
    id: 'GAP-2',
    name: 'Foreign Body / Immune Response Model',
    relatedConstraints: [10],
    category: 'safety-bio',
    reason: 'Gliosis timelines vary by material, implant size, species, and brain region. Constraint 10 (impedance timeline) captures one symptom but not the full immune cascade. No universal equation covers chronic failure.',
    bestAvailableData: 'Glial encapsulation begins within days, stabilizes at 6-12 weeks. Signal degradation timelines: weeks to years depending on device. Animal models do not reliably predict human response.',
    literature: [
      'Polikov et al. 2005 (foreign body response review)',
      'Barrese et al. 2013 (failure mode analysis, Utah arrays)',
      'Salatino et al. 2017 (glial response mechanisms)',
    ],
    status: 'documented',
  },
  {
    id: 'GAP-3',
    name: 'Power Harvesting / Delivery Tradeoff',
    relatedConstraints: [1, 3, 8],
    category: 'thermo-power',
    reason: 'Inductive, RF, ultrasonic, and battery power sources have different efficiency curves, but these are engineering design choices, not physics constraints. The thermal ceiling (constraint 1) already caps the result regardless of power source.',
    bestAvailableData: 'Inductive: 10-40 mW deliverable. RF harvesting: uW range. Ultrasonic: emerging, ~1 mW at depth. Battery (Neuralink N1): 110 mAh Li-ion, ~7 hr runtime.',
    literature: [
      'Agarwal et al. 2017 (wireless power for implants)',
      'Piech et al. 2020 (ultrasonic neural dust)',
      'Musk & Neuralink 2019 (battery specs)',
    ],
    status: 'partially-addressed',
  },
  {
    id: 'GAP-4',
    name: 'Electrode Material Degradation',
    relatedConstraints: [10, 9],
    category: 'safety-bio',
    reason: 'Corrosion and dissolution rates are material-specific, not generalizable. Tungsten dissolves at 100-500 nm/day in saline. Platinum is far slower. PEDOT coatings delaminate rather than corrode. No single degradation equation covers all electrode types.',
    bestAvailableData: 'Tungsten: 100-500 nm/day dissolution (Patrick et al. 2011). Platinum: minimal dissolution but surface roughening over months. Iridium oxide: charge injection capacity degrades ~20% over 1 year in vivo.',
    literature: [
      'Patrick et al. 2011 (tungsten dissolution)',
      'Cogan 2008 (electrode materials review)',
      'Venkatraman et al. 2011 (chronic electrode stability)',
    ],
    status: 'documented',
  },
  {
    id: 'GAP-5',
    name: 'Stimulation Artifact (Bidirectional)',
    relatedConstraints: [5, 6],
    category: 'signal-detection',
    reason: 'Bidirectional BCIs that both read and write to the brain produce stimulation artifacts that contaminate recording channels. Almost no published data exists for next-gen cortical bidirectional interfaces. Cochlear implant artifact data does not transfer to cortical interfaces.',
    bestAvailableData: 'NeuroPace RNS and Medtronic Percept provide limited bidirectional data. Artifact blanking windows of 1-5 ms are standard. No constraint equation governs the read/write timing tradeoff.',
    literature: [
      'Stanslaski et al. 2018 (Medtronic Percept)',
      'Sun & Bhagat 2018 (artifact rejection methods)',
    ],
    status: 'no-data',
  },
  {
    id: 'GAP-6',
    name: 'On-Chip Processing vs Telemetry Power',
    relatedConstraints: [3, 13],
    category: 'thermo-power',
    reason: 'Constraint 13 (telemetry bandwidth) governs raw streaming. Edge processing reduces bandwidth needs but increases on-chip power (constraint 3). The tradeoff is architecture-specific, not a universal bound.',
    bestAvailableData: 'Neuralink N1: on-chip spike sorting reduces data rate ~100x. Neuropixels: raw streaming at 30 kHz. The optimal split depends on channel count, available power, and application.',
    literature: [
      'Musk & Neuralink 2019',
      'Marblestone et al. 2013 (physical limits of neural engineering)',
    ],
    status: 'partially-addressed',
  },
  {
    id: 'GAP-7',
    name: 'Stimulation Safety (Bidirectional)',
    relatedConstraints: [5],
    category: 'safety-bio',
    reason: 'Shannon limit (constraint 5) covers charge density per phase. But bidirectional BCIs add parameters: pulse width, frequency, duty cycle, and simultaneous read/write timing. DBS literature provides some bounds, but cortical microstimulation parameters differ significantly.',
    bestAvailableData: 'DBS: 60-450 us pulse width, 130-185 Hz, 1-5 V. Cortical microstimulation: 100-400 us, lower amplitudes. No unified safety model spans both recording and stimulation parameter spaces.',
    literature: [
      'Shannon 1992 (electrode safety limits)',
      'McCreery et al. 2010 (stimulation damage thresholds)',
      'Cogan et al. 2016 (charge injection limits review)',
    ],
    status: 'documented',
  },
  {
    id: 'GAP-8',
    name: 'SNR Minimum Quantification',
    relatedConstraints: [6, 12],
    category: 'signal-detection',
    reason: 'Constraint 6 says SNR >> 1 but does not specify a minimum. The threshold depends on the application: motor decoding tolerates lower SNR than speech or sensory feedback. No universal SNR_min exists across all BCI functions.',
    bestAvailableData: 'Motor BCI: SNR > 3-5 dB sufficient for cursor control (Hochberg et al. 2012). Speech BCI: requires higher SNR for phoneme discrimination. Sensory feedback: application-dependent.',
    literature: [
      'Hochberg et al. 2012 (BrainGate motor BCI)',
      'Willett et al. 2023 (speech BCI, Stanford)',
      'Nuyujukian et al. 2018 (SNR and decode performance)',
    ],
    status: 'documented',
  },
];

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
