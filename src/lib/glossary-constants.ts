/**
 * QIF Glossary Constants — structured terminology for the glossary page.
 * Source of truth: QIF-WIKI.md + qif-constants.ts
 */

export interface GlossaryTerm {
  id: string;
  term: string;
  type: 'equation' | 'concept' | 'principle' | 'protocol' | 'architecture' | 'attack' | 'metric' | 'component';
  shortDef: string;
  fullDef: string;
  formula?: string;
  relatedTerms?: string[];
  href?: string;
  tags?: string[];
}

export const TERM_TYPES: Record<string, { label: string; color: string }> = {
  equation: { label: 'Equation', color: '#06b6d4' },
  concept: { label: 'Concept', color: '#8b5cf6' },
  principle: { label: 'Principle', color: '#10b981' },
  protocol: { label: 'Protocol', color: '#f59e0b' },
  architecture: { label: 'Architecture', color: '#3b82f6' },
  attack: { label: 'Attack', color: '#ef4444' },
  metric: { label: 'Metric', color: '#ec4899' },
  component: { label: 'Component', color: '#f97316' },
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // === Architecture ===
  {
    id: 'hourglass-model',
    term: 'Hourglass Model',
    type: 'architecture',
    shortDef: 'QIF\'s 11-band (7-1-3) asymmetric security architecture for BCIs.',
    fullDef: 'The core architectural pattern of QIF. Seven neural bands (N7 Neocortex through N1 Spinal Cord) sit above the waist, with the Neural Interface (I0) at the narrowest point and three synthetic bands (S1-S3) below. The hourglass shape reflects the physical reality of BCIs: signals funnel through the electrode-tissue boundary.',
    relatedTerms: ['neural-interface', 'neural-domain', 'synthetic-domain'],
    href: '/framework/#hourglass',
    tags: ['architecture', 'core'],
  },
  {
    id: 'neural-interface',
    term: 'Neural Interface (I0)',
    type: 'architecture',
    shortDef: 'The electrode-tissue boundary — the hourglass waist where biology meets silicon.',
    fullDef: 'Band I0 is the physical point where electrodes make contact with neural tissue. It represents the most critical attack surface in any BCI system because signals crossing this boundary transition between biological and synthetic domains. QIF places the strongest security controls here.',
    relatedTerms: ['hourglass-model', 'coherence-metric'],
    href: '/framework/#bands',
    tags: ['architecture', 'security'],
  },
  {
    id: 'neural-domain',
    term: 'Neural Domain (N7-N1)',
    type: 'architecture',
    shortDef: 'The seven bands above I0 representing biological neural structures.',
    fullDef: 'Spans from the Neocortex (N7: executive function, language, perception) down through Limbic System (N6), Basal Ganglia (N5), Diencephalon (N4), Cerebellum (N3), Brainstem (N2), to Spinal Cord (N1). Each band has distinct threat surfaces and security requirements.',
    relatedTerms: ['hourglass-model', 'synthetic-domain'],
    href: '/framework/#bands',
    tags: ['architecture'],
  },
  {
    id: 'synthetic-domain',
    term: 'Synthetic Domain (S1-S3)',
    type: 'architecture',
    shortDef: 'The three bands below I0 representing hardware and digital systems.',
    fullDef: 'S1 (Analog/Near-Field): amplification, ADC, near-field EM. S2 (Digital/Telemetry): decoding, BLE/WiFi, telemetry. S3 (Radio/Wireless/DE): RF, directed energy, application layer. Traditional cybersecurity frameworks apply here, extended by QIF for neural context.',
    relatedTerms: ['hourglass-model', 'neural-domain'],
    href: '/framework/#bands',
    tags: ['architecture'],
  },

  // === Equations ===
  {
    id: 'coherence-metric',
    term: 'Coherence Metric (Cs)',
    type: 'equation',
    shortDef: 'Signal trustworthiness score measuring phase, temporal, and spatial variance.',
    fullDef: 'Quantifies how trustworthy a neural signal is by measuring three dimensions of variance: phase (timing jitter), temporal (pathway integrity), and spatial (amplitude stability). Score ranges from 0 (compromised) to 1 (perfectly coherent). Thresholds: >0.6 Coherent, 0.3-0.6 Gateway, <0.3 Breach.',
    formula: 'Cs = e^(-(sigma^2_psi + sigma^2_tau + sigma^2_gamma))',
    relatedTerms: ['phase-variance', 'transport-variance', 'gain-variance'],
    href: '/framework/#coherence',
    tags: ['equation', 'security-core'],
  },
  {
    id: 'scale-frequency-invariant',
    term: 'Scale-Frequency Invariant',
    type: 'equation',
    shortDef: 'Neural oscillation constraint: frequency times spatial extent is approximately constant.',
    fullDef: 'A fundamental relationship in neural signal propagation: v = f x lambda, where k is approximately 1-10 m/s (not 10^6). This invariant sets the physical constraints for BCI security: signals at specific frequencies must originate from spatially appropriate regions. Violations indicate anomalous or injected signals.',
    formula: 'v = f x lambda (k ~ 1-10 m/s)',
    relatedTerms: ['coherence-metric', 'gamma-band', 'theta-band'],
    href: '/framework/#scale-frequency',
    tags: ['equation', 'signal-processing'],
  },
  {
    id: 'qi-additive',
    term: 'QI Candidate 1 (Additive)',
    type: 'equation',
    shortDef: 'Additive model for quantum indeterminacy contribution to neural security.',
    fullDef: 'First candidate equation for quantifying quantum effects in neural signaling. Combines classical coherence with quantum terms (indeterminacy, entanglement) minus tunneling loss. Under development and validation.',
    formula: 'QI(t) = C_class + (1-GammaD(t))*[Qi + Q_entangle] - Q_tunnel',
    relatedTerms: ['qi-tensor', 'coherence-metric', 'quantum-indeterminacy'],
    tags: ['equation', 'quantum', 'research'],
  },
  {
    id: 'qi-tensor',
    term: 'QI Candidate 2 (Tensor)',
    type: 'equation',
    shortDef: 'Tensor product model combining classical and quantum security factors.',
    fullDef: 'Second candidate equation using tensor product to combine classical coherence with quantum entropy terms. Treats classical and quantum domains as coupled but separate systems, combined via Kronecker product rather than simple addition.',
    formula: 'QI = C_class tensor e^(-S_quantum)',
    relatedTerms: ['qi-additive', 'coherence-metric', 'von-neumann-entropy'],
    tags: ['equation', 'quantum', 'research'],
  },

  // === Metrics ===
  {
    id: 'phase-variance',
    term: 'Phase Variance (sigma^2_psi)',
    type: 'metric',
    shortDef: 'Timing consistency of neural signals — detects out-of-sync injections.',
    fullDef: 'Measures timing jitter in neural signal phase. High phase variance indicates signals that do not match expected brain rhythms, potentially from injected or replayed attacks. One of three components in the Coherence Metric.',
    relatedTerms: ['coherence-metric', 'transport-variance', 'gain-variance'],
    tags: ['metric', 'signal-processing'],
  },
  {
    id: 'transport-variance',
    term: 'Transport Variance (sigma^2_tau)',
    type: 'metric',
    shortDef: 'Pathway integrity — flags signals bypassing biological routes.',
    fullDef: 'Measures whether signals arrive via expected biological pathways. High transport variance indicates signals "taking the wrong route" through the neural system, potentially from unauthorized access points or compromised electrodes.',
    relatedTerms: ['coherence-metric', 'phase-variance', 'gain-variance'],
    tags: ['metric', 'signal-processing'],
  },
  {
    id: 'gain-variance',
    term: 'Gain Variance (sigma^2_gamma)',
    type: 'metric',
    shortDef: 'Amplitude stability — catches artificially powered signals.',
    fullDef: 'Measures stability of signal amplitude over time. Artificially over- or under-powered signals produce high gain variance, indicating potential signal injection or manipulation attacks.',
    relatedTerms: ['coherence-metric', 'phase-variance', 'transport-variance'],
    tags: ['metric', 'signal-processing'],
  },
  {
    id: 'niss',
    term: 'NISS (Neural Impact Scoring System)',
    type: 'metric',
    shortDef: 'First CVSS v4.0 extension for neural security (0-10 scale).',
    fullDef: 'Developed by Qinnovate as the first CVSS v4.0 extension for neural security, following FIRST.org\'s extension framework (User Guide §3.11). Five equally-weighted extension metrics: Biological Impact (BI), Cognitive Integrity (CG), Consent Violation (CV), Reversibility (RV), Neuroplasticity (NP). Context profiles (Clinical, Research, Consumer, Military) provide domain-specific weighting. Every technique carries both a NISS extension vector and a CVSS v4.0 base vector. 94.4% of TARA techniques require NISS for full-fidelity scoring. PINS flag triggers when BI >= High or RV = Irreversible. Severity: Critical (9.0+), High (7.0-8.9), Medium (4.0-6.9), Low (0.1-3.9).',
    formula: 'NISS = (BI + CG + CV + RV + NP) / 5',
    relatedTerms: ['tara-taxonomy', 'tara'],
    href: '/scoring/',
    tags: ['metric', 'original'],
  },

  // === Protocols & Components ===
  {
    id: 'nsp',
    term: 'NSP (Neural Sensory Protocol)',
    type: 'protocol',
    shortDef: 'RFC-style post-quantum wire protocol for BCI data links.',
    fullDef: 'A five-layer defense protocol securing BCI communication channels with post-quantum cryptography at 3.25% power overhead. Designed as an RFC-style specification for interoperability across BCI manufacturers.',
    relatedTerms: ['qif', 'runemate', 'post-quantum-cryptography'],
    href: '/nsp/',
    tags: ['protocol', 'core'],
  },
  {
    id: 'runemate',
    term: 'Runemate',
    type: 'component',
    shortDef: 'HTML-to-bytecode compiler achieving 65-90% compression.',
    fullDef: 'An HTML-to-Staves bytecode compiler achieving 65-90% size reduction. Makes post-quantum encryption viable on implants by compressing payloads before encryption. Runemate Forge is the compiler, Staves is the bytecode format, Scribe is the on-chip interpreter.',
    relatedTerms: ['nsp', 'staves-bytecode'],
    href: '/runemate/',
    tags: ['component', 'core'],
  },
  {
    id: 'tara',
    term: 'TARA (Therapeutic Applications & Risk Assessment)',
    type: 'component',
    shortDef: 'Interactive threat atlas mapping BCI attack vectors across four domains.',
    fullDef: 'A comprehensive threat atlas organizing BCI threats across Security, Clinical, Governance, and Engineering domains. Contains technique entries scored with NISS and classified using the TARA Taxonomy. Provides filterable, searchable access to the full QIF threat model.',
    relatedTerms: ['niss', 'tara-taxonomy'],
    href: '/TARA/',
    tags: ['component', 'original'],
  },
  {
    id: 'tara-taxonomy',
    term: 'TARA Taxonomy',
    type: 'architecture',
    shortDef: 'First threat classification system purpose-built for neural interfaces.',
    fullDef: 'Developed by Qinnovate, the TARA Taxonomy classifies BCI attacks by the anatomical or functional locus where the attack operates. Uses a QIF-[Domain].[Action] format across 8 domains (Neural, Cognitive, Physiological, Data, BCI System, Model, Energy, Consumer Sensor) mapping to 15 distinct tactics.',
    relatedTerms: ['niss', 'tara', 'hourglass-model'],
    href: '/framework/#taxonomy',
    tags: ['architecture', 'original'],
  },

  // === Principles ===
  {
    id: 'cognitive-liberty',
    term: 'Cognitive Liberty',
    type: 'principle',
    shortDef: 'Right to mental self-determination and freedom from unauthorized interference.',
    fullDef: 'The foundational neuroethics principle: every individual possesses the right to mental self-determination. In QIF, this translates to the neural firewall\'s default-deny architecture: unauthenticated signals are rejected regardless of coherence. Permission is required, not optional.',
    relatedTerms: ['mental-privacy', 'mental-integrity', 'psychological-continuity'],
    tags: ['principle', 'neuroethics'],
  },
  {
    id: 'mental-privacy',
    term: 'Mental Privacy',
    type: 'principle',
    shortDef: 'Right to keep neural data and mental states confidential — including protection from cross-modal re-identification.',
    fullDef: 'Neural data is not ordinary data. It is the substrate of thought itself. Mental privacy protects against unauthorized brain reading, thought surveillance, and neural data harvesting. QIF extends MP with data-lifecycle protections: cross-modal re-linking (correlating EEG with gait, voice, or keystrokes), anonymization failure, and informational disassociation. Implemented through transport variance detection, encryption, and the BCI Anonymizer.',
    relatedTerms: ['cognitive-liberty', 'mental-integrity', 'cognitive-authenticity'],
    tags: ['principle', 'neuroethics'],
  },
  {
    id: 'mental-integrity',
    term: 'Mental Integrity',
    type: 'principle',
    shortDef: 'Right to protection from unauthorized alteration of neural function, including disruption of brain rhythms and dynamics.',
    fullDef: 'Protection from neural hacking, cognitive manipulation, and brain malware. QIF extends MI with dynamical integrity: protecting oscillatory rhythms, timing, and homeostatic equilibria from covert retuning attacks (gradual drift, baseline adaptation poisoning, neurofeedback falsification). Enforced through amplitude bounds, rate limiting, and the coherence metric.',
    relatedTerms: ['cognitive-liberty', 'psychological-continuity', 'cognitive-authenticity'],
    tags: ['principle', 'neuroethics'],
  },
  {
    id: 'psychological-continuity',
    term: 'Psychological Continuity',
    type: 'principle',
    shortDef: 'Right to maintain personal identity, memory, and sense of self.',
    fullDef: 'Protection against identity manipulation, memory tampering, and personality modification. Particularly critical for developing brains (pediatric considerations) and long-term BCI users whose neural patterns may adapt to device interaction.',
    relatedTerms: ['cognitive-liberty', 'cognitive-authenticity'],
    tags: ['principle', 'neuroethics'],
  },
  {
    id: 'cognitive-authenticity',
    term: 'Cognitive Authenticity',
    type: 'principle',
    shortDef: 'Right to know which thoughts are genuinely one\'s own — protection from write-attacks on neural signals.',
    fullDef: 'Protection from implanted thoughts, covert influence, and confusion of agency. QIF\'s original contribution to the neurorights literature: no prior framework distinguished read-attacks (Mental Privacy) from write-attacks (Cognitive Authenticity). Maps to the integrity/authenticity dimension of the CIA triad. The coherence metric provides a quantitative basis for authenticity assessment: signals that do not match expected biological patterns may not be authentic to the user.',
    relatedTerms: ['coherence-metric', 'cognitive-liberty', 'mental-privacy'],
    tags: ['principle', 'neuroethics'],
  },

  // === Energy-Time Security Bounds (Entry 52) ===
  {
    id: 'three-floors',
    term: 'Three Floors',
    type: 'concept',
    shortDef: 'Three physics limits that define what any BCI can and cannot detect.',
    fullDef: 'Every measurement system — including brain-computer interfaces — is constrained by three fundamental physical limits stacked like floors in a building. Floor 1 (Landauer): the minimum heat generated per measurement. Floor 2 (Margolus-Levitin): the maximum speed any computation can run. Floor 3 (Energy-Time Uncertainty): the finest energy change you can detect at a given sampling rate. Current BCIs operate ~10 orders of magnitude above the quantum floor — creating a blind spot where quantum-scale attacks would be invisible.',
    relatedTerms: ['landauer-principle', 'margolus-levitin', 'energy-time-uncertainty', 'security-gap'],
    tags: ['concept', 'quantum', 'security-core'],
  },
  {
    id: 'landauer-principle',
    term: "Landauer's Principle",
    type: 'principle',
    shortDef: 'Every bit erased costs at least kT ln 2 energy — the heat tax on information.',
    fullDef: "A law of thermodynamics applied to computation: every time a computer erases one bit of information, it must release at least kT ln 2 of energy as heat. Think of it like a toll road — every bit of data pays a heat toll. This is why Moore's Law hit a wall (too many transistors = too much heat) and why BCI measurements have a minimum energy cost. For Neuralink with 1,024 channels at body temperature: at least 3.04 × 10⁻¹⁸ joules per sample.",
    formula: 'E_min = kT ln 2 per bit erasure',
    relatedTerms: ['three-floors', 'margolus-levitin', 'security-gap'],
    tags: ['principle', 'thermodynamics'],
  },
  {
    id: 'margolus-levitin',
    term: 'Margolus-Levitin Theorem',
    type: 'principle',
    shortDef: "The universe's speed limit for computation — no system can compute faster than 2E/πℏ ops/sec.",
    fullDef: 'Just as the speed of light limits how fast anything can travel, the Margolus-Levitin theorem limits how fast anything can compute. The maximum number of operations per second equals 2E/(πℏ), where E is the system energy. For BCI security, this means an attacker manipulating the electrode-tissue interface cannot perform more than 2E/(πℏ) operations per second — a physics-derived ceiling on quantum attack bandwidth. For Neuralink at 24.7 mW: ~1.49 × 10³² ops/sec.',
    formula: 'max ops/sec = 2E/(πℏ)',
    relatedTerms: ['three-floors', 'landauer-principle', 'energy-time-uncertainty'],
    tags: ['principle', 'quantum', 'security-core'],
  },
  {
    id: 'energy-time-uncertainty',
    term: 'Energy-Time Uncertainty',
    type: 'equation',
    shortDef: 'You cannot know both the energy AND timing of an event with perfect precision.',
    fullDef: "The energy-time form of Heisenberg's uncertainty principle: the more precisely you measure when something happens, the less precisely you can know its energy — and vice versa. For BCIs, this means any sampling rate has a minimum detectable energy change: ΔE_min = ℏ/(2Δt). At Neuralink's 20 kHz sampling, the minimum detectable energy is ~6.6 × 10⁻¹² eV — while thermal noise is ~26.7 meV. That 10-order-of-magnitude gap is the quantum blind spot.",
    formula: 'ΔEΔt ≥ ℏ/2',
    relatedTerms: ['three-floors', 'security-gap', 'quantum-indeterminacy'],
    tags: ['equation', 'quantum', 'security-core'],
  },
  {
    id: 'security-gap',
    term: 'Security Gap (10 OOM Blind Spot)',
    type: 'concept',
    shortDef: 'The ~10 orders of magnitude between what BCIs can detect and the quantum floor.',
    fullDef: "Current BCIs sample at kilohertz rates, giving them energy resolution of ~10⁻¹² eV. But thermal noise at body temperature is ~10⁻² eV. That's a gap of about 10 billion times (9.6 orders of magnitude). Any attacker operating in this gap — below the thermal noise floor but above the quantum uncertainty floor — would be completely invisible to classical BCI security. This isn't a technology limitation that better engineering can fix. It's a consequence of ΔEΔt ≥ ℏ/2. QIF is the first framework that accounts for this gap.",
    relatedTerms: ['three-floors', 'energy-time-uncertainty', 'neural-interface'],
    tags: ['concept', 'security-core'],
  },
  {
    id: 'classical-quantum-crossover',
    term: 'Classical-Quantum Crossover',
    type: 'concept',
    shortDef: 'The point where thermal costs equal the quantum floor — where classical physics gives way to quantum.',
    fullDef: "The transition from classical to quantum regime occurs when N × kT × ln(2) ≈ πℏ/2, where N is channel count and T is temperature. At body temperature (310 K), the crossover N is ~5.6 × 10⁻¹⁴ — meaning the quantum floor is 14 orders of magnitude below a single channel. This is why quantum effects are hard to observe in warm biological systems, and why lowering temperature (cryogenics) or finding biological shielding mechanisms is necessary to access the quantum regime.",
    formula: 'N × kT × ln(2) ≈ πℏ/2',
    relatedTerms: ['three-floors', 'decoherence', 'landauer-principle'],
    tags: ['concept', 'quantum'],
  },
  {
    id: 'tau-d-critical',
    term: 'τD Critical (Physics-Motivated Decoherence Default)',
    type: 'equation',
    shortDef: 'Default decoherence time derived from temperature: τD = ℏ/(2kT).',
    fullDef: "Instead of leaving the decoherence time τD as a completely free parameter, QIF now derives a physics-motivated default: τD_critical = ℏ/(2kT). At body temperature this gives ~1.2 × 10⁻¹⁴ seconds — matching Tegmark's estimate. This means Tegmark's 'instant decoherence' camp is the DEFAULT expectation. Any longer decoherence time requires a specific biological shielding mechanism (Posner molecules, microtubule confinement, etc.). The parameter remains tunable, but now has a principled starting point.",
    formula: 'τD_critical = ℏ/(2kT)',
    relatedTerms: ['decoherence', 'classical-quantum-crossover', 'three-floors'],
    tags: ['equation', 'quantum'],
  },

  // === I0 Depth Subclassification (Entry 59) ===
  {
    id: 'i0-depth',
    term: 'I0 Depth Subclassification',
    type: 'architecture',
    shortDef: 'Where an electrode sits in the brain determines how many biological security layers it bypasses.',
    fullDef: 'The I0 band is not monolithic — its security criticality depends on implant depth. I0-cortical (surface/penetrating, e.g., Neuralink) bypasses all biological security layers including the thalamic firewall. I0-subcortical (e.g., DBS electrodes) sits inside or below the firewall. I0-spinal/peripheral has the full neural hierarchy above it. I0-noninvasive (EEG, fNIRS) is attenuated by skull and CSF. Deeper = fewer biological layers bypassed = lower direct cognitive risk.',
    relatedTerms: ['neural-interface', 'thalamic-firewall', 'hourglass-model'],
    href: '/framework/#bands',
    tags: ['architecture', 'security-core'],
  },
  {
    id: 'thalamic-gating',
    term: 'Thalamic Gating (N4)',
    type: 'concept',
    shortDef: 'The thalamus blocks all sensory traffic by default and only relays what the cortex requests — the brain\'s primary selective filter.',
    fullDef: 'The reticular thalamic nucleus (TRN) implements default-deny inhibition: tonically active GABAergic neurons suppress all relay traffic unless specifically disinhibited by corticothalamic feedback. Modality-specific relay nuclei (LGN for vision, MGN for audition) route each sensory stream independently. NREM sleep suppresses relay globally. Key bypass: amygdala fast path (~12ms direct sensory-to-threat route) operates without thalamic gating. BCIs implanted above the thalamus (I0-cortical) bypass this gating entirely.',
    relatedTerms: ['i0-depth', 'neural-interface', 'hourglass-model'],
    tags: ['concept', 'security-core', 'neuroscience'],
  },

  {
    id: 'i0-directionality',
    term: 'I0 Directionality',
    type: 'architecture',
    shortDef: 'Whether a BCI can only read your brain, only write to it, or do both. Bidirectional devices have the biggest attack surface because an adversary could steal your thoughts AND inject fake ones.',
    fullDef: 'BCI directionality is orthogonal to I0 depth and critically affects the threat profile. Read-only devices (BrainGate, EEG) can only exfiltrate neural data. Write-only devices (cochlear implants, older DBS, TMS) can only inject signals. Bidirectional devices (Medtronic Percept RC, NeuroPace RNS, Neuralink N1) can both read and write — full attack surface. Closed-loop systems are a special case: they autonomously detect patterns and respond with stimulation, meaning a compromised device could create self-triggering, self-reinforcing attacks.',
    relatedTerms: ['i0-depth', 'neural-interface', 'hourglass-model'],
    tags: ['architecture', 'security-core'],
  },

  // === Quantum Concepts ===
  {
    id: 'quantum-indeterminacy',
    term: 'Quantum Indeterminacy',
    type: 'concept',
    shortDef: 'Inherent unpredictability at synaptic scale that makes cognitive signatures uncloneable.',
    fullDef: 'Neural signals exhibit quantum-scale indeterminacy at the synaptic level. This irreducible unpredictability is what makes each person\'s cognitive signature fundamentally uncloneable. QIF builds security architecture on this physical foundation. The "Quantum" in QIF is literal, not metaphorical.',
    relatedTerms: ['qi-additive', 'qi-tensor', 'no-cloning-theorem'],
    tags: ['concept', 'quantum'],
  },
  {
    id: 'no-cloning-theorem',
    term: 'No-Cloning Theorem',
    type: 'concept',
    shortDef: 'Quantum physics principle: arbitrary quantum states cannot be perfectly copied.',
    fullDef: 'A fundamental result in quantum mechanics proving that no process can create an identical copy of an arbitrary unknown quantum state. Applied to QIF, this means quantum-level neural signatures are physically uncloneable, providing a theoretical foundation for biometric uniqueness at the deepest level.',
    relatedTerms: ['quantum-indeterminacy', 'bell-states'],
    tags: ['concept', 'quantum'],
  },
  {
    id: 'decoherence',
    term: 'Decoherence',
    type: 'concept',
    shortDef: 'Loss of quantum properties as systems interact with their environment.',
    fullDef: 'The process by which quantum superpositions collapse into classical states through environmental interaction. In the QIF context, decoherence at the electrode-tissue boundary (I0) is a key factor: the rate at which quantum neural signals transition to classical measurements defines the security properties of the interface.',
    relatedTerms: ['quantum-indeterminacy', 'neural-interface'],
    tags: ['concept', 'quantum'],
  },
  {
    id: 'post-quantum-cryptography',
    term: 'Post-Quantum Cryptography',
    type: 'concept',
    shortDef: 'Cryptographic algorithms resistant to quantum computer attacks.',
    fullDef: 'Neural data has 50+ year lifespans, making it vulnerable to Harvest-Now-Decrypt-Later (HNDL) attacks where adversaries collect encrypted neural data today and decrypt it when quantum computers mature. NSP uses post-quantum algorithms (Kyber, Dilithium, SPHINCS+) to protect against this threat.',
    relatedTerms: ['nsp', 'hndl-threat'],
    tags: ['concept', 'cryptography'],
  },
  {
    id: 'hndl-threat',
    term: 'HNDL (Harvest-Now-Decrypt-Later)',
    type: 'attack',
    shortDef: 'Adversaries collect encrypted data now to decrypt with future quantum computers.',
    fullDef: 'A strategic attack where adversaries intercept and store encrypted neural data transmissions, waiting for quantum computing capabilities that can break current encryption. Neural data is especially vulnerable because it retains personal significance for decades, making even historical brain recordings valuable targets.',
    relatedTerms: ['post-quantum-cryptography', 'nsp'],
    tags: ['attack', 'quantum'],
  },

  // === Attack Types ===
  {
    id: 'neural-ransomware',
    term: 'Neural Ransomware',
    type: 'attack',
    shortDef: 'Holding neural function hostage by compromising BCI device control.',
    fullDef: 'An attack where an adversary gains control of an implanted BCI and threatens to disable, alter, or weaponize it unless demands are met. Unlike traditional ransomware targeting data, neural ransomware targets biological function itself, making it potentially life-threatening.',
    relatedTerms: ['signal-injection', 'cognitive-liberty'],
    tags: ['attack', 'threat'],
  },
  {
    id: 'signal-injection',
    term: 'Signal Injection',
    type: 'attack',
    shortDef: 'Malicious signals attempting to influence neural activity through a BCI.',
    fullDef: 'An attack where crafted electromagnetic or digital signals are introduced into a BCI to stimulate or manipulate neural tissue. Detected by the coherence metric (phase and gain variance anomalies) and blocked by the neural firewall.',
    relatedTerms: ['coherence-metric', 'neural-ransomware'],
    tags: ['attack', 'threat'],
  },

  // === Frequency Bands ===
  {
    id: 'gamma-band',
    term: 'Gamma Band',
    type: 'concept',
    shortDef: '30-100 Hz oscillations with ~1 cm spatial extent.',
    fullDef: 'High-frequency neural oscillations associated with attention, perception, and consciousness. In the scale-frequency invariant, gamma has the smallest spatial extent (~1 cm) with k approximately 1. Gamma coherence is used in communication-through-coherence theory (Fries, 2005).',
    relatedTerms: ['scale-frequency-invariant', 'theta-band'],
    tags: ['concept', 'signal-processing'],
  },
  {
    id: 'theta-band',
    term: 'Theta Band',
    type: 'concept',
    shortDef: '4-8 Hz oscillations with ~5 cm spatial extent.',
    fullDef: 'Neural oscillations associated with memory encoding, navigation, and hippocampal function. In the scale-frequency invariant, theta spans approximately 5 cm with k approximately 3.',
    relatedTerms: ['scale-frequency-invariant', 'gamma-band'],
    tags: ['concept', 'signal-processing'],
  },

  // === Governance ===
  {
    id: 'unesco-recommendation',
    term: 'UNESCO Recommendation on Ethics of Neurotechnology',
    type: 'principle',
    shortDef: 'First global normative framework for neurotechnology (2025, 194 Member States).',
    fullDef: 'Adopted November 12, 2025 by all 194 UNESCO Member States. Establishes values (human rights, well-being, diversity, sustainability, professional integrity), ethical principles (proportionality, freedom of thought, privacy, protection of children), and policy action areas. QIF implements 15 of 17 elements.',
    relatedTerms: ['cognitive-liberty', 'mental-privacy'],
    tags: ['principle', 'governance'],
  },

  // === DSM-5-TR Diagnostic Mapping (Entry 53) ===
  {
    id: 'neural-impact-chain',
    term: 'Neural Impact Chain (NIC)',
    type: 'concept',
    shortDef: 'The pipeline that connects a BCI technique to a psychiatric diagnosis: Technique \u2192 Band \u2192 Structure \u2192 Function \u2192 NISS + DSM.',
    fullDef: 'A unified model that traces how a BCI technique produces psychiatric risk. The hourglass band tells you which brain structure is targeted. The structure tells you which cognitive function is affected. NISS quantifies the impact (how much), and DSM-5-TR qualifies it (what kind of diagnosis). The band is the Rosetta Stone connecting both systems.',
    relatedTerms: ['hourglass-model', 'niss', 'dsm5-diagnostic-mapping', 'diagnostic-cluster'],
    tags: ['concept', 'clinical', 'tara'],
  },
  {
    id: 'dsm5-diagnostic-mapping',
    term: 'DSM-5-TR Diagnostic Mapping',
    type: 'concept',
    shortDef: 'Maps each BCI technique to the psychiatric diagnoses it could trigger or worsen, using ICD-10-CM codes.',
    fullDef: 'Every TARA technique that touches a neural band (N1\u2013N7 or I0) is mapped to DSM-5-TR diagnoses via the Neural Impact Chain. Primary diagnoses are directly implicated by the technique\'s mechanism; secondary diagnoses are downstream risks. Each mapping includes a confidence level (established, probable, theoretical), risk class (direct, indirect, none), and the neural pathway chain.',
    relatedTerms: ['neural-impact-chain', 'niss-dsm-bridge', 'diagnostic-cluster', 'risk-class'],
    tags: ['concept', 'clinical', 'tara'],
  },
  {
    id: 'niss-dsm-bridge',
    term: 'NISS-DSM Bridge',
    type: 'concept',
    shortDef: 'The link between NISS scores (how bad) and DSM diagnoses (what kind). Each NISS metric predicts a different diagnostic cluster.',
    fullDef: 'Maps NISS metrics to diagnostic risk domains: BI (Biological Impact) \u2192 Motor/Neurocognitive, CG (Cognitive Integrity) \u2192 Cognitive/Psychotic, CV (Consent Violation) \u2192 Mood/Trauma, NP (Neuroplasticity) \u2192 Persistent/Personality, RV (Reversibility) \u2192 Chronicity modifier. This is the quantitative-to-qualitative bridge that makes NISS scores clinically interpretable.',
    relatedTerms: ['niss', 'neural-impact-chain', 'diagnostic-cluster'],
    tags: ['concept', 'clinical', 'metric'],
  },
  {
    id: 'diagnostic-cluster',
    term: 'Diagnostic Cluster',
    type: 'concept',
    shortDef: 'One of five groupings that color the Diagnostic projection: Cognitive/Psychotic, Mood/Trauma, Motor/Neurocognitive, Persistent/Personality, or Non-Diagnostic.',
    fullDef: 'Clusters group DSM-5-TR chapters by shared neural mechanism rather than traditional nosology. Each technique is assigned to the cluster with the highest combined score from band weights and NISS bonuses. Aligned with NIMH\'s Research Domain Criteria (RDoC) approach \u2014 a bottom-up neurobiological taxonomy applied to BCI safety.',
    relatedTerms: ['niss-dsm-bridge', 'dsm5-diagnostic-mapping'],
    tags: ['concept', 'clinical', 'tara'],
  },
  {
    id: 'risk-class',
    term: 'Risk Class (DSM)',
    type: 'concept',
    shortDef: 'Whether a BCI technique can directly trigger a diagnosis, indirectly contribute, or has no diagnostic relevance.',
    fullDef: 'Three levels: "direct" means the technique\'s mechanism can trigger or worsen the mapped diagnosis (e.g., limbic disruption \u2192 depression). "indirect" means downstream or secondary risk. "none" applies to silicon-only techniques with no neural pathway. Determined by band membership and dual-use classification.',
    relatedTerms: ['dsm5-diagnostic-mapping', 'diagnostic-cluster'],
    tags: ['concept', 'clinical', 'tara'],
  },
] as const;

/** Get terms sorted alphabetically */
export function getSortedTerms() {
  return [...GLOSSARY_TERMS].sort((a, b) => a.term.localeCompare(b.term));
}

/** Get unique first letters for A-Z index */
export function getAlphabetIndex() {
  const letters = new Set(GLOSSARY_TERMS.map(t => t.term[0].toUpperCase()));
  return [...letters].sort();
}

/** Get terms by type */
export function getTermsByType(type: string) {
  return GLOSSARY_TERMS.filter(t => t.type === type);
}
