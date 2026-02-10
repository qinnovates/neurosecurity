# QIF Source of Truth

> **This is the CANONICAL reference for all QIF equations, values, and definitions.**
> **All blogs, repo docs, and publications MUST be consistent with this file.**
> **Last validated: 2026-02-07**
> **Last audit: 2026-02-07**
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
- **Layer model version:** v4.0 Hourglass (2026-02-06)
- **GitHub:** qinnovates/qinnovate

---

## 2. Layer Architecture (v4.0 — Hourglass Model)

> **v2.0 (14-layer OSI-based) is DEPRECATED.** Replaced 2026-02-02. See Derivation Log entries 1–14.
>
> **v3.0/3.1 (7-band, 3-1-3) refined to v4.0 (11-band, 7-1-3) on 2026-02-06.** The 3-band neural domain was expanded to 7 bands for complete neuroanatomical coverage. Each major brain structure now has its own band with severity stratification and BCI device mapping. See Derivation Log entries 33-34.
>
> v3.1 (7-band) remains valid as a **strategic view** — the 7-band neural expansion is a tactical decomposition, analogous to how the 14-layer classical model is a "zoom in" of the hourglass.

### 3 Zones, 11 Bands (7-1-3)

**NEURAL DOMAIN (Upper Hourglass) — 7 bands, severity-stratified**

| Band | Name | Key Structures | Determinacy | QI Range |
|------|------|----------------|-------------|----------|
| **N7** | Neocortex | PFC, M1, V1, A1, Broca, Wernicke, PMC, SMA, PPC | Quantum Uncertain | 0.3–0.5 |
| **N6** | Limbic System | Hippocampus, BLA, insula, ACC, cingulate | Chaotic → QU | 0.2–0.4 |
| **N5** | Basal Ganglia | Striatum, GPi/GPe, STN, substantia nigra | Chaotic | 0.15–0.35 |
| **N4** | Diencephalon | Thalamus, hypothalamus, VIM, ANT | Stochastic → Chaotic | 0.1–0.3 |
| **N3** | Cerebellum | Cerebellar cortex, deep nuclei, vermis | Stochastic | 0.1–0.25 |
| **N2** | Brainstem | Medulla, pons, midbrain, reticular formation | Stochastic | 0.05–0.15 |
| **N1** | Spinal Cord | Cervical, thoracic, lumbar, sacral, cauda equina | Stochastic | 0.01–0.1 |

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

### v3.1 → v4.0 Migration

| v3.1 | v4.0 | Change |
|------|------|--------|
| N3 Integrative Association | **N7** Neocortex + **N6** Limbic | Split cortical cognition from emotional/memory |
| N2 Sensorimotor Processing | **N7** (cortices) + **N5** Basal Ganglia + **N3** Cerebellum | Split cortical from subcortical motor |
| N1 Subcortical Relay | **N4** Diencephalon + **N2** Brainstem + **N1** Spinal Cord | Full peripheral coverage |
| I0, S1, S2, S3 | Unchanged | Silicon domain already granular |

### Key Anatomical Decisions (v4.0)
- **38 brain regions mapped** (was 17 in v3.1). Each region has a canonical band assignment and documented inter-region connections.
- **Severity stratification:** Bands are ordered by clinical severity if compromised. N7 (neocortex) = highest cognitive impact. N1 (spinal cord) = reflex/motor only.
- **BCI device mapping:** Each band lists which real-world devices interface with it (e.g., N5: Medtronic Percept STN DBS; N7: Neuralink N1).
- **S1_cortex:** Primary somatosensory cortex renamed to avoid collision with S1 (Analog Front-End) band ID.

### Naming Convention
- Format: `{Zone}{Number}` — N7, N6, N5, N4, N3, N2, N1, I0, S1, S2, S3
- Numbers increase **away** from interface in both directions
- No relation to OSI layer numbers

### Hourglass Geometry
- **Width = state space / possibility space**
- Widest at N7 (neocortex, max security-relevant indeterminacy) and S3 (max classical pathways)
- Narrowest at I0 (measurement collapses possibilities)
- **7-1-3 asymmetry:** 7 neural bands, 1 interface band, 3 silicon bands
- Neural side is wider because the brain has 500M years of evolutionary complexity; silicon is human-designed with bounded complexity
- The bottleneck has **real thickness** (quasi-quantum zone, not a line)

### Classical Ceiling
The boundary between N6 (chaotic → quantum uncertain) and N7 (quantum uncertain) is the **classical ceiling** — below it, all unpredictability is in principle resolvable with better measurement; above it, the unpredictability is ontic (Bell's theorem). Classical security tools operate below the ceiling. QIF operates across the full spectrum.

### QI Range Philosophy (v4.0)
QI ranges reflect security-relevant indeterminacy, not literal quantum effects. The highest band (N7) caps at 0.5, meaning "half the unpredictability at this band may be ontic." Ranges overlap between adjacent bands, reflecting that determinacy is a spectrum, not discrete levels. This is defensible without requiring proof of quantum cognition.

---

## 3. Validated Equations

### 3.1 Coherence Metric

```
Cₛ = e^(−(σ²ᵩ + Hτ + σ²ᵧ))
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

| Band | Frequency | Coherent Spatial Extent | f × S (m/s) | Source |
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
| Landauer's Principle | E_min = kT·ln(2) per bit erasure | Established |

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
| Bekenstein-Hawking entropy | S_BH = k_B·A/(4·l_P²) | Established |
| Bekenstein bound | S ≤ 2πRE/(ℏc) | Established |
| Holographic principle | S_max = A/(4·l_P²) | Established ('t Hooft, Susskind) |
| Scrambling bound | t* ~ (β/2π)·ln(S) | Established (Sekino-Susskind 2008) |
| Landauer's Principle | E_min = kT·ln(2) per bit erasure | Established |

---

## 4. The Unified QI Equation

### 4.1 Core Equation

```
QI(b,t) = e^(-Σ(b,t))
```

where:
- b = band index (N7, N6, N5, N4, N3, N2, N1, I0, S1, S2, S3)
- t = time window
- Σ(b,t) = Σc(b,t) + Σq(b,t) = total anomaly score
- QI output: 0 to 1 (1 = perfectly normal, 0 = maximally anomalous)

The exponential form is NOT arbitrary — it is a Boltzmann factor. Σ plays the role of "energy" (anomaly), and QI is the probability of the signal being legitimate. This is the same mathematical structure as thermal physics, Shannon entropy, and the coherence metric Cs.

**Key insight (Entry 26):** The original Candidates 1 and 2 are the same equation in different spaces. Candidate 1 (additive) operates in log-space; Candidate 2 (exponential) in real-space. The unified equation absorbs both: Σ is the log-space sum, e^(-Σ) is the real-space score.

### 4.2 Classical Terms (Σc)

```
Σc(b) = w₁·σ²φ(b) + w₂·Hτ(b)/ln(N) + w₃·σ²γ(b) + w₄·Dsf(b)
```

| Term | Symbol | Weight | What it measures | Formula |
|------|--------|--------|-----------------|---------|
| Phase coherence | σ²φ | w₁ | Channel synchronization | (1-R)·π² where R = \|mean(e^(iφ))\| |
| Transport entropy | Hτ/ln(N) | w₂ | Pathway integrity (normalized) | -Σᵢ ln(pᵢ) / ln(N) |
| Amplitude stability | σ²γ | w₃ | Signal strength consistency | (1/n)Σᵢ((Aᵢ-Ā)/Ā)² |
| Scale-frequency | Dsf | w₄ | Physical plausibility | (ln(f·L/v_expected))² |

**Calibration weights** w₁ through w₄ are band-specific, calibratable parameters. Their values are not yet experimentally determined — this is an open calibration requirement. Default: w₁ = w₂ = w₃ = w₄ = 1.0 (equal weighting).

**Normalization change:** Transport entropy Hτ is now divided by ln(N) where N = number of channels. This normalizes it to [0, ~1] regardless of channel count, preventing it from dominating in high-channel-count BCIs (Neuralink 1024 channels vs consumer 4 channels).

**New term Dsf:** Measures whether the signal's frequency and spatial extent obey L = v/f. If f·L ≈ v_expected for the tissue type, Dsf ≈ 0 (normal). If f·L deviates significantly, Dsf grows quadratically. Log-scale handles the orders-of-magnitude range of neural frequencies.

### 4.3 L = v/f (Unified Wave Equation)

```
L = v / f
```

| Symbol | Meaning | In neural tissue | In silicon |
|--------|---------|-----------------|-----------|
| L | Length of one wave | Spatial extent of coherent activity | Wavelength λ |
| v | Wave velocity | Axonal conduction velocity (0.1-30 m/s) | Speed of light in medium |
| f | Frequency | Neural oscillation frequency | Signal frequency |

**Key insight (Entry 28):** λ (silicon wavelength) and S (neural spatial extent) are the same measurement — the length of one wave in a given medium. Only the velocity v differs. Unifying them into L eliminates the false dichotomy between "analog" and "digital" signal physics. Every signal is a wave.

### 4.4 Quantum Terms (Σq)

```
Σq = (1-ΓD(t))·[ψ₁·Q̂i − ψ₃·Q̂e] + ψ₂·Q̂t
```

| Term | Symbol | Weight | What it measures | Gated? | Sign |
|------|--------|--------|-----------------|--------|------|
| Indeterminacy | Q̂i | ψ₁ | Quantum uncertainty (SvN(ρ)/ln(d)) | Yes — decays with decoherence | + (increases anomaly) |
| Tunneling | Q̂t | ψ₂ | Barrier penetration (T = e^(-2κd)) | **No** — tunneling persists classically | + (increases anomaly) |
| Entanglement | Q̂e | ψ₃ | Non-classical correlations (E(ρAB)/ln(d)) | Yes — decays with decoherence | **−** (protective: reduces anomaly) |

**Weights** ψ₁, ψ₂, ψ₃ are calibratable parameters (default: ψ₁ = ψ₂ = ψ₃ = 1.0). Band-specific calibration pending experimental data.

**Sign convention:** Q̂e is SUBTRACTED because entanglement is a protective factor — quantum entangled states are harder to clone (no-cloning theorem) and harder to spoof. More entanglement means LESS anomaly, HIGHER QI.

**Critical change (Entry 26, Gemini correction):** Tunneling is UNGATED. Unlike indeterminacy and entanglement, tunneling does not require maintained quantum coherence — it is a single-particle phenomenon that persists even in thermally noisy environments. Gating it by decoherence was physically incorrect.

**Decoherence factor:** ΓD(t) = 1 - e^(-t/τD) — unchanged. Still a tunable parameter (sidesteps the Tegmark/Hagan debate).

### 4.5 Consumer QI (Simplified)

```
QI_consumer = e^(-(w₁·σ²φ + w₂·Hτ/ln(N) + w₃·σ²γ))
```

For consumer devices (Muse, NeuroSky) with 4-16 channels and no spatial resolution:
- No Dsf term (insufficient electrode density for spatial analysis)
- No quantum terms (no quantum hardware interface)
- Weighted classical terms with calibratable weights w₁, w₂, w₃
- **Dspec** (spectral consistency) can replace Dsf as a frequency-domain proxy: checks whether the power spectrum matches expected band distributions

### 4.6 Implicit Hamiltonian Dependency (Entry 18, 2026-02-03)

All quantum terms (ΓD, SvN, Q̂t, E(ρAB)) are derived from the system Hamiltonian H, which does not appear explicitly. The QI equation operates on derived quantities (leaves) rather than the generating equation (root). Writing down H_total for the electrode-tissue interface would:
- Derive all quantum terms from a single equation (reducing free parameters)
- Enforce physical consistency between terms
- Connect directly to quantum simulation of the I0 band
- Resolve the Tegmark/Hagan decoherence disagreement

**H_total = H_neuron + H_electrode + H_interface + H_environment** — not yet formulated for any BCI system. This is a key future research target. See Derivation Log Entry 18.

### 4.7 Corrections Applied (2026-02-06)

| Original | Corrected | Source |
|----------|-----------|--------|
| Q(c) "Quantum Constant" | "QIF Biological Coupling Parameter" (effective parameter) | Gemini + Claude independent review |
| Moore's Law for energy limits | Landauer's Principle (kT·ln(2) per bit erasure) | Gemini + Claude independent review |
| Tunneling gated by ΓD | Tunneling UNGATED (persists classically) | Gemini review |
| Hτ raw sum | Hτ/ln(N) normalized | Session derivation |
| Separate λ and S | Unified L = v/f | Entry 28 |
| Cₛ equation uses σ²τ | Updated to Hτ (σ²τ deprecated) | QwQ-32B math review (2026-02-07) |
| f × S column header "m·Hz" | Corrected to "m/s" (Hz = s⁻¹, so m·Hz = m/s) | QwQ-32B math review (2026-02-07) |
| Σq missing weights, wrong sign | Added ψ₁,ψ₂,ψ₃ weights; Q̂e now subtracted (protective) | QwQ-32B math review (2026-02-07) |
| §4.1 band index list (v3.1) | Updated to v4.0: N7–N1, I0, S1–S3 | Grok-3 consistency review (2026-02-07) |

### 4.8 Open Research Questions

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
| `neurosecurity/qif/README.md` | S1, S2 | 2026-02-02 | `SYNCED` |
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
1. f×S constant: 10⁶ → 1-10 m/s
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

## 9. Black Hole Security Principle (Entry 35, 2026-02-06)

NSP-secured BCI data crossing the encryption boundary becomes indistinguishable from random noise — the same information-theoretic property as Hawking radiation from a black hole.

**Four security derivations:**
1. **Encryption satisfies the scrambling bound** — AES-256 achieves full diffusion in O(ln(n)) rounds, matching the Sekino-Susskind fast scrambling bound
2. **I0 electrode surface is a holographic screen** — information in the brain volume is encoded on this 2D boundary (holographic principle); encrypt at the boundary, protect the volume
3. **Key exchange follows the Page curve** — before the key, ciphertext is maximally random (semantic security); after the key, full information recovery
4. **Semantic security = thermal spectrum** — |Pr[D(C)=1] - Pr[D(U)=1]| < ε is mathematically identical to Hawking radiation having a thermal spectrum

**Supporting literature:** Dvali (2018), Tozzi et al. (2023), Pastawski et al. (2015)

**Security implication:** No other BCI security approach has a physics-derived information-theoretic foundation. The Black Hole Security Principle provides provable guarantees grounded in established physics (not just "we used strong encryption").

Full derivations: QIF-DERIVATION-LOG.md Entry 35

---

*Document version: 4.1*
*Created: 2026-02-02*
*Last updated: 2026-02-07*
*Maintainer: Kevin Qi*
