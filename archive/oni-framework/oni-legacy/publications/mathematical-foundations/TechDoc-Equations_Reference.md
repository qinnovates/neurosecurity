# ONI Framework: Equations Reference

> A comprehensive catalog of every equation used, adapted, or proposed in the ONI Framework — with physical basis, domain of applicability, and current status.

**Author:** Kevin Qi
**Date:** 2026-01-29
**Version:** 1.0

**Keywords:** equations reference, Maxwell, Boltzmann, Nernst, Einstein diffusion, Hodgkin-Huxley, Cole-Cole, Fourier transform, coherence metric, scale-frequency invariant, layer-aware coherence, BCI security

---

## 1. Purpose

The ONI Framework draws on established physics, signal processing, and neuroscience to build a security model for brain-computer interfaces. This document tracks every equation in the framework: where it comes from, what it does, how ONI uses it, and whether it is established science or a proposed extension.

### Status Definitions

| Status | Meaning |
|--------|---------|
| **Established** | Peer-reviewed, empirically validated, widely accepted |
| **Adapted** | Established equation applied in a new context (BCI security) |
| **Proposed** | Novel ONI contribution — theoretically motivated but not yet empirically validated |
| **Open Research** | Identified as needed but not yet formalized |

---

## 2. Master Equations Table

| # | Equation | Formula | Domain | ONI Application | Status | Source |
|---|----------|---------|--------|-----------------|--------|--------|
| 1 | Maxwell's equations (quasi-static) | ∇·(σ∇V) = Iₛ | Electrophysics | Volume conduction in tissue — how electric fields from electrodes and neurons propagate. At BCI frequencies (<10 kHz), displacement current ∂D/∂t is negligible; fields are instantaneous at neural timescales. | **Established** | Maxwell, 1865; Plonsey & Heppner, 1967 |
| 2 | Boltzmann distribution | P ∝ e^(−E/kT) | Statistical mechanics | Ion channel gating probability, thermal noise floor, and the mathematical form of the coherence metric (e^(−σ²) is a Boltzmann factor where variance plays the role of energy). | **Established** | Boltzmann, 1877 |
| 3 | Nernst equation | E = (RT/zF) ln([ion]_out/[ion]_in) | Electrochemistry | Equilibrium potential for Na⁺ (≈+60 mV), K⁺ (≈−90 mV), Ca²⁺ (≈+120 mV), Cl⁻ (≈−80 mV). Defines resting membrane potential (≈−70 mV) and action potential thresholds that BCI signals must respect. | **Established** | Nernst, 1889 |
| 4 | Nernst-Planck equation | J = −D∇c − (zF/RT)Dc∇V | Ion transport | Flux of ions under both concentration gradient (diffusion) and electric field (drift). Describes the actual current carriers in neural tissue: Na⁺, K⁺, Ca²⁺, Cl⁻. Combines Maxwell (field) with Boltzmann (statistics). | **Established** | Nernst, 1889; Planck, 1890 |
| 5 | Einstein diffusion relation | D = kT/(6πηr) | Brownian motion | Neurotransmitter diffusion across the ~20-40 nm synaptic cleft. Governs chemical signaling speed at L9-L10 biology layers. Also: Einstein mobility relation D = μkT/q links diffusion to ion mobility. | **Established** | Einstein, 1905 |
| 6 | Hodgkin-Huxley model | C_m(dV/dt) = −Σ gᵢmᵖhᵍ(V − Eᵢ) + I_ext | Neurophysiology | Action potential generation and propagation. Gating variables (m, h, n) follow Boltzmann statistics; reversal potentials (Eᵢ) come from Nernst. Defines what authentic neural signals look like — the baseline for coherence scoring. | **Established** | Hodgkin & Huxley, 1952 |
| 7 | Cole-Cole model | ε*(ω) = ε_∞ + Σ Δεᵢ/(1+(jωτᵢ)^(1−αᵢ)) + σ_s/(jωε₀) | Dielectric physics | Frequency-dependent dielectric properties of neural tissue. Four dispersions (α: ~Hz, β: ~kHz-MHz, δ: ~100 MHz, γ: ~GHz). Determines signal velocity v(f) = c/√ε_r(f), which is NOT constant — making f × S only approximately constant. | **Established** | Cole & Cole, 1941; Gabriel et al., 1996 |
| 8 | Fourier Transform | X(f) = ∫ x(t)e^(−i2πft) dt | Signal processing | Core analysis tool. Decomposes any neural signal into frequency components, each with amplitude, frequency, and phase. ONI uses Short-Time FFT (STFT) for time-localized analysis. The three coherence dimensions (σ²φ, σ²τ, σ²γ) are computed from these Fourier components. | **Established** | Fourier, 1822 |
| 9 | Euler's formula | e^(iθ) = cos θ + i·sin θ | Mathematics | Foundation of Fourier analysis — sinusoids are projections of circular motion. Connects the circular wavefront visualization to the underlying mathematics. Every neural oscillation is a sinusoidal waveform describable through Euler's formula. | **Established** | Euler, 1748 |
| 10 | Coherence Metric (base) | Cₛ = e^(−(σ²φ + σ²τ + σ²γ)) | BCI security | Signal trustworthiness scoring. Maps total variance across phase (σ²φ), transport (σ²τ), and gain (σ²γ) to a trust score in (0, 1]. Exponential form chosen for: (a) Gaussian likelihood interpretation, (b) sharp biological thresholding, (c) bounded range. NOT Shannon entropy. | **Adapted** | ONI Framework; form analogous to Boltzmann factor |
| 11 | Scale-Frequency Invariant | f × S ≈ k | Neuroscience / BCI | Constrains which frequencies are expected at which spatial scales. From round-trip timing: 2S/v ≤ 1/f → f × S ≤ v/2. For myelinated axons (v ≈ 50 m/s): f × S ≤ 25 m·Hz. Qualitative scaling well-supported; quantitative invariant requires dispersion correction. | **Adapted** | Buzsáki & Draguhn, 2004; ONI derivation |
| 12 | Layer-Aware Coherence Metric | Cₛ(S) = e^(−Σ_f w(f,S)·(σ²φ(f) + σ²τ(f) + σ²γ(f))) | BCI security | Unifies Cₛ and f × S into a single metric. Frequency components weighted by how appropriate they are for the evaluation layer's spatial scale. A signal at the wrong frequency for its layer is penalized even if individual dimensions look normal. | **Proposed** | ONI Framework |
| 13 | Weighting function | w(f, S) = 1 + α·e^(−(f − k/S)²/2δ²) | BCI security | Gaussian weighting centered on expected frequency k/S. Parameters α (penalty amplitude) and δ (bandwidth) require empirical calibration. One of several valid forms; chosen for mathematical elegance (product of exponentials). | **Proposed** | ONI Framework |
| 14 | Shannon charge density limit | Q < 30 μC/cm²/phase | Stimulation safety | Maximum safe charge injection to prevent irreversible tissue damage during electrical stimulation. Used in Neural Firewall WRITE-path safety bounds. | **Established** | Shannon, R. V., 1992 |

---

## 3. The Physics Chain

How the equations connect — from fundamental physics to the ONI security metric:

```
┌─────────────────────────────────────────────────────────────────┐
│  FUNDAMENTAL PHYSICS                                            │
│                                                                 │
│  Maxwell (quasi-static)     Boltzmann distribution              │
│  ∇·(σ∇V) = Iₛ              P ∝ e^(−E/kT)                      │
│       │                          │                              │
│       └──────────┬───────────────┘                              │
│                  ▼                                              │
│  ┌───────────────────────────┐                                  │
│  │  Nernst Equation          │  ← Ion equilibrium potentials    │
│  │  E = (RT/zF)ln([out]/[in])│                                  │
│  └─────────────┬─────────────┘                                  │
│                ▼                                                │
│  ┌───────────────────────────┐   ┌──────────────────────┐       │
│  │  Nernst-Planck            │   │  Einstein Diffusion   │      │
│  │  J = −D∇c − (zF/RT)Dc∇V  │   │  D = kT/(6πηr)       │      │
│  │  (ion transport)          │   │  (neurotransmitters)   │     │
│  └─────────────┬─────────────┘   └──────────┬───────────┘       │
│                └──────────┬─────────────────┘                   │
│                           ▼                                     │
│  ┌──────────────────────────────────────────┐                   │
│  │  Hodgkin-Huxley Model                     │                  │
│  │  C_m(dV/dt) = −Σ gᵢmᵖhᵍ(V−Eᵢ) + I_ext  │                  │
│  │  (action potential = what authentic       │                  │
│  │   neural signals look like)               │                  │
│  └──────────────────┬───────────────────────┘                   │
└─────────────────────┼───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  SIGNAL ANALYSIS                                                │
│                                                                 │
│  ┌──────────────────────┐   ┌──────────────────────────┐        │
│  │  Cole-Cole Model      │   │  Fourier Transform       │       │
│  │  ε*(ω) = ...          │   │  X(f) = ∫x(t)e^(−i2πft)│       │
│  │  (tissue dispersion)  │   │  (signal decomposition)  │       │
│  └──────────┬───────────┘   └──────────┬───────────────┘        │
│             │                          │                        │
│             ▼                          ▼                        │
│  ┌──────────────────────┐   ┌──────────────────────────┐        │
│  │  f × S ≈ k            │   │  σ²φ(f), σ²τ(f), σ²γ(f) │       │
│  │  (scale-frequency)    │   │  (per-frequency variance) │      │
│  └──────────┬───────────┘   └──────────┬───────────────┘        │
│             │                          │                        │
│             └──────────┬───────────────┘                        │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  w(f, S) = 1 + α·e^(−(f−k/S)²/2δ²)                  │      │
│  │  (weighting function — bridges scale-frequency        │      │
│  │   into coherence calculation)                         │      │
│  └──────────────────────┬───────────────────────────────┘       │
└─────────────────────────┼───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  ONI SECURITY METRIC                                            │
│                                                                 │
│  Cₛ(S) = e^(−Σ_f w(f,S) · (σ²φ(f) + σ²τ(f) + σ²γ(f)))        │
│                                                                 │
│  Boltzmann factor form ← established physics                    │
│  Frequency weighting  ← scale-frequency invariant               │
│  Variance components  ← Fourier decomposition                   │
│  Layer spatial scale   ← ONI 14-layer model                     │
│                                                                 │
│  Status: PROPOSED (components established; unification is new)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. What Is NOT Used (And Why)

| Equation | Why Excluded |
|----------|--------------|
| **Einstein's relativity (E=mc², spacetime curvature)** | Axonal conduction velocity is ~1-100 m/s — not remotely relativistic. Including relativity would be physically unjustified and would undermine credibility. |
| **Newton's laws (F=ma) directly** | Forces on ions are real but already captured by the Nernst-Planck equation, which is the correct formulation for charged particles in solution. Newton is the ancestor; Nernst-Planck is the working equation. |
| **Schrödinger equation (quantum mechanics)** | Neural processes operate at classical scales. While speculative proposals exist (Penrose-Hameroff orchestrated objective reduction), there is no empirical evidence that quantum coherence plays a functional role in neural computation at physiological temperatures. ONI's quantum section addresses quantum *encryption*, not quantum *biology*. |
| **Shannon entropy (H = −Σ p(x) log p(x))** | Previously claimed as the interpretation of the Cₛ exponent — this was incorrect. Variance ≠ entropy. The Cₛ form is a Gaussian likelihood / Boltzmann factor, not an entropy measure. Shannon entropy may be relevant to future injection detection research (see Mathematical Foundations, §6.4) but is not currently used in any ONI equation. |

---

## 5. Equations by ONI Layer

Where each equation is most relevant in the 14-layer stack:

| ONI Layer | Primary Equations | What They Govern |
|-----------|-------------------|------------------|
| **L1** Physical Carrier | Maxwell (quasi-static), Shannon charge limit | Field distribution at electrode-tissue interface, stimulation safety |
| **L2** Signal Processing | Fourier Transform, Cole-Cole | ADC sampling, frequency-dependent tissue response |
| **L3-L7** Digital Layers | *(conventional digital security — checksums, encryption, protocols)* | Not governed by analog physics equations |
| **L8** Neural Gateway | **Cₛ(S)**, w(f,S), Fourier, Boltzmann | The firewall — real-time coherence scoring at the bio-digital boundary |
| **L9** Bio Signal Processing | Hodgkin-Huxley, Nernst, Boltzmann | Action potential dynamics, ion channel gating |
| **L10** Neural Protocol | Hodgkin-Huxley, f × S ≈ k | Neural oscillation encoding, frequency-scale validation |
| **L11** Cognitive Transport | Einstein diffusion, Nernst-Planck | Neurotransmitter transport, inter-regional signaling |
| **L12** Cognitive Session | f × S ≈ k, Fourier | Cross-hemispheric synchronization, delta/theta rhythms |
| **L13** Semantic Layer | f × S ≈ k | Large-scale integration, infra-slow oscillations |
| **L14** Identity & Ethics | f × S ≈ k | Whole-brain state, ultra-slow dynamics |

---

## 6. Open Research

Equations identified as needed but not yet formalized:

| ID | Description | Required For | Depends On |
|----|-------------|--------------|------------|
| OR-1 | Dispersion-corrected k(f) | Quantitative f × S at each layer | Cole-Cole parameters for human neural tissue |
| OR-2 | Empirical w(f, S) calibration | Layer-aware Cₛ(S) implementation | Real BCI/EEG data via BrainFlow/Neuromore/MOABB — see [prd.json](../../project/prd.json) `layer-aware-coherence-implementation` |
| OR-3 | Entropy-based injection detection | Complementary detection metric | Shannon entropy profiling of authentic vs. injected signals |
| OR-4 | Anisotropic conductivity tensor | Directional coherence signatures | DTI conductivity data (Tuch et al., 2001) |
| OR-5 | Computational complexity bound | Real-time feasibility proof | Cₛ(S) profiling on FPGA/embedded GPU |

---

## 7. References

1. Boltzmann, L. (1877). Über die Beziehung zwischen dem zweiten Hauptsatze der mechanischen Wärmetheorie und der Wahrscheinlichkeitsrechnung. *Wiener Berichte*, 76, 373-435.

2. Buzsáki, G., & Draguhn, A. (2004). Neuronal oscillations in cortical networks. *Science*, 304(5679), 1926-1929.

3. Cole, K. S., & Cole, R. H. (1941). Dispersion and absorption in dielectrics. *Journal of Chemical Physics*, 9(4), 341-351.

4. Einstein, A. (1905). Über die von der molekularkinetischen Theorie der Wärme geforderte Bewegung von in ruhenden Flüssigkeiten suspendierten Teilchen. *Annalen der Physik*, 322(8), 549-560.

5. Euler, L. (1748). *Introductio in analysin infinitorum*. Bousquet.

6. Fourier, J. B. J. (1822). *Théorie analytique de la chaleur*. Firmin Didot.

7. Gabriel, S., Lau, R. W., & Gabriel, C. (1996). The dielectric properties of biological tissues: III. Parametric models for the dielectric spectrum of tissues. *Physics in Medicine & Biology*, 41(11), 2271-2293.

8. Hodgkin, A. L., & Huxley, A. F. (1952). A quantitative description of membrane current and its application to conduction and excitation in nerve. *Journal of Physiology*, 117(4), 500-544.

9. Maxwell, J. C. (1865). A dynamical theory of the electromagnetic field. *Philosophical Transactions of the Royal Society of London*, 155, 459-512.

10. Nernst, W. (1889). Die elektromotorische Wirksamkeit der Jonen. *Zeitschrift für Physikalische Chemie*, 4, 129-181.

11. Nunez, P. L., & Srinivasan, R. (2006). *Electric Fields of the Brain: The Neurophysics of EEG* (2nd ed.). Oxford University Press.

12. Plonsey, R., & Heppner, D. B. (1967). Considerations of quasi-stationarity in electrophysiological systems. *Bulletin of Mathematical Biophysics*, 29(4), 657-664.

13. Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379-423.

14. Shannon, R. V. (1992). A model of safe levels for electrical stimulation. *IEEE Transactions on Biomedical Engineering*, 39(4), 424-426.

15. Tuch, D. S., Wedeen, V. J., Dale, A. M., George, J. S., & Belliveau, J. W. (2001). Conductivity tensor mapping of the human brain using diffusion tensor MRI. *Proceedings of the National Academy of Sciences*, 98(20), 11697-11701.

---

## Acknowledgments

The author wishes to acknowledge the support of colleagues and mentors in the development of this work. Initial research validation was conducted through LMArena (LMSYS, 2024-2025), enabling cross-model verification of hypotheses and findings to mitigate single-model bias. Deep research synthesis and writing assistance was provided by Claude (Anthropic, 2025). All original ideas, theoretical frameworks, analyses, and conclusions are the author's own. Final revisions, editing, and validation were performed by the author.

---

*© 2026 Kevin Qi. ONI Neuroassurance Stack*
*Open source under Apache 2.0 License*
