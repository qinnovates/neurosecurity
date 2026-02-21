# Mathematical Foundations of the ONI Framework

*Corrected Physics, Labeled Hypotheses, and Expansion Stubs*

**Author:** Kevin Qi + Claude (QI Collaboration)
**Date:** 2026-01-29
**Status:** Living document — sections marked [STUB] require expansion
**Tags:** mathematical-foundations, volume-conduction, quasi-static, coherence-metric, scale-frequency, fourier, dispersion, anisotropy

---

## Abstract

This document establishes the corrected mathematical foundations of the ONI Framework, replacing inaccurate claims identified in the [Mathematical Audit](TechDoc-Mathematical_Audit.md) with empirically grounded physics. Each section is labeled with its epistemic status: **Established** (peer-reviewed consensus), **Hypothesis** (ONI contribution, untested), or **Stub** (requires further research). The document is designed for expansion — each stub section includes the specific question to answer, the method to answer it, and the expected output.

**Keywords:** volume conduction, quasi-static approximation, anisotropic conductivity, Cole-Cole dispersion, coherence metric, scale-frequency, Fourier analysis, signal processing, neural tissue, BCI security

---

## 1. The Signal Processing Chain (What's Valid)

**Status: Established**

The mathematical chain from trigonometry to Fourier analysis is standard:

### 1.1 Trigonometric Foundation

```
sin(θ) = opposite / hypotenuse    (right triangle, hypotenuse = 1)
cos(θ) = adjacent / hypotenuse

Point on unit circle: (cos θ, sin θ)
Identity: cos²θ + sin²θ = 1        (Pythagorean theorem = circle equation)
```

### 1.2 Sine Wave as Circular Motion

Plotting sin(θ) as θ increases linearly with time (θ = ωt) produces a sinusoidal wave:

```
y(t) = A · sin(ωt + φ)

where:
  A = amplitude (radius of circle)
  ω = angular frequency = 2πf (angular velocity)
  f = frequency (rotations per second)
  φ = phase (starting angle)
```

This is a mathematical identity, not an approximation.

### 1.3 Fourier Decomposition

For any square-integrable signal x(t) (finite energy — satisfied by all real BCI recordings):

```
x(t) = Σₙ Aₙ · sin(2πfₙt + φₙ)

Equivalently (complex form):
X(f) = ∫ x(t) · e^(−j2πft) dt
```

Each term in the sum is a sine wave (spinning circle) with specific amplitude Aₙ, frequency fₙ, and phase φₙ.

**Convergence conditions (Dirichlet, 1829; Carleson, 1966):** The signal must be square-integrable (L²). For signals with discontinuities, convergence is pointwise except at the discontinuity (Gibbs phenomenon: ~9% overshoot). All practical BCI signals satisfy these conditions.

**This is the valid mathematical foundation for ONI's signal analysis.**

---

## 2. The Physical Reality: How BCI Signals Actually Behave

**Status: Established (corrections to previous claims)**

### 2.1 The Quasi-Static Regime

At BCI-relevant frequencies (0.5 Hz – 10 kHz), electromagnetic wavelengths in neural tissue are hundreds of meters — far larger than the brain. The electric field is governed by **Laplace's equation**, not the wave equation:

```
Quasi-static field:  ∇ · (σ∇V) = Iₛ    (Poisson's equation with source current)
NOT wave equation:   ∇²E = με ∂²E/∂t²   (does not apply at these frequencies)

where:
  σ = conductivity tensor (anisotropic — see Section 2.2)
  V = electric potential
  Iₛ = source current density (from electrode or neural activity)
```

**What this means for ONI:**
- BCI signals do not "propagate" as wavefronts through tissue
- The electric potential distribution is established quasi-instantaneously
- The field falls off with distance according to the conductivity structure
- The correct model is **volume conduction** (Nunez & Srinivasan, 2006)

**Implication for L8 gateway:** The gateway analyzes volume-conducted potentials, not wavefront arrivals. Detection should be based on spatial potential distributions and their temporal evolution, not on wavefront propagation speed or direction.

### 2.2 Anisotropic Conductivity

Neural tissue has direction-dependent conductivity described by a 3×3 tensor:

```
σ = | σ_xx  σ_xy  σ_xz |
    | σ_yx  σ_yy  σ_yz |
    | σ_zx  σ_zy  σ_zz |

White matter (myelinated axon bundles):
  Along fibers:  σ_∥ ≈ 0.65 S/m
  Across fibers: σ_⊥ ≈ 0.065 S/m
  Ratio: ~10:1 (Tuch et al., 2001)

Gray matter: More isotropic, σ ≈ 0.33 S/m
CSF: Isotropic, σ ≈ 1.79 S/m
Skull: σ ≈ 0.01 S/m (low conductivity barrier)
```

**What this means for ONI:**
- Equipotential surfaces around electrodes are **ellipsoidal or irregular**, not spherical
- The spatial pattern of a signal depends on the local tissue structure
- Diffusion tensor imaging (DTI) can map the conductivity tensor in vivo
- **Security opportunity:** An injected signal from the wrong location would have the wrong spatial signature given the local conductivity tensor — a detection feature unavailable in the wavefront model

### 2.3 Volume Conduction Model

[STUB — Expand with full derivation]

**Question:** What is the exact potential distribution V(r) for a point electrode in an anisotropic medium?

**Method:** Derive from ∇ · (σ∇V) = Iₛδ(r) with appropriate boundary conditions (brain surface, skull, scalp). Compare analytic solutions (concentric sphere model) with numerical solutions (FEM on realistic head geometry).

**Expected output:** Closed-form or numerical V(r) showing how electrode potentials spread through the ONI layer structure. This replaces the wavefront model.

**Key references to expand from:**
- Nunez, P. L., & Srinivasan, R. (2006). *Electric Fields of the Brain* (2nd ed.). Oxford University Press.
- Hallez, H., et al. (2007). Review on solving the forward problem in EEG source analysis. *Journal of NeuroEngineering and Rehabilitation*, 4(1), 46.

---

## 3. The Coherence Metric — Corrected Specification

### 3.1 Formula and Motivation

**Status: Hypothesis (ONI contribution)**

```
Cₛ = e^(−(σ²φ + σ²τ + σ²γ))
```

**Corrected motivation (replacing "Shannon entropy" claim):**

The exponential form is a **design choice** motivated by:

1. **Gaussian likelihood interpretation:** If Fourier component deviations are normally distributed with zero mean, then `e^(−σ²)` is proportional to the probability of observing zero deviation. Total coherence is the joint probability across all three dimensions (phase, transport, gain), assuming independence.

2. **Sharp threshold behavior:** The exponential creates rapid decay: Cₛ ≈ 1 when total variance is low, but collapses rapidly past a critical variance. This models biological all-or-nothing gating.

3. **Bounded range:** Cₛ ∈ (0, 1], with Cₛ = 1 when all variances are zero (perfect coherence) and Cₛ → 0 as variance increases.

**What this is NOT:** Shannon entropy. Variance and entropy are different quantities. For Gaussian distributions, entropy H = ½ ln(2πeσ²) — a logarithmic function of variance, not a linear sum.

### 3.2 Component Definitions

| Component | Symbol | What It Measures | Fourier Connection |
|-----------|--------|------------------|--------------------|
| **Phase variance** | σ²φ | Stability of phase angles across time windows | Variance of φₙ across consecutive STFT windows |
| **Transport variance** | σ²τ | Stability of spectral timing/frequency content | Variance of power spectral density across windows |
| **Gain variance** | σ²γ | Stability of amplitude envelope | Variance of Aₙ across consecutive STFT windows |

### 3.3 Estimation Specification

[STUB — Expand with complete specification]

**Question:** What STFT parameters produce reliable Cₛ estimates within the <1ms latency constraint?

**Parameters to specify:**
- Window function: Hanning, Hamming, or multitaper?
- Window length: Must capture at least 1 full cycle of lowest frequency of interest (e.g., 4 Hz theta → 250ms minimum window)
- Overlap: 50% (Welch's method) or higher?
- Number of windows N for variance estimation: N = ? (tradeoff: more windows → more reliable variance, but longer latency)
- Frequency bands: All FFT bins, or band-averaged (delta/theta/alpha/beta/gamma)?
- Statistical test: Z-score against baseline? Mahalanobis distance? Likelihood ratio?

**Expected output:** A fully specified algorithm that can be implemented and tested on public EEG datasets (PhysioNet, BNCI Horizon 2020).

**Key references to expand from:**
- Welch, P. D. (1967). The use of fast Fourier transform for the estimation of power spectra. *IEEE Transactions on Audio and Electroacoustics*, 15(2), 70–73.
- Babadi, B., & Brown, E. N. (2014). A review of multitaper spectral analysis. *IEEE Transactions on Biomedical Engineering*, 61(5), 1555–1564.

### 3.4 Alternative Formulations to Investigate

[STUB — Expand with comparative analysis]

**Question:** Is the exponential form optimal, or would alternative Cₛ formulations perform better on real data?

**Candidates:**
```
Exponential:      Cₛ = e^(−(σ²φ + σ²τ + σ²γ))           ← current
Weighted exp:     Cₛ = e^(−(w₁σ²φ + w₂σ²τ + w₃σ²γ))     ← learnable weights
Mahalanobis:      Cₛ = e^(−d²_M(x, μ_baseline))          ← accounts for covariance
Product form:     Cₛ = e^(−σ²φ) · e^(−σ²τ) · e^(−σ²γ)   ← independent per-dimension
Likelihood ratio: Cₛ = P(signal|baseline) / P(signal|attack)  ← Neyman-Pearson optimal
```

**Method:** Test each on labeled EEG data (authentic vs. simulated injection). Compare ROC curves, AUC, and false positive rates at fixed detection thresholds.

---

## 4. The Scale-Frequency Relationship — Corrected

### 4.1 Original Claim and Its Problem

**Status: Hypothesis (requires correction)**

**Original:** f × S ≈ k, derived from v = fλ where v = constant.

**Problem:** Neural tissue is dispersive. The complex permittivity follows the Cole-Cole model (Cole & Cole, 1941; Gabriel et al., 1996):

```
ε*(ω) = ε_∞ + Σᵢ Δεᵢ / (1 + (jωτᵢ)^(1−αᵢ)) + σ_s / (jωε₀)

Four dispersions in biological tissue:
  α-dispersion:  ~Hz–kHz      (ionic diffusion, membrane effects)
  β-dispersion:  ~kHz–MHz     (cell membrane capacitance — Maxwell-Wagner)
  δ-dispersion:  ~100 MHz     (protein-bound water)
  γ-dispersion:  ~GHz         (free water relaxation)
```

Since ε(f) varies with frequency, so does v(f) = c/√ε_r(f). Therefore f × λ(f) = v(f) ≠ constant.

### 4.2 Corrected Formulation

[STUB — Expand with quantitative model]

**Question:** What is the actual f × S relationship in neural tissue when dispersion is accounted for?

**Approach:**
1. Use Gabriel et al. (1996) tissue parameters to compute ε(f) from 0.5 Hz to 100 kHz
2. Compute v(f) = c / √Re(ε_r(f)) at each frequency
3. Plot f × λ(f) = v(f) — this gives the actual "invariant" (which will be a curve, not a constant)
4. Determine if a corrected invariant exists: f × S ≈ k(f) where k(f) can be characterized

**Expected output:** A frequency-dependent scaling function k(f) that replaces the constant k. This preserves the qualitative insight (higher frequency → smaller spatial scale) while being quantitatively accurate.

**Note:** For the quasi-static regime (BCI frequencies), the concept of "spatial scale" should be reinterpreted as the **spatial extent of significant potential contribution** (e.g., the distance at which the volume-conducted potential falls to 1/e of its electrode value), not wavelength.

### 4.3 Qualitative Scaling (What's Preserved)

Despite the dispersion issue, the qualitative observation holds in neuroscience:

| Frequency Band | Spatial Scale | Neural Phenomenon |
|---------------|---------------|-------------------|
| Delta (0.5–4 Hz) | Whole-brain | Slow oscillations, sleep waves |
| Theta (4–8 Hz) | Regional (hippocampus, cortical loops) | Memory encoding, navigation |
| Alpha (8–13 Hz) | Cortical region | Idle rhythm, sensory gating |
| Beta (13–30 Hz) | Local cortical area | Motor planning, active thinking |
| Gamma (30–100 Hz) | Cortical column (~1mm) | Feature binding, consciousness |
| High-gamma (>100 Hz) | Single neuron/small cluster | Spike-related activity |

This is well-documented (Buzsáki & Draguhn, 2004) and does not depend on the wave equation — it follows from the anatomical structure of neural circuits (larger circuits → longer conduction delays → slower oscillation frequencies).

**References:**
- Buzsáki, G., & Draguhn, A. (2004). Neuronal oscillations in cortical networks. *Science*, 304(5679), 1926–1929.

### 4.4 Reframing for ONI Layer Model

[STUB — Expand with layer-specific transfer functions]

**Question:** If f × S ≈ k is only qualitatively true, how should ONI layers define their frequency-scale boundaries?

**Approach:** Instead of a single invariant, define per-layer transfer functions:

```
Layer_n: H_n(f) = frequency response of layer n

Silicon layers (L1-L7):  Hardware-defined bandpass (ADC sampling rate, filter design)
Gateway (L8):            Adaptive passband based on Cₛ baseline
Biology layers (L9-L14): Anatomy-defined (cortical column → whole-brain)
```

This replaces the single invariant with a layered filter bank, which is both more accurate and more implementable.

---

## 5. Dual Validation System — Corrected

### 5.1 How Cₛ and Layer Frequency Profiles Work Together

**Status: Hypothesis (corrected from original)**

The two security checks serve complementary functions:

```
                     Incoming Signal
                          │
                ┌─────────┴─────────┐
                │                   │
          Fourier Decomposition     Spatial Analysis
          (STFT → {Aₙ, fₙ, φₙ})   (Volume conduction pattern)
                │                   │
        ┌───────┴───────┐          │
        │               │          │
   Cₛ Check        Layer Check    Spatial Check
   (component       (frequency    (conductivity
    stability)      profile       tensor match)
                    match)
        │               │          │
        └───────┬───────┘          │
                │                  │
           Pass/Fail          Pass/Fail
                │                  │
                └────────┬─────────┘
                         │
                   L8 Gateway Decision
```

| Check | What It Validates | Mathematical Basis | Status |
|-------|-------------------|--------------------|--------|
| **Cₛ** | Are the Fourier components stable over time? | Variance of STFT components across windows | Hypothesis — needs specification (Section 3.3) |
| **Layer frequency profile** | Is the signal's frequency content appropriate for the target layer? | Per-layer transfer function H_n(f) | Hypothesis — needs layer-specific definitions (Section 4.4) |
| **Spatial signature** | Does the potential distribution match expected tissue geometry? | Volume conduction + anisotropic conductivity tensor | Hypothesis — new check enabled by corrected physics (Section 2.3) |

**Note:** The spatial signature check is a **new capability** that emerges from the corrected physics. The wavefront model couldn't distinguish direction; the volume conduction model can, because the conductivity tensor imposes directional structure on the potential field.

---

## 6. Additional Mathematical Concepts for Expansion

### 6.1 Cross-Frequency Coupling (CFC)

[STUB — High priority for biometric authentication]

**Question:** Can phase-amplitude coupling serve as a neural biometric that attackers cannot replicate?

**Background:** In biological neural signals, the amplitude of high-frequency oscillations (gamma, 30-100 Hz) is modulated by the phase of low-frequency oscillations (theta, 4-8 Hz). This is called **phase-amplitude coupling (PAC)** and is believed to reflect hierarchical neural computation (Canolty & Knight, 2010).

**Security relevance:** An attacker would need to replicate not just the correct frequencies and amplitudes, but also the correct *coupling between frequency bands*. This is a higher-order statistical property that may serve as a biometric fingerprint.

**Method to investigate:**
1. Compute PAC from authentic EEG using the modulation index (Tort et al., 2010)
2. Generate synthetic signals with matched power spectra but without PAC
3. Test whether Cₛ (current formulation) detects the difference
4. If not, define a CFC-augmented coherence metric

**Key references:**
- Canolty, R. T., & Knight, R. T. (2010). The functional role of cross-frequency coupling. *Trends in Cognitive Sciences*, 14(11), 506–515.
- Tort, A. B. L., Komorowski, R., Eichenbaum, H., & Kopell, N. (2010). Measuring phase-amplitude coupling between neuronal oscillations of different frequencies. *Journal of Neurophysiology*, 104(2), 1195–1210.

### 6.2 Wavelet-Based Coherence

[STUB — Alternative to FFT for non-stationary signals]

**Question:** Would a wavelet-based Cₛ outperform FFT-based Cₛ for detecting transient injection attacks?

**Background:** The FFT assumes stationarity within its analysis window. Neural signals are non-stationary — they change with cognitive state, attention, and arousal. Continuous wavelet transforms (CWT) provide time-frequency resolution without a fixed window.

**Method:**
1. Define Cₛ_wavelet using variance of wavelet coefficients instead of FFT bins
2. Compare detection performance on synthetic injection attacks (transient vs. sustained)
3. Evaluate computational cost for real-time operation

**Key references:**
- Mallat, S. (2009). *A Wavelet Tour of Signal Processing* (3rd ed.). Academic Press.

### 6.3 Hilbert Transform for Instantaneous Phase

[STUB — Real-time phase tracking]

**Question:** Can the Hilbert transform provide real-time σ²φ estimates without windowed FFT?

**Background:** The analytic signal z(t) = x(t) + jH{x(t)} (where H is the Hilbert transform) yields instantaneous amplitude A(t) and phase φ(t) at every time point:

```
A(t) = |z(t)|
φ(t) = arg(z(t))
```

This could provide sample-by-sample phase tracking, enabling sub-window anomaly detection.

**Key references:**
- Boashash, B. (1992). Estimating and interpreting the instantaneous frequency of a signal. *Proceedings of the IEEE*, 80(4), 520–568.

### 6.4 Information-Theoretic Measures

[STUB — Entropy-based detection]

**Question:** Do authentic neural signals have a characteristic Shannon entropy profile that injected signals violate?

**Method:**
1. Compute differential entropy H(x) = −∫ p(x) log p(x) dx for authentic EEG epochs
2. Characterize the entropy profile across frequency bands and cognitive states
3. Test whether simulated injection attacks produce detectable entropy deviations
4. Compare entropy-based detection with variance-based Cₛ

**Key references:**
- Cover, T. M., & Thomas, J. A. (2006). *Elements of Information Theory* (2nd ed.). Wiley.

### 6.5 Granger Causality and Transfer Entropy

[STUB — Multi-channel directional coherence]

**Question:** Do authentic multi-channel BCI signals exhibit causal relationships that injected signals lack?

**Background:** Granger causality measures whether past values of channel A predict future values of channel B. Transfer entropy generalizes this to nonlinear relationships. Natural neural activity has characteristic directional information flow patterns (e.g., sensory → motor, top-down → bottom-up).

**Security relevance:** An injected signal on one channel would not exhibit the causal relationships with neighboring channels that natural activity does.

**Key references:**
- Granger, C. W. J. (1969). Investigating causal relations by econometric models and cross-spectral methods. *Econometrica*, 37(3), 424–438.
- Schreiber, T. (2000). Measuring information transfer. *Physical Review Letters*, 85(2), 461.

### 6.6 Topological Data Analysis (TDA)

[STUB — Noise-robust structural detection]

**Question:** Can persistent homology detect attack signatures that survive noise and are invisible to frequency analysis?

**Background:** TDA examines the "shape" of data through persistent homology — identifying topological features (connected components, loops, voids) that persist across multiple scales. Applied to time-delay embeddings of neural signals, TDA can reveal structural properties invisible to spectral methods.

**Key references:**
- Giusti, C., Ghrist, R., & Bassett, D. S. (2016). Two's company, three (or more) is a simplex: Algebraic-topological tools for understanding higher-order structure in neural data. *Journal of Computational Neuroscience*, 41(1), 1–14.

### 6.7 Kalman Filtering / State-Space Models

[STUB — Predictive anomaly detection]

**Question:** Can a Kalman filter predict expected neural signal trajectory and flag deviations in real-time?

**Background:** State-space models represent the neural signal as a hidden state evolving according to a dynamical system. The Kalman filter provides optimal estimates of the hidden state given noisy observations. Deviations from the predicted state (innovation sequence) could serve as an anomaly detector.

**Key references:**
- Eden, U. T., et al. (2004). Dynamic analysis of neural encoding by point process adaptive filtering. *Neural Computation*, 16(5), 971–998.

### 6.8 Destructive Interference: Active Signal Cancellation

[STUB — Active defense via Fourier anti-phase generation]

**Status: Established physics (new application to BCI security)**

**Question:** Can the same Fourier decomposition used for detection also neutralize malicious WRITE-path injections via destructive interference?

**Background:** When a malicious signal's frequency components are identified, an anti-phase counterpart (each component shifted by π radians) can be generated and superimposed. The peaks of the malicious signal align with troughs of the cancellation signal, producing zero net effect:

```
Malicious signal:     A·sin(ωt + φ)
Cancellation signal:  A·sin(ωt + φ + π) = −A·sin(ωt + φ)
Superposition:        A·sin(ωt + φ) + (−A·sin(ωt + φ)) = 0
```

This is established across multiple domains:

| Domain | Application | Reference |
|--------|------------|-----------|
| Consumer audio | Active noise cancellation (ANC) | Kuo & Morgan, 1999 |
| Neural prosthetics | Cochlear implant artifact rejection | Wichmann, 2000 |
| Clinical EEG | Line noise removal (50/60 Hz) | Mitra & Bhatt, 2021 |
| Telecom | 5G OFDM encoding/decoding | 3GPP TS 38.211 |
| MRI | Gradient artifact cancellation in EEG-fMRI | Allen et al., 2000 |

**Application to neural defense:**
1. Baseline establishment → Fourier decomposition of authentic neural signature
2. Injection detection → STFT flags anomalous components
3. Active cancellation → Anti-phase counter-stimulation for WRITE-path attacks
4. Residual monitoring → Post-cancellation re-evaluation

**Open questions for expansion:**
- What is the minimum detection-to-cancellation latency achievable in implanted hardware?
- Can the cancellation signal itself cause unintended neural effects?
- How does cancellation perform against non-stationary or broadband attacks?
- Is template subtraction (time-domain) or FFT-based anti-phase (frequency-domain) more robust?

**Key references:**
- Kuo, S. M., & Morgan, D. R. (1999). Active noise control: A tutorial review. *Proceedings of the IEEE*, 87(6), 943–973.
- Wichmann, T. (2000). A digital averaging method for removal of stimulus artifacts in neurophysiologic experiments. *Journal of Neuroscience Methods*, 98(1), 57–62.
- Allen, P. J., Josephs, O., & Turner, R. (2000). A method for removing imaging artifact from continuous EEG recorded during functional MRI. *NeuroImage*, 12(2), 230–239.

---

## 7. TARA Integration Roadmap

### 7.1 What TARA Needs from These Foundations

| TARA Component | Mathematical Foundation Needed | Status |
|---------------|-------------------------------|--------|
| `tara_mvp/core/coherence.py` | Fully specified Cₛ with STFT parameters | Stub (Section 3.3) |
| `tara_mvp/core/scale_freq.py` | Dispersion-corrected f × S relationship | Stub (Section 4.2) |
| `tara_mvp/nsam/` | Volume conduction spatial model for L8 | Stub (Section 2.3) |
| `tara_mvp/attacks/` | CFC-based attack detection | Stub (Section 6.1) |
| `tara_mvp/defense/cancellation.py` | Active cancellation via destructive interference | Stub (Section 6.8) |
| `tara_mvp/simulation/` | Realistic volume conduction simulation | Stub (Section 2.3) |

### 7.2 Implementation Order

```
Phase 1: Specification (no code changes)
├── Specify STFT parameters for Cₛ (Section 3.3)
├── Compute v(f) from Cole-Cole parameters (Section 4.2)
└── Define per-layer frequency profiles (Section 4.4)

Phase 2: Validation (test on public data)
├── Implement specified Cₛ on PhysioNet EEG data
├── Compare alternative Cₛ formulations (Section 3.4)
├── Validate frequency profiles against known EEG norms
└── Compute PAC baselines from authentic data (Section 6.1)

Phase 3: Integration (TARA code changes)
├── Update tara_mvp/core/coherence.py with specified parameters
├── Add wavelet-based Cₛ option (Section 6.2)
├── Add CFC check as auxiliary detection (Section 6.1)
└── Add spatial signature check (Section 5.1)
```

---

## References

Babadi, B., & Brown, E. N. (2014). A review of multitaper spectral analysis. *IEEE Transactions on Biomedical Engineering*, 61(5), 1555–1564.

Boashash, B. (1992). Estimating and interpreting the instantaneous frequency of a signal. *Proceedings of the IEEE*, 80(4), 520–568.

Buzsáki, G., & Draguhn, A. (2004). Neuronal oscillations in cortical networks. *Science*, 304(5679), 1926–1929.

Canolty, R. T., & Knight, R. T. (2010). The functional role of cross-frequency coupling. *Trends in Cognitive Sciences*, 14(11), 506–515.

Carleson, L. (1966). On convergence and growth of partial sums of Fourier series. *Acta Mathematica*, 116, 135–157.

Cole, K. S., & Cole, R. H. (1941). Dispersion and absorption in dielectrics. *Journal of Chemical Physics*, 9(4), 341–351.

Cover, T. M., & Thomas, J. A. (2006). *Elements of Information Theory* (2nd ed.). Wiley.

Eden, U. T., Frank, L. M., Barbieri, R., Solo, V., & Brown, E. N. (2004). Dynamic analysis of neural encoding by point process adaptive filtering. *Neural Computation*, 16(5), 971–998.

Fourier, J. (1822). *Theorie analytique de la chaleur*. Firmin Didot.

Gabriel, S., Lau, R. W., & Gabriel, C. (1996). The dielectric properties of biological tissues: II. Measurements in the frequency range 10 Hz to 20 GHz. *Physics in Medicine & Biology*, 41(11), 2251.

Gabriel, S., Lau, R. W., & Gabriel, C. (1996). The dielectric properties of biological tissues: III. Parametric models for the dielectric spectrum of tissues. *Physics in Medicine & Biology*, 41(11), 2271.

Giusti, C., Ghrist, R., & Bassett, D. S. (2016). Two's company, three (or more) is a simplex. *Journal of Computational Neuroscience*, 41(1), 1–14.

Granger, C. W. J. (1969). Investigating causal relations by econometric models and cross-spectral methods. *Econometrica*, 37(3), 424–438.

Hallez, H., Vanrumste, B., Grech, R., Muscat, J., De Clercq, W., Vergult, A., ... & Lemahieu, I. (2007). Review on solving the forward problem in EEG source analysis. *Journal of NeuroEngineering and Rehabilitation*, 4(1), 46.

Hodgkin, A. L., & Huxley, A. F. (1952). A quantitative description of membrane current. *Journal of Physiology*, 117(4), 500–544.

Jacques, S. L. (2013). Optical properties of biological tissues: A review. *Physics in Medicine & Biology*, 58(11), R37.

Mallat, S. (2009). *A Wavelet Tour of Signal Processing* (3rd ed.). Academic Press.

Nunez, P. L., & Srinivasan, R. (2006). *Electric Fields of the Brain* (2nd ed.). Oxford University Press.

Plonsey, R., & Heppner, D. B. (1967). Considerations of quasi-stationarity in electrophysiological systems. *Bulletin of Mathematical Biophysics*, 29(4), 657–664.

Schreiber, T. (2000). Measuring information transfer. *Physical Review Letters*, 85(2), 461.

Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379–423.

Tort, A. B. L., Komorowski, R., Eichenbaum, H., & Kopell, N. (2010). Measuring phase-amplitude coupling. *Journal of Neurophysiology*, 104(2), 1195–1210.

Tuch, D. S., Wedeen, V. J., Dale, A. M., George, J. S., & Belliveau, J. W. (2001). Conductivity tensor mapping of the human brain using diffusion tensor MRI. *Proceedings of the National Academy of Sciences*, 98(20), 11697–11701.

Welch, P. D. (1967). The use of fast Fourier transform for the estimation of power spectra. *IEEE Transactions on Audio and Electroacoustics*, 15(2), 70–73.

---

## Acknowledgments

> The author wishes to acknowledge the support of colleagues and mentors in the development of this work. Initial research validation was conducted through LMArena (LMSYS, 2024-2025), enabling cross-model verification of hypotheses and findings to mitigate single-model bias. Deep research synthesis and writing assistance was provided by Claude (Anthropic, 2025). All original ideas, theoretical frameworks, analyses, and conclusions are the author's own. Final revisions, editing, and validation were performed by the author.

---

*Document created: 2026-01-29*
*Author: Kevin Qi + Claude (QI Collaboration)*
*For: ONI Framework — qinnovates/mindloft*
*Location: MAIN/legacy-core/publications/mathematical-foundations/TechDoc-Mathematical_Foundations.md*
