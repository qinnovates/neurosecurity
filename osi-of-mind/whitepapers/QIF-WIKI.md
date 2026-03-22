# QIF Wiki — Terms, Equations, and Concepts

> **A running glossary of every term, equation, and concept in the QIF framework.**
> Each entry has a short description here; full details in the linked section below.
> **Last updated: 2026-02-06**

---

## Quick Reference Table

| Term | Type | One-Line Description | Details |
|------|------|---------------------|---------|
| **Cₛ (Coherence Metric)** | Equation | Signal trustworthiness score: e^(−(σ²ᵩ + σ²τ + σ²ᵧ)) | [Full details](#coherence-metric) |
| **σ²ᵩ (Phase Variance)** | Variable | Timing jitter of neural signals relative to reference oscillation | [Full details](#phase-variance) |
| **σ²τ (Transport Variance)** | Variable | Pathway integrity — probability of successful signal transmission | [Full details](#transport-variance) |
| **σ²ᵧ (Gain Variance)** | Variable | Amplitude stability relative to expected baseline | [Full details](#gain-variance) |
| **f × S ≈ k (Scale-Frequency)** | Relationship | Conduction velocity = frequency × spatial wavelength | [Full details](#scale-frequency-relationship) |
| **QI Equation (Candidate 1)** | Equation | Additive/engineering form of unified quantum-classical security | [Full details](#qi-equation-candidate-1) |
| **QI Equation (Candidate 2)** | Equation | Tensor/theoretical form using Hilbert space operators | [Full details](#qi-equation-candidate-2) |
| **Heisenberg Uncertainty** | Principle | ΔxΔp ≥ ℏ/2 — fundamental limit on simultaneous knowledge | [Full details](#heisenberg-uncertainty-principle) |
| **Robertson-Schrödinger** | Equation | Generalized uncertainty: σ²_A·σ²_B ≥ \|⟨[A,B]⟩/2i\|² + covariance | [Full details](#robertson-schrödinger-relation) |
| **Von Neumann Entropy** | Equation | S(ρ) = −Tr(ρ ln ρ) — quantum uncertainty in mixed states | [Full details](#von-neumann-entropy) |
| **Born Rule** | Principle | P(x) = \|ψ(x)\|² — probability from wave function | [Full details](#born-rule) |
| **No-Cloning Theorem** | Theorem | Impossible to copy an arbitrary unknown quantum state | [Full details](#no-cloning-theorem) |
| **Bell States** | Equation | Maximally entangled qubit pairs: \|Φ⁺⟩ = (1/√2)(\|00⟩+\|11⟩) | [Full details](#bell-states) |
| **Quantum Tunneling** | Phenomenon | Particles passing through classically forbidden barriers | [Full details](#quantum-tunneling) |
| **Tunneling Coefficient** | Equation | T ≈ e^(−2κd) — transmission probability through barrier | [Full details](#tunneling-coefficient) |
| **WKB Approximation** | Method | Semiclassical tunneling action integral through varying barriers | [Full details](#wkb-approximation) |
| **Decoherence** | Process | Loss of quantum behavior through environmental interaction | [Full details](#decoherence) |
| **τ_D (Decoherence Time)** | Parameter | Time for quantum → classical transition; disputed in neural tissue | [Full details](#decoherence-time) |
| **Quantum Zeno Effect** | Phenomenon | Frequent measurement freezes quantum evolution | [Full details](#quantum-zeno-effect) |
| **Entanglement** | Phenomenon | Non-classical correlations between quantum systems | [Full details](#entanglement) |
| **Fisher's Posner Molecules** | Hypothesis | Calcium phosphate nanoclusters may sustain entanglement in brain | [Full details](#fishers-posner-molecules) |
| **Davydov Solitons** | Phenomenon | Quantum quasiparticles propagating along protein helices | [Full details](#davydov-solitons) |
| **Shor's Algorithm** | Algorithm | O(n³) quantum factoring — threatens RSA | [Full details](#shors-algorithm) |
| **Grover's Algorithm** | Algorithm | O(√N) quantum search — threatens symmetric crypto | [Full details](#grovers-algorithm) |
| **QKD (BB84, E91)** | Protocols | Quantum key distribution using photon polarization or entanglement | [Full details](#quantum-key-distribution) |
| **Hodgkin-Huxley** | Equation | Action potential model: Cₘ(dV/dt) = −Σgᵢmᵖhᵍ(V−Eᵢ)+I_ext | [Full details](#hodgkin-huxley-model) |
| **Nernst Equation** | Equation | Ion equilibrium potential: E = (RT/zF)ln([out]/[in]) | [Full details](#nernst-equation) |
| **Nernst-Planck** | Equation | Ion flux: J = −D∇c − (zF/RT)Dc∇V | [Full details](#nernst-planck-equation) |
| **Shannon Capacity** | Equation | C = B log₂(1 + S/N) — channel information limit | [Full details](#shannon-channel-capacity) |
| **Boltzmann Distribution** | Equation | P ∝ e^(−E/kT) — thermal occupation probability | [Full details](#boltzmann-distribution) |
| **Fourier Transform** | Equation | X(f) = ∫x(t)·e^(−i2πft)dt — time-to-frequency decomposition | [Full details](#fourier-transform) |
| **Cole-Cole Dispersion** | Equation | Frequency-dependent permittivity of biological tissue | [Full details](#cole-cole-dispersion) |
| **Quasi-static Poisson** | Equation | ∇·(σ∇V) = Iₛ — electric potential in conductive tissue | [Full details](#quasi-static-poisson-equation) |
| **PLV (Phase Locking Value)** | Measure | Inter-signal phase coherence (Lachaux 1999) | [Full details](#phase-locking-value) |
| **CTC (Communication Through Coherence)** | Theory | Phase-aligned oscillations enable selective neural communication (Fries) | [Full details](#communication-through-coherence) |
| **STDP** | Mechanism | Spike-Timing Dependent Plasticity — ±10-20 ms learning window | [Full details](#spike-timing-dependent-plasticity) |
| **Quantum Biometric** | Concept (novel) | Ion channel tunneling profile as unforgeable identity signature | [Full details](#quantum-biometric) |
| **Zeno-BCI Stabilization** | Hypothesis (novel) | High-frequency BCI sampling may stabilize quantum states | [Full details](#zeno-bci-stabilization) |
| **QIF Layers (v2.0)** | Architecture | L1-7: OSI networking, L8-14: Neural extension | [Full details](#qif-layer-architecture) |
| **QI Unified Equation** | Equation | Master equation: QI(b,t) = e^(-Σ(b,t)), unifying Candidates 1 and 2 | [Full details](#qi-unified-equation) |
| **Σ (Anomaly Score)** | Variable | Total anomaly: Σ = Σc + Σq (classical + quantum) | [Full details](#anomaly-score) |
| **Dsf (Scale-Frequency Term)** | Variable | Physical plausibility check: (ln(f·L/v_expected))² | [Full details](#scale-frequency-term-dsf) |
| **L = v/f (Unified Wave)** | Equation | Length of one wave in any medium -- unifies λ and S | [Full details](#unified-wave-equation) |
| **Dspec (Spectral Consistency)** | Variable | Consumer substitute for Dsf -- KL divergence of power spectrum | [Full details](#spectral-consistency-dspec) |
| **QI Consumer** | Equation | Simplified 3-term QI for consumer BCIs | [Full details](#qi-consumer-equation) |
| **NSP (Neural Sensory Protocol)** | Protocol | Open post-quantum security protocol wrapping BCI data | [Full details](#neural-sensory-protocol) |
| **Black Hole Security Principle** | Principle | Encrypted neural data indistinguishable from noise (Hawking radiation analog) | [Full details](#black-hole-security-principle) |
| **HNDL (Harvest Now Decrypt Later)** | Threat | Nation-states recording encrypted BCI traffic for future quantum decryption | [Full details](#harvest-now-decrypt-later) |
| **ML-KEM (Kyber)** | Algorithm | Post-quantum key encapsulation (FIPS 203) | [Full details](#ml-kem) |
| **ML-DSA (Dilithium)** | Algorithm | Post-quantum digital signatures (FIPS 204) | [Full details](#ml-dsa) |
| **SPHINCS+ (SLH-DSA)** | Algorithm | Hash-based post-quantum signatures (FIPS 205) -- most conservative | [Full details](#sphincs-plus) |
| **Hybrid Key Exchange** | Protocol | KDF(ECDH_secret \|\| ML-KEM_secret) -- secure if either holds | [Full details](#hybrid-key-exchange) |
| **Attack Coupling Mechanisms** | Classification | 5 types: Direct, Harmonic, Envelope Modulation, Temporal Interference, Intermodulation | [Full details](#attack-coupling-mechanisms) |
| **Unified Threat Registry** | Registry | 60 techniques, 11 tactics, MITRE-compatible (T2000+), 80% cross-referenced | [Full details](#unified-threat-registry) |
| **Resonance Shield** | Concept | Active EM cancellation at device boundary -- defense + MRI compatibility | [Full details](#resonance-shield) |
| **Scrambling Bound** | Equation | t* ~ (β/2π)·ln(S) -- encryption satisfies black hole scrambling speed | [Full details](#scrambling-bound) |
| **Page Curve** | Concept | Key exchange mirrors black hole information recovery curve | [Full details](#page-curve) |
| **Holographic Principle** | Principle | S_max = A/(4·l_P²) -- volume info encoded on boundary surface | [Full details](#holographic-principle) |
| **Landauer's Principle** | Principle | E_min = kT·ln(2) per bit erasure -- fundamental energy limit | [Full details](#landauers-principle) |
| **Bekenstein-Hawking Entropy** | Equation | S_BH = k_B·A/(4·l_P²) -- entropy proportional to area | [Full details](#bekenstein-hawking-entropy) |
| **QIF Hourglass v3.1** | Architecture | 7-band symmetric (3-1-3): N3-N2-N1-I0-S1-S2-S3 | [Full details](#qif-layer-architecture) |

---

## Full Details

### Coherence Metric

**Equation:** `Cₛ = e^(−(σ²ᵩ + σ²τ + σ²ᵧ))`

**What it does:** Quantifies how "trustworthy" a neural signal is by measuring three dimensions of variance — timing, pathway integrity, and amplitude stability. Score ranges from 0 (untrustworthy) to 1 (perfectly coherent).

**How QIF uses it:** Core of the classical BCI security pipeline. Every signal passing through the neural firewall (L8) gets a coherence score. The thresholds (>0.6 accept, 0.3-0.6 flag, <0.3 reject) determine whether the signal reaches the brain.

**Mathematical form:** Boltzmann/Gaussian likelihood design (NOT Shannon entropy — this was a corrected error).

**Status:** Proposed (QIF contribution). Theoretically motivated, not yet empirically validated on live BCI data.

**References:** QIF-TRUTH.md Section 3.1

---

### Phase Variance

**Symbol:** σ²ᵩ

**Formal definition:** `σ²ᵩ = (1/n) Σᵢ (φᵢ − φ̄)²`

Where φᵢ = 2π·f_ref·tᵢ (mod 2π) — phase angle at arrival time relative to reference frequency.

**What it measures:** How consistently a signal arrives "on beat" with the brain's rhythms. Like a drummer who's slightly off tempo — the more off, the higher the variance, the less the brain trusts it.

**How QIF uses it:** First line of defense. Injected signals from an attacker will almost certainly have wrong phase timing relative to the brain's natural oscillations. High phase variance → signal rejected.

**Biological basis:** Fries' Communication Through Coherence (2005/2015); Phase Locking Value (Lachaux 1999); STDP windows of ±10-20 ms (Markram 1997, Bi & Poo 1998).

---

### Transport Variance

**Symbol:** σ²τ

**Formal definition:** `σ²τ = −Σᵢ ln(pᵢ)`

Where pᵢ = probability of successful transmission at pathway stage i.

**What it measures:** How reliably a signal travels from origin to destination. Like a game of telephone — every relay point has a chance of garbling the message.

**How QIF uses it:** Signals that bypass biological relay points (BCI-injected signals) have artificially LOW transport variance — they're "too clean." This is a detection feature: a signal that arrives with zero transmission noise is suspicious.

**Important caveat:** Synaptic release probability in vivo is ~0.1-0.5 for typical cortical synapses (Borst 2010). The range 0.7-0.95 only applies to specialized high-reliability synapses.

---

### Gain Variance

**Symbol:** σ²ᵧ

**Formal definition:** `σ²ᵧ = (1/n) Σᵢ ((Aᵢ − Ā) / Ā)²`

**What it measures:** How stable a signal's volume (amplitude) is compared to what's expected. Like someone who normally speaks at conversation volume suddenly whispering or shouting.

**How QIF uses it:** Amplitude overflow attacks (malicious stimulation at dangerous power levels) are caught here. Also detects slow-drift manipulation where an attacker gradually shifts amplitude over time.

**Biological basis:** Synaptic scaling (Turrigiano 2008), intrinsic plasticity, neuromodulation.

---

### Scale-Frequency Relationship

**Equation:** `v = f × λ` (conduction velocity = frequency × spatial wavelength)

**What it means:** Fast brain rhythms are local. Slow brain rhythms are global. This isn't a coincidence — it's constrained by how fast electrical signals travel through axons.

**How QIF uses it:** Defines what's physically possible at each layer. You can't have fast whole-brain processing (the wiring is too slow). You can't have slow local processing (evolution eliminates inefficiency). This constrains what attacks are possible at each timescale.

**Validated values:**

| Band | Frequency | Coherent Extent | Conduction Velocity |
|------|-----------|----------------|-------------------|
| Gamma | 40 Hz | ~1 cm | ~0.3 m/s (intracortical) |
| Theta | 6 Hz | ~5 cm | ~3-5 m/s (corticocortical) |
| Alpha | 10 Hz | ~15 cm | ~7 m/s (thalamocortical) |
| Delta | 1 Hz | ~18 cm | ~7 m/s (global) |

**Key references:** Buzsáki & Draguhn 2004 (Science), Nunez 2000, Nunez & Srinivasan 2006.

**DEPRECATED:** k ≈ 10⁶ is WRONG. The "constant" is the conduction velocity (~0.1–9 m/s depending on fiber type).

---

### QI Equation Candidate 1

**Name:** Additive/Engineering Form

**Equation:**
```
QI(t) = α·Cclass + β·(1 − ΓD(t))·[Qi + δ·Qentangle] − γ·Qtunnel
```

**What it does:** Adds classical BCI security, quantum indeterminacy protections, entanglement-based security, and subtracts tunneling vulnerabilities. Decoherence gradually erodes quantum terms over time.

**How QIF uses it:** The "Swiss Army knife" — each term is independent, visible, and separately computable. Good for engineering implementation.

**Status:** Under development. Requires experimental calibration of scaling coefficients.

---

### QI Equation Candidate 2

**Name:** Tensor/Theoretical Form

**Equation:**
```
QI = Cclass ⊗ e^(−Squantum)
where Squantum = SvN(ρ) + λ·Φtunnel − μ·E(ρAB)
```

**What it does:** Classical and quantum domains combined via tensor product (the mathematically correct way to combine different Hilbert spaces). The quantum factor is Boltzmann-like — as entropy increases (decoherence), security decreases exponentially.

**How QIF uses it:** The "single blade" — mathematically rigorous, entanglement emerges naturally, decoherence falls out of entropy evolution.

**Status:** Under development. Requires quantum state tomography for full implementation.

---

### Heisenberg Uncertainty Principle

**Equation:** `ΔxΔp ≥ ℏ/2`

**What it means:** You can never simultaneously know both the exact position AND exact momentum of a particle. Measuring one more precisely forces the other to become less certain. This is not a limitation of instruments — it's a fundamental property of reality.

**How QIF uses it:** Foundation of QKD security. An eavesdropper measuring quantum key bits unavoidably disturbs them, revealing their presence. Also one manifestation of the broader quantum indeterminacy (the Qi variable in the QI equation).

**Status:** Established (1927). Experimentally verified to extraordinary precision.

---

### Robertson-Schrödinger Relation

**Equation:** `σ²_A · σ²_B ≥ |⟨[A,B]⟩/2i|² + |⟨{A,B}⟩/2 − ⟨A⟩⟨B⟩|²`

**What it means:** The generalized uncertainty principle for any two quantum observables. Heisenberg is a special case. The second term (Schrödinger's addition) captures correlations between measurements.

**How QIF uses it:** For qubits (two-level systems), this is an EXACT EQUALITY — meaning we can compute the indeterminacy precisely, not just bound it. This gives QIF exact uncertainty quantification for qubit-based protocols.

**Key discovery:** Kimura et al. (2025) showed this extends to even stronger relations with genuinely quantum trade-off terms.

**Status:** Established.

---

### Von Neumann Entropy

**Equation:** `S(ρ) = −Tr(ρ ln ρ)`

**What it means:** The quantum generalization of Shannon entropy. Measures how "mixed" (uncertain) a quantum state is. Pure state = 0 entropy. Maximally mixed = maximum entropy.

**How QIF uses it:** Core of the Qi variable and Candidate 2's quantum security factor. As a BCI system decoheres, ρ evolves from pure to mixed, S increases, and e^(−S) decreases — security degrades smoothly.

**Security insight:** Violates classical monotonicity — a subsystem can have MORE entropy than the whole (signature of entanglement). An eavesdropper sees maximal uncertainty while the legitimate user-BCI system has zero entropy.

**Status:** Established.

---

### Born Rule

**Equation:** `P(x) = |ψ(x)|²`

**What it means:** The probability of finding a particle at position x equals the squared magnitude of the wave function there. This is how quantum mechanics connects to measurable reality.

**How QIF uses it:** Assumed as foundational. If the Born rule is ever modified by a deeper theory, the entire probability structure of the QI equation would change. Masanes et al. (2019) showed it's the ONLY consistent probability rule for quantum mechanics.

**Status:** Established. Safe to assume (experimentally validated to extreme precision).

---

### No-Cloning Theorem

**Statement:** It is impossible to create an identical copy of an arbitrary unknown quantum state.

**What it means:** Unlike classical information (which can be copy-pasted freely), quantum information cannot be duplicated. Any attempt to copy it unavoidably changes the original.

**How QIF uses it:** Guarantees that quantum-secured BCI channels cannot be wiretapped without detection. An attacker cannot copy the quantum key or quantum biometric without disturbing it. Also applies to the quantum tunneling biometric — an attacker cannot clone a person's quantum fingerprint.

**Status:** Established (Wootters, Zurek, Dieks 1982).

---

### Bell States

**Equations:**
```
|Φ⁺⟩ = (1/√2)(|00⟩ + |11⟩)
|Φ⁻⟩ = (1/√2)(|00⟩ − |11⟩)
|Ψ⁺⟩ = (1/√2)(|01⟩ + |10⟩)
|Ψ⁻⟩ = (1/√2)(|01⟩ − |10⟩)
```

**What they are:** The four maximally entangled states of two qubits. Measuring one qubit instantly determines the other, regardless of distance.

**How QIF uses it:** Foundation of E91 QKD protocol. Bell inequality violations confirm the channel is secure (no eavesdropper). Also the Qentangle term in Candidate 1.

**Status:** Established.

---

### Quantum Tunneling

**What it is:** A quantum particle passes through an energy barrier that it classically shouldn't be able to cross. Like a ball rolling through a hill instead of over it.

**How QIF uses it (dual nature):**
- **As vulnerability:** Ions tunneling through closed voltage-gated channels could be exploited by attackers to manipulate neural signaling below classical detection thresholds.
- **As authentication:** The tunneling profile through a person's ion channels is genetically determined and quantum-mechanically unforgeable — a potential quantum biometric.

**Biological relevance:** Ion tunneling through closed channels (MDPI 2019), Davydov soliton-triggered synaptic release via SNARE proteins, Josephson junctions in quantum computers.

---

### Tunneling Coefficient

**Equation:** `T ≈ e^(−2κd)` where `κ = √(2m(V₀−E))/ℏ`

**What it means:** The probability of a particle tunneling through a barrier depends exponentially on the barrier width (d) and height (V₀−E). Thicker or taller barriers = less tunneling.

**How QIF uses it:** The Qtunnel term. For BCI security: thicker barriers at the electrode-tissue interface = less vulnerability. For quantum biometric: the unique κ and d values per person's ion channels = identity signature.

---

### WKB Approximation

**Equation:** `Φtunnel = ∫₀ᵈ √(2m(V₀(x)−E))/ℏ dx`

**What it means:** The Wentzel-Kramers-Brillouin method for computing tunneling probability through a barrier that varies in height across its width (more realistic than a uniform barrier).

**How QIF uses it:** Used in Candidate 2's Squantum term. The tunneling action integral captures the full barrier profile, not just its average height.

---

### Decoherence

**What it is:** The process by which a quantum system loses its quantum behavior through interaction with its environment. The quantum "leaks away" into the surroundings.

**How QIF uses it:** The ΓD(t) = 1 − e^(−t/τD) term in Candidate 1. At t=0 (no decoherence), full quantum security. At t→∞, only classical security remains. Decoherence is treated as a continuous spectrum, not a binary switch.

**Key insight:** Decoherence is the dial between quantum and classical. The QI equation handles this by making τD a tunable parameter.

---

### Decoherence Time

**Symbol:** τ_D

**What it is:** How long quantum coherence survives in a given system before environmental noise destroys it.

**The dispute:**

| Estimate | τ_D | Source | Implication |
|----------|-----|--------|-------------|
| Tegmark (2000) | ~10⁻¹³ s | Theoretical calculation | No quantum effects relevant to BCI |
| Recent quantum biology | ~10⁻⁵ s | Experimental hints | Narrow window exists |
| Fisher (2015) | Hours | Posner molecule nuclear spins | Quantum cognition possible |

**How QIF uses it:** Parametric — τD is a free variable. The framework works at ANY timescale. As science resolves the debate, plug in the measured value.

---

### Quantum Zeno Effect

**What it is:** Frequent measurement of a quantum system prevents it from evolving. The watched pot never boils — literally, in quantum mechanics.

**How QIF uses it:** BCI systems sample at 1000+ Hz. If neural quantum coherence lasts ~10 μs, then ~10 measurements occur per coherence window. This is potentially in the Zeno regime — meaning the BCI's own sampling might stabilize quantum states at the electrode interface.

**Status:** Established phenomenon. The BCI application is a novel QIF hypothesis.

---

### Entanglement

**What it is:** A quantum correlation between two particles such that measuring one instantaneously determines the state of the other, regardless of distance. Not communication — but correlation stronger than any classical mechanism can produce.

**How QIF uses it:** The Qentangle term. Security resource: entangled BCI channels are provably secure against eavesdropping (Bell inequality violations detect interception). Framework models both biological entanglement (if it exists) and artificially supplied entanglement from quantum hardware.

---

### Fisher's Posner Molecules

**What it is:** Hypothesis by Matthew Fisher (2015) that calcium phosphate nanoclusters (Posner molecules, Ca₉(PO₄)₆) in the brain can sustain quantum entanglement for hours via nuclear spin states of phosphorus-31 atoms.

**How QIF uses it:** If confirmed, this would mean the brain natively supports quantum entanglement — the biological entanglement term in QIF would be non-zero. The framework includes this as a switchable parameter: defaults to zero, activates if evidence confirms.

**Status:** Highly speculative. No experimental confirmation of biologically functional entanglement in neural tissue. Fisher's lab at UCSB is conducting experiments.

---

### Davydov Solitons

**What they are:** Quantum quasiparticles that propagate along protein alpha-helices. They can trigger synaptic vesicle release via quantum tunneling through SNARE protein complexes.

**How QIF uses it:** Identified as a novel attack vector. An attacker could theoretically generate Davydov solitons via precisely tuned terahertz radiation, triggering false synaptic events invisible to classical detection. The tunneling term in the QI equation should model this.

**Status:** Theoretical. Described in literature (ScienceDirect, Walker 1977) but not experimentally demonstrated as an attack mechanism.

---

### Shor's Algorithm

**Complexity:** O(n³) with schoolbook multiplication; O(n² log n log log n) with fast multiplication.

**What it does:** Factors large integers exponentially faster than any classical method. Breaks RSA, DSA, and elliptic curve cryptography.

**How QIF uses it:** Defines the quantum threat timeline for BCI communication security. RSA-2048 falls in ~8 hours / 20M qubits (Gidney 2019) or <1 week / <1M qubits (Gidney 2025). QIF mandates post-quantum cryptography (CRYSTALS-Kyber, Dilithium) for all BCI channels.

---

### Grover's Algorithm

**Complexity:** O(√N) — provably optimal (Bennett et al. 1997, Zalka 1999).

**What it does:** Searches unstructured databases quadratically faster than classical brute force. Theoretically halves symmetric key effective length.

**How QIF uses it:** AES-256 theoretically becomes AES-128 in brute-force resistance. However, NIST considers Grover's practically infeasible due to serial computation constraints. QIF recommends AES-256 as quantum-resistant for BCI.

---

### Quantum Key Distribution

**Protocols:** BB84 (photon polarization), E91 (entanglement-based).

**What they do:** Allow two parties to share a secret key with information-theoretic security guaranteed by quantum mechanics. Any eavesdropper is detectable via disturbance to quantum states.

**How QIF uses it:** Proposed for securing BCI-to-external communication channels. Particularly relevant at L6 (Presentation) and L8 (Neural Gateway) layers. Constrained by BCI power budgets (~25 mW for Neuralink N1).

---

### Hodgkin-Huxley Model

**Equation:** `Cₘ(dV/dt) = −Σ gᵢmᵖhᵍ(V − Eᵢ) + I_ext`

**What it does:** Models the electrical behavior of a neuron — how ion channels open and close to generate action potentials. The gold standard for what "authentic" neural signals look like.

**How QIF uses it:** Defines the baseline against which the coherence metric operates. If a BCI-injected signal doesn't match the Hodgkin-Huxley dynamics the brain expects, it fails coherence scoring.

**Status:** Established (Nobel Prize 1963).

---

### Nernst Equation

**Equation:** `E = (RT/zF) ln([ion]_out/[ion]_in)`

**What it does:** Calculates the equilibrium electrical potential across a cell membrane for a specific ion. Tells you the voltage where a given ion stops flowing.

**How QIF uses it:** Defines the reversal potentials (Na⁺ ≈ +60 mV, K⁺ ≈ −90 mV, etc.) that the coherence metric uses to validate signal amplitude ranges.

**Status:** Established (electrochemistry).

---

### Nernst-Planck Equation

**Equation:** `J = −D∇c − (zF/RT)Dc∇V`

**What it does:** Describes how ions move through tissue under both concentration gradients and electric fields. Combines diffusion and electrostatic drift.

**How QIF uses it:** Models the actual current carriers (Na⁺, K⁺, Ca²⁺, Cl⁻) in neural tissue. Relevant to understanding how BCI stimulation signals propagate through the tissue surrounding electrodes.

**Status:** Established.

---

### Shannon Channel Capacity

**Equation:** `C = B log₂(1 + S/N)`

**What it does:** The maximum rate of reliable information transmission through a noisy channel. Bandwidth × log of signal-to-noise ratio.

**How QIF uses it:** Defines theoretical limits on BCI data rates. Neural systems operate near channel capacity at every hierarchy level. Also: coherence as negative entropy connects to Shannon's framework.

**Status:** Established (Shannon 1948).

---

### Boltzmann Distribution

**Equation:** `P ∝ e^(−E/kT)`

**What it means:** The probability of a system being in a state decreases exponentially with the energy of that state. Higher energy = less likely.

**How QIF uses it:** The coherence metric Cₛ = e^(−σ²) has the same form — variance plays the role of energy. Candidate 2's quantum security factor e^(−Squantum) is explicitly Boltzmann-like. Also governs ion channel gating probability and the thermal noise floor.

**Status:** Established (statistical mechanics).

---

### Fourier Transform

**Equation:** `X(f) = ∫x(t)·e^(−i2πft)dt`

**What it does:** Decomposes any signal into its constituent frequencies. The mathematical tool that converts neural time-series into frequency spectra for coherence analysis.

**How QIF uses it:** Fundamental to computing phase variance σ²ᵩ — you must decompose the signal into frequency components to measure phase alignment. Also used for spectral anomaly detection.

**Status:** Established (mathematical identity).

---

### Cole-Cole Dispersion

**Equation:** `ε*(ω) = ε∞ + Σᵢ Δεᵢ/(1+(jωτᵢ)^(1−αᵢ)) + σₛ/(jωε₀)`

**What it does:** Models how the electrical properties (permittivity, conductivity) of biological tissue change with frequency. Brain tissue does NOT have constant electrical properties — they vary dramatically across the frequency range.

**How QIF uses it:** Critical correction: the scale-frequency "constant" k is NOT constant because tissue is dispersive. Signal velocity depends on frequency: v(f) = c/√(εᵣ(f)). This means the f×S relationship needs frequency-dependent correction for quantitative use.

**Status:** Established (Gabriel et al. 1996).

---

### Quasi-static Poisson Equation

**Equation:** `∇·(σ∇V) = Iₛ`

**What it does:** Describes how electric potential distributes through conductive tissue when current is injected. NOT the wave equation — at BCI frequencies, wavelength >> brain size, so fields establish "instantaneously."

**How QIF uses it:** The correct physics model for BCI field distribution. Replaces the incorrect "wavefront propagation" model that was in earlier versions. Uses anisotropic conductivity tensor (white matter σ‖ ≈ 0.65 S/m, σ⊥ ≈ 0.065 S/m, 10:1 ratio).

**Status:** Established (Nunez & Srinivasan 2006).

---

### Phase Locking Value

**Abbreviation:** PLV

**What it is:** A measure of how consistently two neural signals maintain the same phase difference over time. Introduced by Lachaux et al. (1999). Ranges from 0 (random) to 1 (perfectly locked).

**How QIF uses it:** The empirical measurement method for phase variance σ²ᵩ. Circular variance = 1 − PLV. Typical values in real EEG: 0.2-0.8 for meaningful signals.

---

### Communication Through Coherence

**Abbreviation:** CTC

**What it is:** Theory by Pascal Fries (2005, updated 2015) that gamma-band synchronization between neuronal groups enables selective communication. Groups in phase can talk; groups out of phase are filtered out.

**How QIF uses it:** Theoretical backbone for why phase coherence matters for security. A BCI signal not phase-locked to the brain's gamma rhythm won't be "heard" by downstream neurons — nature's own firewall.

---

### Spike-Timing Dependent Plasticity

**Abbreviation:** STDP

**What it is:** The rule by which synapses strengthen or weaken based on the precise timing of pre- and post-synaptic spikes. Pre-before-post within 0-20 ms → LTP (strengthening). Post-before-pre → LTD (weakening).

**How QIF uses it:** Defines the biological phase tolerance windows for each frequency band. A BCI signal arriving outside the STDP window won't trigger plasticity — providing a natural defense against malicious long-term modification.

**Key references:** Markram et al. 1997, Bi & Poo 1998.

---

### Quantum Biometric

**Status:** Novel QIF concept — no prior literature

**What it is:** The hypothesis that quantum tunneling profiles through a person's ion channels could serve as an unforgeable biometric identifier. The tunneling coefficient T = e^(−2κd) depends on barrier height and width, which are determined by:
- Ion channel protein conformation (genetically determined)
- Membrane lipid composition (partially genetic)
- Local electromagnetic environment (characterizable)

**Why it's unforgeable:**
1. Depends on quantum tunneling (cannot be classically simulated with full fidelity)
2. Depends on individual biology (unique per person)
3. Cannot be cloned (no-cloning theorem)

**How QIF uses it:** The positive component of the dual-nature tunneling term. Tunneling is both a vulnerability (negative) and an authentication mechanism (positive).

---

### Zeno-BCI Stabilization

**Status:** Novel QIF hypothesis — not in existing literature

**What it is:** The hypothesis that BCI systems sampling at 1000+ Hz may act as a quantum Zeno effect, stabilizing quantum states at the electrode-tissue interface by measuring them faster than they can decohere.

**If true:**
- BCI measurement creates its own quantum coherence window
- Self-reinforcing (more sampling = more stability)
- Natural defense against decoherence
- Unique to high-frequency BCI systems

**How QIF uses it:** Could resolve the decoherence time dispute for BCI-specific contexts. Even if bulk neural tissue decoheres in 10⁻¹³ s, the Zeno effect at the electrode interface might extend coherence to microseconds or longer.

---

### QI Unified Equation

**Equation:** `QI(b,t) = e^(-Σ(b,t))` where Σ = Σc + Σq

**What it does:** Single master equation replacing both Candidates 1 and 2. Scores signal legitimacy from 0 (anomalous) to 1 (normal) per band per time window. The exponential form is a Boltzmann factor -- anomaly plays the role of energy.

**Key insight (Entry 26):** Candidates 1 and 2 are the same equation in different spaces (log vs real). This equation absorbs both.

**Status:** Proposed (QIF contribution). Replaces separate candidates.

---

### Anomaly Score

**Symbol:** Σ(b,t) = Σc + Σq

**What it measures:** Total signal anomaly. Classical sum (4 terms: phase, transport, amplitude, scale-frequency) plus quantum sum (3 terms: indeterminacy, tunneling, entanglement). Higher Σ = more anomalous = lower QI score.

---

### Scale-Frequency Term (Dsf)

**Equation:** `Dsf = (ln(f·L / v_expected))²`

**What it measures:** Whether a signal's frequency and spatial extent obey the wave equation L = v/f. Returns 0 when physically consistent. Log-scale handles the orders-of-magnitude range.

**How QIF uses it:** Fourth classical term in the unified equation. Catches physically impossible signals.

---

### Unified Wave Equation

**Equation:** `L = v/f`

**What it means:** L is "length of one wave" -- the same measurement in any medium. In neural tissue, L is spatial extent of coherent activity. In silicon, L is wavelength. Only velocity v differs.

**Key insight (Entry 28):** Eliminated the false distinction between "analog" neural waves and "digital" silicon signals. All signals are waves.

---

### Spectral Consistency (Dspec)

**What it is:** Consumer-device substitute for Dsf when spatial resolution is insufficient. Symmetric KL-divergence between observed and expected power spectra.

**How QIF uses it:** Consumer QI replaces Dsf with Dspec for devices with too few electrodes for spatial analysis.

---

### QI Consumer Equation

**Equation:** `QI_consumer = e^(-(w1·σ²φ + w2·Hτ/ln(N) + w3·σ²γ))`

**What it does:** Simplified QI for consumer headbands. 3 weighted classical terms only. No Dsf (insufficient spatial data), no quantum terms.

---

### Neural Sensory Protocol

**Abbreviation:** NSP

**What it is:** Open post-quantum security protocol for BCI data. Five defense layers: (1) Hardware root of trust, (2) Hybrid PQC key exchange, (3) Signal physics (QI score), (4) Adaptive ML (TTT), (5) EM environment (resonance shield).

**Status:** Protocol design v2.1. Not yet implemented.

---

### Black Hole Security Principle

**What it is:** The principle that NSP-encrypted neural data is indistinguishable from random noise -- the same information-theoretic property as Hawking radiation. Grounded in four established physics results: scrambling bound, holographic principle, Page curve, and semantic security.

**How QIF uses it:** Provides a physics-derived information-theoretic foundation for NSP security guarantees. No other BCI security approach has this.

**Status:** Proposed (QIF contribution, Entry 35). Pending peer review.

---

### Harvest Now Decrypt Later

**Abbreviation:** HNDL

**What it is:** Strategy where adversaries record encrypted traffic today and store it until quantum computers can decrypt it retroactively.

**How QIF uses it:** Core urgency argument for NSP. Implant lifetime (10-20 years) > quantum computer arrival (2030-2035). Neural data cannot be rotated like a password.

---

### ML-KEM

**Standard:** FIPS 203 (NIST, 2024). Formerly CRYSTALS-Kyber.

**What it does:** Post-quantum key encapsulation mechanism based on lattice problems. Used in NSP hybrid key exchange.

---

### ML-DSA

**Standard:** FIPS 204 (NIST, 2024). Formerly CRYSTALS-Dilithium.

**What it does:** Post-quantum digital signatures (lattice-based). Used in NSP for real-time frame authentication. 2,420-byte signatures.

---

### SPHINCS+ (SLH-DSA)

**Standard:** FIPS 205 (NIST, 2024).

**What it does:** Hash-based post-quantum signatures. Most conservative security assumptions. Used for firmware signing and key rotation (29 KB signatures acceptable for rare operations).

---

### Hybrid Key Exchange

**Equation:** `Shared secret = KDF(ECDH_secret || ML-KEM_secret)`

**What it does:** Run classical and post-quantum key exchange simultaneously. Session is secure if EITHER algorithm holds.

**Status:** NSA-recommended transition strategy.

---

### Attack Coupling Mechanisms

**Five types identified (Entry 28):**
1. **Direct** -- attacker frequency IS neural frequency (e.g., ELF 3-76 Hz)
2. **Harmonic** -- attacker at harmonic of neural frequency
3. **Envelope modulation** -- high-frequency carrier with neural-frequency amplitude modulation
4. **Temporal interference** -- two beams intersecting to produce neural-frequency beat pattern
5. **Intermodulation** -- attacker RF + BCI wireless mix in nonlinear tissue to produce neural frequencies

**Most dangerous:** Intermodulation -- BCI becomes the weapon.

---

### Unified Threat Registry

**Version:** v1.0 (Entry 37-38, 2026-02-06)

**What it is:** A MITRE ATT&CK-compatible registry of 60 BCI attack techniques organized into 11 tactics. ID range T2000+ (non-conflicting with MITRE's T1xxx). Implemented as-code in `config.py` as single source of truth.

**11 Tactics:**
- 7 extend MITRE Enterprise: Reconnaissance (TA0043), Initial Access (TA0001), Execution (TA0002), Persistence (TA0003), Defense Evasion (TA0005), Collection (TA0009), Impact (TA0040)
- 4 QIF-proposed (no MITRE equivalent): Neural Manipulation (TA0050), Cognitive Exploitation (TA0051), Directed Energy (TA0052), Adversarial ML (TA0053)

**MITRE Cross-Reference Coverage:**
- 48/60 techniques (80%) have explicit MITRE ATT&CK technique cross-references (28 unique MITRE IDs)
- 12/60 techniques (20%) have NO MITRE EQUIVALENT -- these define QIF's unique contribution:
  - Directed energy (6): T2101-T2106 -- physics-based EM coupling attacks
  - Quantum-biological (2): T2005-T2006 -- ion channel tunneling, Davydov soliton
  - Cognitive (4): T2402, T2403, T2406, T2408 -- target consciousness, not computation

**As-code pipeline:** `config.py` → `generate_threat_registry.py` → `threat-registry.json` + `qif-architecture-v4.json` + viz HTML

**How QIF uses it:** Every QI detection component maps to specific T-IDs it catches. The registry also encodes what QI CANNOT catch (Mechanisms D-E), making defense gaps explicit. This informs the three-tier defense architecture (QI-only for consumer, QI+TTT for clinical, Shield+QI+TTT for implanted).

---

### Resonance Shield

**What it is:** Active destructive interference system at device boundary. Like noise-canceling headphones for EM fields.

**How QIF uses it:** Layer 5 defense for implanted devices. Catches temporal interference and intermodulation attacks that signals-only detection (QI) cannot. Also solves MRI compatibility.

---

### Scrambling Bound

**Equation:** `t* ~ (β/2π)·ln(S)` (Sekino-Susskind, 2008)

**What it means:** Black holes are nature's fastest information scramblers. AES-256 satisfies this bound. Encryption IS scrambling.

---

### Page Curve

**What it is:** Don Page (1993) showed information escaping a black hole appears maximally random until the "Page time." Maps to key exchange: before key = noise, after key = full recovery.

---

### Holographic Principle

**Equation:** `S_max = A/(4·l_P²)`

**What it means:** Maximum information in a volume is proportional to its surface area, not volume ('t Hooft, Susskind; proven via AdS/CFT). At I0, the electrode surface IS the holographic screen.

---

### Landauer's Principle

**Equation:** `E_min = kT·ln(2)` per bit erasure

**What it means:** The fundamental thermodynamic minimum energy cost of erasing one bit. Replaces Moore's Law as the correct fundamental limit for computation energy.

---

### Bekenstein-Hawking Entropy

**Equation:** `S_BH = k_B · A / (4 · l_P²)`

**What it means:** Black hole entropy is proportional to its surface area (in Planck units), not volume. Foundation of the holographic principle.

---

### QIF Layer Architecture

**Version:** v3.1 Hourglass (2026-02-02)

**NOTE:** v2.0 (14-layer OSI-based) is DEPRECATED. Replaced by v3.1 Hourglass (7-band, 3-1-3 symmetric) on 2026-02-02.

| Band | Name | Domain |
|------|------|--------|
| N3 | Integrative Association | Neural (quantum uncertain) |
| N2 | Sensorimotor Processing | Neural (chaotic-stochastic) |
| N1 | Subcortical Relay | Neural (stochastic) |
| I0 | Neural Interface | Interface (quasi-quantum) |
| S1 | Analog Front-End | Silicon (stochastic) |
| S2 | Digital Processing | Silicon (deterministic) |
| S3 | Application | Silicon (deterministic) |

**DEPRECATED (v2.0):** The previous 14-layer model (L1-L7 OSI networking + L8-L14 neural extension) is superseded. Any reference to L1-L7 as biological layers uses the v1.0 model (pre-2026-01-22).

---

*QIF Wiki version: 2.0*
*Created: 2026-02-02*
*This document grows with every session. Add entries as new terms arise.*
