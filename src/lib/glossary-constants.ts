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
    fullDef: 'Developed by Qinnovate as the first CVSS v4.0 extension for neural security, following FIRST.org\'s extension framework (User Guide §3.11). Weights human impact at 70% and system exploitability at 30%. Adds five neural-specific dimensions CVSS structurally cannot express: Biological Impact, Cognitive Integrity, Reversibility, Violation of Consent, and Neuroplasticity. All 71 TARA techniques mapped to CVSS v4.0 base vectors — 94.4% require NISS for full-fidelity scoring. Severity: Critical (9.0+), High (7.0-8.9), Medium (4.0-6.9), Low (0.1-3.9).',
    formula: 'BaseScore = 0.3 x Exploitability + 0.7 x Impact',
    relatedTerms: ['locus-taxonomy', 'tara'],
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
    fullDef: 'A compression engine that compiles HTML into Staves bytecode, achieving 65-90% size reduction. Makes post-quantum encryption cost-free above 30 KB by reducing payload size before encryption. Runemate Forge is the compiler tool.',
    relatedTerms: ['nsp', 'staves-bytecode'],
    href: '/runemate/',
    tags: ['component', 'core'],
  },
  {
    id: 'tara',
    term: 'TARA (Therapeutic Atlas of Risks and Applications)',
    type: 'component',
    shortDef: 'Interactive threat registrar mapping BCI attack vectors across four domains.',
    fullDef: 'A comprehensive threat registry platform organizing BCI threats across Security, Clinical, Governance, and Engineering domains. Contains technique entries scored with NISS and classified using the QIF Locus Taxonomy. Provides filterable, searchable access to the full QIF threat model.',
    relatedTerms: ['niss', 'locus-taxonomy'],
    href: '/TARA/',
    tags: ['component', 'original'],
  },
  {
    id: 'locus-taxonomy',
    term: 'QIF Locus Taxonomy',
    type: 'architecture',
    shortDef: 'First threat classification system purpose-built for neural interfaces.',
    fullDef: 'Developed by Qinnovate, the Locus Taxonomy classifies BCI attacks by the anatomical or functional locus where the attack operates. Uses a QIF-[Domain].[Action] format across multiple domains (Neural, Cognitive, Physiological, Data, BCI System, Model, Energy) mapping to distinct tactics.',
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
    shortDef: 'Right to keep neural data and mental states confidential.',
    fullDef: 'Neural data is not ordinary data. It is the substrate of thought itself. Mental privacy protects against unauthorized brain reading, thought surveillance, and neural data harvesting. QIF implements this through transport variance detection, encryption, and the BCI Anonymizer.',
    relatedTerms: ['cognitive-liberty', 'mental-integrity'],
    tags: ['principle', 'neuroethics'],
  },
  {
    id: 'mental-integrity',
    term: 'Mental Integrity',
    type: 'principle',
    shortDef: 'Right to protection from unauthorized alteration of neural function.',
    fullDef: 'Protection from neural hacking, cognitive manipulation, and brain malware. QIF enforces this through amplitude bounds, rate limiting, and the coherence metric, which detects signals that could alter neural function without authorization.',
    relatedTerms: ['cognitive-liberty', 'psychological-continuity'],
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
    shortDef: 'Right to know which thoughts are genuinely one\'s own.',
    fullDef: 'Protection from implanted thoughts, covert influence, and confusion of agency. QIF\'s coherence metric provides a quantitative basis for authenticity assessment: signals that do not match expected biological patterns may not be authentic to the user.',
    relatedTerms: ['coherence-metric', 'cognitive-liberty'],
    tags: ['principle', 'neuroethics'],
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
