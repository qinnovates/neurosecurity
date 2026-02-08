# QIF Source of Truth

> **This is the CANONICAL reference for all QIF equations, values, and definitions.**
> **All blogs, repo docs, and publications MUST be consistent with this file.**
> **Last validated: 2026-02-02**
> **Last audit: 2026-02-02**
> **Next audit due: 2026-02-09**
>
> ## Update Triggers
> This document gets updated (and then synced outward to repo → blogs) whenever:
> - An equation is added, modified, or invalidated
> - A new fact is learned (physics, neuroscience, quantum mechanics, math)
> - An existing principle is reinterpreted or seen from a new angle
> - A foundational assumption is challenged or refined
> - New empirical data changes validated values (spatial scales, constants, thresholds)
> - A novel connection is discovered between existing concepts
> - Layer definitions or architecture change
> - An external paper or discovery shifts how we understand the framework
>
> **Truth flows outward:** QIF-TRUTH.md → repo docs → blog posts

---

## 1. Framework Identity

- **Name:** QIF — Quantum Indeterministic Framework for Neural Security
- **Pronunciation:** "CHIEF"
- **Predecessor:** ONI (Organic Neural Interface) — deprecated
- **Layer model version:** v3.0 Hourglass (2026-02-02)
- **GitHub:** qinnovates/qinnovate

---

## 2. Layer Architecture (v3.0 — Hourglass Model)

> **v2.0 (14-layer OSI-based) is DEPRECATED.** Replaced 2026-02-02 with hourglass derived from neuroscience and quantum physics. No OSI heritage. See Derivation Log entries 1–14 for rationale.
>
> **v3.0 (8-band) refined to v3.1 (7-band, 3-1-3 symmetric) on 2026-02-02** after validation by quantum physics, neuroscience, and cybersecurity research agents. N4 (Identity & Consciousness) merged into N3 (Integrative Association). QI ranges lowered to defensible levels. Amygdala split (BLA/CeA). Cerebellum spans N1+N2. See Derivation Log entry 15.

### 3 Zones, 7 Bands (3-1-3 Symmetric)

**NEURAL DOMAIN (Upper Hourglass)**

| Band | Name | Brain Regions | Determinacy | QI Range |
|------|------|---------------|-------------|----------|
| **N3** | Integrative Association | PFC, ACC, Broca, Wernicke, HIPP, BLA, insula | Quantum Uncertain | 0.3–0.5 |
| **N2** | Sensorimotor Processing | M1, S1_cortex, V1, A1, PMC, SMA, PPC, cerebellum | Chaotic → Stochastic | 0.15–0.3 |
| **N1** | Subcortical Relay | Thalamus, basal ganglia, cerebellum, brainstem, CeA | Stochastic | 0.05–0.15 |

**INTERFACE ZONE (Bottleneck) — Quasi-quantum**

| Band | Name | Function | Determinacy | QI Range |
|------|------|----------|-------------|----------|
| **I0** | Neural Interface | Electrode-tissue boundary, measurement/collapse | Quasi-quantum (ΓD ∈ (0,1)) | 0.01–0.1 |

**SILICON DOMAIN (Lower Hourglass) — Classical**

| Band | Name | Function | Determinacy | QI Range |
|------|------|----------|-------------|----------|
| **S1** | Analog Front-End | Amplification, filtering, ADC/DAC | Stochastic (analog noise) | 0.001–0.01 |
| **S2** | Digital Processing | Decoding, algorithms, classification | Deterministic | ~0 |
| **S3** | Application | Clinical software, UI, data storage | Deterministic | 0 |

### Key Anatomical Decisions (v3.1)
- **Amygdala split:** BLA (basolateral, cortical-like, associative learning) → N3. CeA (central, subcortical, autonomic output) → N1.
- **Cerebellum spans N1+N2:** Relay functions in N1, cerebellar-cortical motor loops in N2.
- **S1_cortex:** Primary somatosensory cortex renamed to avoid collision with S1 (Analog Front-End) band ID.

### Naming Convention
- Format: `{Zone}{Number}` — N3, N2, N1, I0, S1, S2, S3
- Numbers increase **away** from interface in both directions
- No relation to OSI layer numbers

### Hourglass Geometry
- **Width = state space / possibility space**
- Widest at N3 (integrative association, max security-relevant indeterminacy) and S3 (max classical pathways)
- Narrowest at I0 (measurement collapses possibilities)
- **3-1-3 symmetry:** 3 neural bands, 1 interface band, 3 silicon bands
- The bottleneck has **real thickness** (quasi-quantum zone, not a line)

### Classical Ceiling
The boundary between chaotic (N2) and quantum uncertain (N3) is the **classical ceiling** — below it, all unpredictability is in principle resolvable with better measurement; above it, the unpredictability is ontic (Bell's theorem). Classical security tools operate below the ceiling. QIF operates across the full spectrum.

### QI Range Philosophy (v3.1)
QI ranges were lowered dramatically in v3.1 to avoid implying quantum dominance in the brain. QI measures **security-relevant indeterminacy**, not literal quantum effects. The highest band (N3) caps at 0.5, meaning "half the unpredictability at this band may be ontic." This is defensible without requiring proof of quantum cognition.

### v2.0 → v3.0 Migration

| v2.0 | v3.0/3.1 | Rationale |
|------|------|-----------|
| L1–L7 (OSI) | S3 | All classical networking collapses into Application band |
| L8 (Neural Gateway) | I0 | Electrode-tissue boundary → Interface |
| L9 (Signal Processing) | I0/N1 | Split between interface and subcortical relay |
| L10 (Neural Protocol) | N1/N2 | Subcortical/sensorimotor |
| L11 (Cognitive Transport) | N2 | Sensorimotor Processing |
| L12 (Cognitive Session) | N3 | Integrative Association |
| L13 (Semantic Layer) | N3 | Integrative Association |
| L14 (Identity Layer) | N3 | Integrative Association (merged from former N4) |

---

## 3. Validated Equations

### 3.1 Coherence Metric

```
Cₛ = e^(−(σ²ᵩ + σ²τ + σ²ᵧ))
```

| Component | Symbol | Definition | Formal |
|-----------|--------|------------|--------|
| Phase variance | σ²ᵩ | Circular phase variance, π²-scaled | (1 − R)·π² where R = \|mean(e^(iφ))\| |
| Transport entropy | Hτ | Pathway integrity / transmission reliability | −Σᵢ ln(pᵢ) |
| Gain variance | σ²ᵧ | Amplitude stability relative to baseline | (1/n)Σᵢ((Aᵢ − Ā)/Ā)² |

**Status:** Proposed (QIF contribution). Form is valid as Gaussian likelihood / Boltzmann factor design.

**Implementation notes:**
- Phase uses circular variance (handles 2π wraparound correctly), scaled by π² to match the linear variance range for small angles. Range: [0, π²].
- Transport is Shannon surprise (entropy), NOT a statistical variance. Named Hτ to avoid confusion; σ²τ notation is deprecated.
- The three terms have different natural scales. Transport entropy scales with the number of channels (sum, not mean). Weighting coefficients may be needed for balanced contribution — this is an open calibration question.

**Decision thresholds:**

| Coherence | Authentication | Action |
|-----------|---------------|--------|
| High (Cₛ > 0.6) | Valid | ACCEPT |
| High (Cₛ > 0.6) | Invalid | REJECT + ALERT |
| Medium (0.3 < Cₛ < 0.6) | Valid | ACCEPT + FLAG |
| Medium (0.3 < Cₛ < 0.6) | Invalid | REJECT + ALERT |
| Low (Cₛ < 0.3) | Any | REJECT + CRITICAL |

**Biological basis:**
- Phase: Fries' Communication Through Coherence (2005/2015); PLV is standard measure
- STDP windows: ±10-20 ms (Markram 1997, Bi & Poo 1998) — CONFIRMED
- Synaptic release probability: 0.1-0.5 in vivo (typical cortical); 0.7-0.95 only at specialized synapses (Borst 2010)

### 3.2 Scale-Frequency Relationship

```
v = f × λ
```

Where v = axonal conduction velocity (NOT a universal constant k).

| Fiber Type | Conduction Velocity |
|------------|-------------------|
| Unmyelinated intracortical | 0.1-0.5 m/s |
| Myelinated corticocortical | 5-30 m/s |
| Nunez canonical model | ~7 m/s |

**Empirically validated spatial extents:**

| Band | Frequency | Coherent Spatial Extent | f × S (m·Hz) | Source |
|------|-----------|------------------------|--------------|--------|
| High gamma | 60-100 Hz | 0.3-5 mm | ~0.08-0.4 | Jia et al. 2011 |
| Low gamma | 30-60 Hz | 1-10 mm | ~0.04-0.4 | ECoG studies |
| Alpha | 8-12 Hz | 10-20 cm (thalamocortical) | 1-2 | Srinivasan 1999 |
| Theta | 4-8 Hz | 4-5 cm (hippocampal) | 0.24-0.40 | Patel et al. 2012 |
| Delta | 0.5-4 Hz | 15-20 cm (whole cortex) | 0.15-0.20 | Massimini 2004 |

**Key facts:**
- f × S is NOT constant — varies by ~1 order of magnitude
- The relationship is an inverse power law on log-log axes (Buzsáki & Draguhn 2004)
- "Spatial scale" means spatial extent of coherent activity, NOT total axonal pathway length
- Human brain maximum dimension: ~15-20 cm. Any spatial scale >20 cm is physically impossible.

**DEPRECATED VALUES (do NOT use):**
- ~~k ≈ 10⁶~~ — wrong by 5 orders of magnitude
- ~~Theta: 1.5 m~~ — exceeds brain dimensions
- ~~Delta: 5 m~~ — exceeds brain dimensions
- ~~Gamma: 25 cm~~ — too large for empirical gamma coherence

### 3.3 Established Physics (used in framework)

| Equation | Formula | Status |
|----------|---------|--------|
| Quasi-static Poisson | ∇·(σ∇V) = Iₛ | Established |
| Hodgkin-Huxley | Cₘ(dV/dt) = −Σgᵢmᵖhᵍ(V−Eᵢ) + I_ext | Established |
| Nernst | E = (RT/zF)ln([ion]_out/[ion]_in) | Established |
| Nernst-Planck | J = −D∇c − (zF/RT)Dc∇V | Established |
| Shannon capacity | C = B log₂(1 + S/N) | Established |
| Boltzmann | P ∝ e^(−E/kT) | Established |
| Fourier transform | X(f) = ∫x(t)·e^(−i2πft)dt | Established |
| Cole-Cole dispersion | ε*(ω) = ε∞ + ΣᵢΔεᵢ/(1+(jωτᵢ)^(1−αᵢ)) + σₛ/(jωε₀) | Established |

### 3.4 Quantum Equations (security layer)

| Equation | Formula | Status |
|----------|---------|--------|
| No-Cloning Theorem | Cannot copy arbitrary unknown quantum state | Established (1982) |
| Bell States | \|Φ⁺⟩ = (1/√2)(\|00⟩ + \|11⟩) | Established |
| Heisenberg Uncertainty | ΔxΔp ≥ ℏ/2 | Established |
| Robertson-Schrödinger | σ²_A·σ²_B ≥ \|⟨[A,B]⟩/2i\|² + \|⟨{A,B}⟩/2 − ⟨A⟩⟨B⟩\|² | Established |
| Von Neumann entropy | S(ρ) = −Tr(ρ ln ρ) | Established |
| Born rule | P(x) = \|ψ(x)\|² | Established |
| Tunneling coefficient | T ≈ e^(−2κd) where κ = √(2m(V₀−E))/ℏ | Established |
| **Hamiltonian (time evolution)** | **iℏ(d/dt)\|ψ⟩ = H\|ψ⟩** | **Established** |
| Shor's Algorithm | O(n³) factoring [or O(n² log n log log n)] | Established |
| Grover's Algorithm | O(√N) search | Established |

---

## 4. Candidate QI Equations (UNDER DEVELOPMENT)

### 4.1 Candidate 1 — Additive/Engineering Form

```
QI(t) = α·Ĉclass + β·(1 − ΓD(t))·[Q̂i + δ·Q̂entangle] − γ·Q̂tunnel
```

**CRITICAL: All input terms MUST be normalized to [0, 1] before addition.**
The hat notation (Ĉ, Q̂) denotes normalized quantities. This resolves the dimensional
inconsistency of the original formulation where terms had incompatible units.

| Term | Raw quantity | Normalization | Normalized range |
|------|-------------|---------------|-----------------|
| Ĉclass | Coherence metric Cs | Already [0,1] | [0, 1] |
| Q̂i | SvN(ρ) + ΔRS(A,B) | SvN/ln(d); ΔRS/ΔRS_max | [0, 1] |
| Q̂entangle | Entanglement entropy E(ρAB) | E/ln(d) | [0, 1] |
| Q̂tunnel | Tunneling coefficient T | Already [0,1] | [0, 1] |

Where:
- **ΓD(t)** = Decoherence factor = 1 − e^(−t/τD)
- **d** = Hilbert space dimension (for entropy normalization)
- α, β, γ, δ = dimensionless scaling coefficients (require experimental calibration)

**Strengths:** Modular, intuitive, each term independently computable, dimensionally consistent
**Weaknesses:** Normalization constants must be defined per-system, ad hoc structure
**Previous issue (RESOLVED):** Original formulation mixed bits, nats, and dimensionless scores without normalization

### 4.2 Candidate 2 — Tensor/Theoretical Form

```
QI = Cclass ⊗ e^(−Squantum)

where:
    Squantum = SvN(ρ(t)) + λ·Φtunnel − μ·E(ρAB)
```

Where:
- **Cclass** operates as a classical pipeline operator on H_classical
- **e^(−Squantum)** is a Boltzmann-like quantum security factor
- **SvN** = Von Neumann entropy (increases with decoherence → security decreases)
- **Φtunnel** = WKB tunneling action integral ∫₀ᵈ √(2m(V₀−E))/ℏ dx
- **E(ρAB)** = Entanglement entropy (negative sign → more entanglement = more security)

**Security metric:** S_QI = Tr(QI_hat · ρ_total) — single scalar output

**Strengths:** Mathematically rigorous, entanglement natural, decoherence emerges
**Weaknesses:** Requires quantum state tomography, more abstract

### 4.3 Implicit Hamiltonian Dependency (Entry 18, 2026-02-03)

All quantum terms in both candidates (ΓD, SvN, Φtunnel, E(ρAB)) are derived from the system Hamiltonian H, which does not appear explicitly. The QI equation operates on derived quantities (leaves) rather than the generating equation (root). Writing down H_total for the electrode-tissue interface would:
- Derive all four quantum terms from a single equation (reducing free parameters)
- Enforce physical consistency between terms
- Connect directly to quantum simulation of the I0 band
- Resolve the Tegmark/Hagan decoherence disagreement

**H_total = H_neuron + H_electrode + H_interface + H_environment** — not yet formulated for any BCI system. This is a key future research target. See Derivation Log Entry 18.

### 4.4 Open Research Questions

1. Decoherence time in neural tissue: 10⁻¹³ s (Tegmark) vs 10⁻⁵ s (recent) — 8 OOM disagreement
2. Biological entanglement: Fisher's Posner molecules — speculative, unverified
3. Quantum tunneling as biometric: Novel proposal, no prior literature — needs experimental design
4. Zeno-BCI effect: Does 1kHz+ sampling stabilize quantum states? — novel hypothesis
5. Silicon-tissue interface: No quantum-level theoretical framework exists for this boundary

---

## 5. Validated External Claims

### Quantum Computing Threats

| Claim | Validated Value | Source |
|-------|----------------|--------|
| Shor's breaks RSA-2048 | ~8 hours / 20M noisy qubits | Gidney & Ekerå 2019, arXiv:1905.09749 |
| Revised qubit estimate | <1M noisy qubits / <1 week | Gidney 2025, arXiv:2505.15917 |
| Classical RSA-2048 time | Hundreds of trillions of years | GNFS complexity |
| AES-256 quantum resistance | Theoretically halved; practically quantum-resistant | NIST guidance |
| Grover's optimality | O(√N) provably optimal | Bennett et al. 1997, Zalka 1999 |

### Neuralink N1 Specifications

| Spec | Validated Value |
|------|----------------|
| Electrodes | 1,024 (64 threads) |
| Sampling rate | ~19.3-20 kHz |
| Wireless | Bluetooth Low Energy (BLE) |
| Power | 24.7 mW |
| SoC area | 5×4 mm² |

### Neuroscience Constants

| Claim | Validated Value | Source |
|-------|----------------|--------|
| Retinal output | ~10 Mbps | Koch et al. 2006 |
| Conscious visual bandwidth | ~20-50 bits/sec | Nørretranders 1998 |
| Compression ratio | ~200,000:1 to 500,000:1 | Derived |
| STDP LTP window | Pre leads post by 0-20 ms | Markram 1997, Bi & Poo 1998 |
| Cortical synaptic Pr (in vivo) | ~0.1-0.5 | Borst 2010 |
| Human brain max dimension | ~15-20 cm | Anatomy |

---

## 6. Blog Sync Status

### Layer 1: TRUTH → Repo

| Repo File | Maps To | Last Synced | Status |
|-----------|---------|-------------|--------|
| `MAIN/qif/README.md` | S1, S2 | 2026-02-02 | `SYNCED` |
| `ONI_LAYERS.md` | S2 | 2026-02-02 | `SYNCED` |
| `TechDoc-Coherence_Metric.md` | S3.1 | 2026-02-02 | `SYNCED` |
| `TechDoc-Scale_Frequency.md` | S3.2 | 2026-02-02 | `SYNCED` |
| `TechDoc-Quantum_Encryption.md` | S3.4 | 2026-02-02 | `SYNCED` |
| `coherence.py` | S3.1 | — | `NEEDS_SYNC` |
| `layers.py` | S2 | — | `NEEDS_SYNC` |
| `brand.json` | S1 | 2026-02-02 | `SYNCED` |
| Whitepaper (`docs/whitepaper/`) | S2–S5 | 2026-02-02 | `SYNCED` |

### Layer 2: Repo → Blogs

| Blog Post | Maps To | Last Synced | Status |
|-----------|---------|-------------|--------|
| Hidden Equation (f×S) | S3.2 | 2026-02-02 | `SYNCED` — corrected: k value, spatial scales, layers, compression |
| Neural Ransomware | S2 | 2026-02-02 | `SYNCED` — corrected: layer numbers to v2.0 |
| Quantum Hackers | S3.4, S5 | 2026-02-02 | `SYNCED` — corrected: RSA estimates, AES-256 claim |
| Heart Attack | S5 | 2026-02-02 | `SYNCED` — corrected: mortality rates, chest pain stats |
| Spam Filter (Coherence) | S3.1 | 2026-02-02 | `REVIEW` — needs review: synaptic Pr range |
| Brain Firewall | S2 | 2026-02-02 | `SYNCED` — no changes needed |
| OSI of Mind | S1, S2 | 2026-02-02 | `REVIEW` — references deprecated ONI naming |
| Liminal Phase (Tunneling) | S3.4 | 2026-02-02 | `SYNCED` — published to qinnovates.github.io |
| Nobel Prize (Quantum Keys) | S3.4 | 2026-02-02 | `SYNCED` |
| IKEA Paradigm | — | — | `N/A` — not QIF content |

### Status Legend

- `SYNCED` — content matches QIF-TRUTH.md
- `REVIEW` — may have drift, needs manual check
- `NEEDS_SYNC` — known out of date, propagation needed
- `N/A` — not QIF-related content

**Full propagation protocol:** See `PROPAGATION.md` (same directory)

---

## 7. Agent Learning Notes

### 2026-02-02: Initial QIF Truth Document Created

**Context:** Cross-validated all blog math against ONI repo and external literature.

**Key corrections applied:**
1. f×S constant: 10⁶ → 1-10 m·Hz
2. Spatial scales: physically impossible values → empirically measured extents
3. Layer numbers: v1.0 → v2.0 across all blogs
4. RSA estimates: "100 seconds" → Gidney peer-reviewed estimates
5. AES-256: added NIST practical-resistance caveat
6. Heart attack stats: corrected to NRMI/JAMA primary sources
7. Information compression: few hundred → 20-50 bits/sec

**Novel discoveries from quantum agent:**
1. Robertson-Schrödinger is an EQUALITY for qubits (exact indeterminacy computation)
2. Von Neumann entropy non-monotonicity as security feature (subsystem more uncertain than whole)
3. Quantum tunneling as biometric — no prior literature proposes this
4. Zeno-BCI connection — 1kHz+ sampling may stabilize quantum states at electrode interface
5. Davydov soliton vulnerability — quantum-level BCI attack vector invisible to classical detection
6. Decoherence as continuous dial, not binary switch — smooth classical-quantum transition

---

## 8. Strategic Decisions (Resolved 2026-02-02)

All 8 questions from QI-EQUATION-RESEARCH.md Section 8, answered by Kevin Qi.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Depth of framework | **Both layers** | Practical engineering first, theoretical follow-up. Publishable AND actionable. |
| Q2 | Entanglement source | **Both biological + artificial** | Don't depend on unproven Posner biology; model both, let science decide. |
| Q3 | Tunneling role | **Dual nature** | Vulnerability AND quantum biometric. Novel contribution — no prior literature. |
| Q4 | Decoherence timescale | **Tunable parameter (τ_D)** | Sidesteps 8-OOM physics debate. Equation gracefully degrades across all timescales. |
| Q5 | Candidate equation | **Both as complementary** | Candidate 1 (Additive) for engineering. Candidate 2 (Tensor) for theory. Shows range. |
| Q6 | Zeno-BCI hypothesis | **Yes, model it** | Include with clear "novel/unverified" label. High publication value. Testable prediction. |
| Q7 | Layer mapping | **Meta-equation + conceptual L15** | QI spans all layers (physics reality). Also present as conceptual Layer 15 for practitioners. |
| Q8 | Publication strategy | **One comprehensive whitepaper** | ONI whitepaper style. Full visualizations, encyclopedia, all findings. For neuroethics admissions + BCI researchers. |

### Additional decisions from Q8 discussion:
- Whitepaper includes **Knowns/Unknowns table** showing where QIF fills gaps in current science
- Whitepaper includes **Encyclopedia** at the end defining all terms for non-experts
- QI is NOT a constant — the equation is deterministic (same inputs → same output) but quantum inputs are inherently probabilistic
- The probabilistic nature is a security feature: attackers can't predict QI values

### 2026-02-02: v3.0 Hourglass Layer Model Implemented

**Context:** Replaced deprecated 14-layer OSI-based model (v2.0) with 8-band hourglass architecture (v3.0).

**Key changes:**
1. Stripped all OSI heritage — 7 OSI layers collapsed into S3 (Application)
2. Designed 3-zone / 8-band model from neuroscience: Neural (N4-N1), Interface (I0), Silicon (S1-S3)
3. Each band maps to real BCI functional stages with brain regions, determinacy levels, and QI ranges
4. Band numbering increases away from interface in both directions (no relation to OSI)
5. Hourglass width = state space / possibility space — widest at N4/S3, narrowest at I0
6. I0 bottleneck has real thickness (quasi-quantum zone, not a thin line)
7. Classical ceiling defined between N2 (chaotic) and N3 (quantum uncertain)
8. Threat model remapped: L8→I0, L9-L10→I0/N1, L12-L13→N3, L14→N4, L6-L7→S3
9. Brain region dependency graph replaces linear layer chain
10. Updated config.py as single source of truth, all visualizations regenerated

---

*Document version: 3.0*
*Created: 2026-02-02*
*Last updated: 2026-02-02*
*Maintainer: Kevin Qi*
