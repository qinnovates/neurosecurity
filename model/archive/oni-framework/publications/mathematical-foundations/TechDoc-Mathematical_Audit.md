# Mathematical Audit of the ONI Framework

*A Rigorous Examination of Core Mathematical Claims*

**Author:** Kevin Qi + Claude (QI Collaboration)
**Date:** 2026-01-29
**Status:** Living document — expand as claims are resolved
**Tags:** mathematical-rigor, coherence-metric, scale-frequency, fourier, quasi-static, audit

---

## Abstract

The ONI Framework makes a series of mathematical claims connecting trigonometry, wave physics, Fourier analysis, and two core security primitives: the Coherence Metric (Cₛ = e^(−(σ²φ + σ²τ + σ²γ))) and the Scale-Frequency Invariant (f × S ≈ k). This document audits each claim against established mathematics and empirical physics, identifying seven issues ranging from fundamental physical errors to minor overstatements. For each issue, we provide the incorrect claim, the correct physics, the severity, and a path to resolution.

**Keywords:** mathematical verification, quasi-static fields, volume conduction, anisotropy, Shannon entropy, dispersion, Cole-Cole model, Fourier convergence, coherence metric, scale-frequency invariant

---

## 1. Audit Methodology

Each claim was evaluated against:

1. **Mathematical definitions** — Does the claim use terms correctly? (e.g., entropy vs. variance)
2. **Physical regime** — Is the claimed physics applicable at BCI-relevant scales and frequencies?
3. **Empirical evidence** — Does published literature support or contradict the claim?
4. **Internal consistency** — Do the claims contradict each other within the framework?

### Severity Classification

| Severity | Definition |
|----------|-----------|
| **Fundamental** | The claim contradicts established physics at the relevant scale; must be corrected |
| **Significant** | The claim is a meaningful oversimplification that could mislead; should be corrected |
| **Overstated** | The claim is directionally correct but presented with too much certainty; should be softened |
| **Minor** | Technically imprecise but acceptable for pedagogical purposes; note for completeness |

---

## 2. Claims That Are Valid

Before addressing problems, these claims hold up:

### 2.1 Triangle Ratios Define Sine and Cosine (Valid)

sin(θ) = opposite/hypotenuse and cos(θ) = adjacent/hypotenuse for a right triangle with hypotenuse 1. This is the standard definition from Euclidean geometry.

### 2.2 Unit Circle Parametrization (Valid)

A point on the unit circle at angle θ has coordinates (cos θ, sin θ), and cos²θ + sin²θ = 1 is equivalent to x² + y² = 1 (the Pythagorean identity = circle equation). Standard.

### 2.3 Sine Wave as Projected Circular Motion (Valid)

Plotting sin(θ) as θ increases linearly with time produces a sinusoidal wave. This is geometrically exact — a sine wave is the projection of uniform circular motion onto one axis.

### 2.4 Fourier Decomposition for Practical BCI Signals (Valid)

For square-integrable signals (which all real BCI recordings are, being finite-energy), Fourier decomposition is mathematically valid and computationally standard (FFT). This is the workhorse of EEG/BCI signal processing.

### 2.5 Using Variance of Signal Properties for Anomaly Detection (Valid)

Statistical process control using variance thresholds is a well-established methodology. Monitoring phase, timing, and amplitude stability of signal components is a legitimate anomaly detection approach.

---

## 3. Audit Findings

### Finding 1: BCI Signals Do Not Propagate as Wavefronts

**Severity: Fundamental**

**Claim (from WHY_WAVES_ARE_CIRCLES.md and SIGNAL_VISUALIZATION_DESIGN.md):**
> "A BCI electrode generates an electric field. That field propagates outward through neural tissue as a spherical wavefront."
> "The circular wavefront in the ONI visualization is not artistic choice. It's physics."

**Why it's wrong:**

At BCI-relevant frequencies (0.5 Hz – 10 kHz for neural signals, up to ~100 kHz for impedance measurements), the electromagnetic wavelength in neural tissue is enormous:

```
λ = c / (f × √εᵣ)

Neural tissue at 1 kHz: εᵣ ≈ 10⁵ (Gabriel et al., 1996)
λ ≈ (3 × 10⁸) / (10³ × 316) ≈ 950 meters
```

The wavelength (~1 km) is roughly 6,000× larger than the human brain (~0.15 m). When the wavelength is far larger than the system, we are in the **quasi-static regime** (Plonsey & Heppner, 1967). In this regime:

- The electric field is governed by **Laplace's equation** (∇²V = 0), not the wave equation (∇²E = με ∂²E/∂t²)
- Fields establish effectively instantaneously relative to neural timescales
- There is no wavefront propagation — the field is a **volume-conducted potential** that falls off with distance according to the tissue conductivity structure
- The correct model is **volume conduction theory** (Nunez & Srinivasan, 2006)

**What actually happens at each BCI modality:**

| BCI Signal Type | Physical Mechanism | Correct Model |
|----------------|-------------------|---------------|
| Electrode array (Neuralink, Utah) | Local field potential from ionic currents | Volume conduction (quasi-static) |
| EEG | Superposition of cortical dipole sources | Volume conduction through skull/scalp |
| Action potentials | Ionic current along axon membrane | Cable equation (Hodgkin-Huxley, 1952) — 1D propagation, not spherical |
| TMS | Time-varying magnetic field induces E-field | Quasi-static at TMS frequencies (1-10 kHz); Faraday induction, not EM wave |
| Optogenetics | Light at visible/near-IR wavelengths | Photon scattering in tissue (Beer-Lambert); this IS wave propagation but highly scattered, not clean wavefronts |

**Exception — optogenetics:** Light wavelengths (400–700 nm, frequencies ~10¹⁴ Hz) are in the wave propagation regime. However, neural tissue is a highly scattering medium, so light does not form clean spherical wavefronts — it undergoes multiple scattering events described by the radiative transport equation or Monte Carlo photon simulations (Jacques, 2013).

**Correction:** The visualization should be labeled as a **pedagogical model** representing signal influence spreading through layers, not literal electromagnetic wavefront propagation. The actual physics is volume conduction.

**References:**
- Gabriel, S., Lau, R. W., & Gabriel, C. (1996). The dielectric properties of biological tissues: III. Parametric models for the dielectric spectrum of tissues. *Physics in Medicine & Biology*, 41(11), 2271.
- Plonsey, R., & Heppner, D. B. (1967). Considerations of quasi-stationarity in electrophysiological systems. *Bulletin of Mathematical Biophysics*, 29(4), 657–664.
- Nunez, P. L., & Srinivasan, R. (2006). *Electric Fields of the Brain* (2nd ed.). Oxford University Press.
- Hodgkin, A. L., & Huxley, A. F. (1952). A quantitative description of membrane current and its application to conduction and excitation in nerve. *Journal of Physiology*, 117(4), 500–544.
- Jacques, S. L. (2013). Optical properties of biological tissues: A review. *Physics in Medicine & Biology*, 58(11), R37.

---

### Finding 2: Neural Tissue Is Anisotropic

**Severity: Significant**

**Claim:**
> Wavefronts are circular/spherical "because the wave travels at the same speed in every direction."

**Why it's wrong:**

Neural tissue has **anisotropic conductivity** — electrical properties differ by direction. White matter tracts (bundles of myelinated axons) conduct preferentially along the fiber direction. The conductivity is described by a tensor, not a scalar:

```
σ = | σ_longitudinal    0              0           |
    | 0                 σ_transverse   0           |
    | 0                 0              σ_transverse |

Typical values (Tuch et al., 2001):
σ_longitudinal ≈ 0.65 S/m  (along fibers)
σ_transverse   ≈ 0.065 S/m (across fibers)
Anisotropy ratio: ~10:1
```

Even in the volume conduction model (which is what actually applies — see Finding 1), the potential distribution around an electrode is **not spherically symmetric**. It follows the conductivity tensor, producing elongated or irregular equipotential surfaces.

**Correction:** Replace claims of isotropic propagation with acknowledgment of anisotropic tissue. Note that the circular visualization is a simplified model.

**References:**
- Tuch, D. S., Wedeen, V. J., Dale, A. M., George, J. S., & Belliveau, J. W. (2001). Conductivity tensor mapping of the human brain using diffusion tensor MRI. *Proceedings of the National Academy of Sciences*, 98(20), 11697–11701.

---

### Finding 3: Sum of Variances ≠ Shannon Entropy

**Severity: Incorrect**

**Claim (from README.md):**
> "Total variance (σ²φ + σ²τ + σ²γ) represents Shannon entropy — the uncertainty across all signal dimensions."

**Why it's wrong:**

Shannon entropy and variance are distinct mathematical quantities:

```
Shannon entropy:  H = −Σ p(x) log p(x)     (information-theoretic)
Variance:         σ² = E[(X − μ)²]          (second central moment)
```

For a **Gaussian** distribution, there is a relationship:

```
H_Gaussian = ½ ln(2πeσ²)
```

But:
- σ² and H are related logarithmically, not linearly
- A sum of variances is not a sum of entropies (even for Gaussians, since H = ½ ln(2πeσ²) is nonlinear in σ²)
- The relationship only holds for Gaussian distributions; neural signal statistics are often non-Gaussian (heavy-tailed, skewed)
- Shannon entropy is measured in bits or nats; variance is in (units)²

**What the exponent actually represents:**

The form `e^(−σ²)` is recognizable as:
- A **Gaussian likelihood** (the probability of observing zero deviation given variance σ²)
- A **Boltzmann factor** from statistical mechanics (energy → probability)
- A **radial basis function** kernel

Any of these is a defensible motivation. None of them are Shannon entropy.

**Correction:** Replace "represents Shannon entropy" with an accurate motivation (e.g., Gaussian likelihood model, or simply a design choice producing exponential decay with sharp thresholding behavior).

**References:**
- Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379–423.
- Cover, T. M., & Thomas, J. A. (2006). *Elements of Information Theory* (2nd ed.). Wiley.

---

### Finding 4: f × S ≈ k Requires Non-Dispersive Medium

**Severity: Significant**

**Claim:**
> f × S ≈ k derives from v = fλ where v is constant in the medium.

**Why it's incomplete:**

The wave speed in biological tissue is **frequency-dependent** (dispersive). The dielectric properties of neural tissue follow the **Cole-Cole model** (Cole & Cole, 1941):

```
ε*(ω) = ε_∞ + Σᵢ (Δεᵢ / (1 + (jωτᵢ)^(1-αᵢ))) + σ_s / (jωε₀)

where:
  ε*(ω) = complex permittivity (frequency-dependent)
  ε_∞   = high-frequency permittivity limit
  Δεᵢ   = dispersion magnitude for i-th relaxation
  τᵢ    = relaxation time constant
  αᵢ    = distribution parameter (0 ≤ α < 1)
  σ_s   = static ionic conductivity
```

Gabriel et al. (1996) characterized four major dispersions in biological tissue (α, β, δ, γ), each at different frequency ranges. This means:

```
v(f) = c / √(ε_r(f))    ← NOT constant

Therefore: f × λ(f) = v(f) ≠ constant
And:       f × S ≠ constant
```

**What might be salvageable:**

The *qualitative* relationship — that higher-frequency signals interact at smaller spatial scales — is broadly true in neuroscience. But the precise invariant f × S = k (with k constant) does not hold when the medium is dispersive.

A corrected formulation might:
1. Define k(f) = f × S(f) and characterize its frequency dependence
2. Use the dispersion-corrected velocity v(f) to compute the actual relationship
3. Define layer-specific k ranges rather than a single constant

**Correction:** Acknowledge dispersion. Present f × S ≈ k as an approximate scaling relationship that holds qualitatively but requires dispersion correction for quantitative use. Identify the corrected formulation as open research.

**References:**
- Cole, K. S., & Cole, R. H. (1941). Dispersion and absorption in dielectrics. *Journal of Chemical Physics*, 9(4), 341–351.
- Gabriel, S., Lau, R. W., & Gabriel, C. (1996). The dielectric properties of biological tissues: II. Measurements in the frequency range 10 Hz to 20 GHz. *Physics in Medicine & Biology*, 41(11), 2251.

---

### Finding 5: Cₛ Is Defined, Not Derived

**Severity: Overstated**

**Claim:**
> The mathematical chain derives: sin(θ) → Fourier → Cₛ = e^(−(σ²φ + σ²τ + σ²γ))

**Why it's overstated:**

Cₛ is a **design choice**, not a mathematical derivation. The Fourier connection is that the variance terms measure properties of Fourier components — but the exponential decay formula is one of many possible monotonically decreasing functions of total variance:

```
Exponential:    Cₛ = e^(−Σσ²)           ← current choice
Lorentzian:     Cₛ = 1 / (1 + Σσ²)
Linear:         Cₛ = max(0, 1 − αΣσ²)
Sigmoid:        Cₛ = (1 + tanh(k − Σσ²)) / 2
Power law:      Cₛ = (1 + Σσ²)^(−β)
```

Each would produce a coherence score that decreases with increasing variance. The exponential form has properties that make it a reasonable choice:
- Bounded [0, 1]
- Sharp threshold behavior (rapid decay near critical variance)
- Differentiable everywhere (useful for gradient-based optimization)
- Analogous to Gaussian probability density

But these are reasons to *choose* this form, not mathematical proofs that it *must* be this form.

**Correction:** Present Cₛ as a design decision motivated by desirable mathematical properties and inspired by Fourier component analysis. Do not present it as derived from the trigonometric chain.

---

### Finding 6: Variance Requires Multiple Observations

**Severity: Incomplete**

**Claim:**
> The coherence metric checks variance of Fourier components (phase σ²φ, frequency σ²τ, amplitude σ²γ).

**What's missing:**

A single FFT of a signal yields deterministic values {A₁, f₁, φ₁, A₂, f₂, φ₂, ...}. There is no variance in a single observation. To compute variance, you need to specify:

1. **Windowing:** How is the signal segmented? (Rectangular, Hanning, Hamming windows?)
2. **Window count:** How many consecutive windows are compared? (N = 10? 100? 1000?)
3. **Overlap:** Do windows overlap? (50% is standard in Welch's method)
4. **Which components:** All FFT bins? Only dominant frequency bands (delta, theta, alpha, beta, gamma)?
5. **Baseline period:** How long is the initial baseline training phase?
6. **Update rate:** How frequently is the baseline updated to track natural drift?

Without these specifications, the metric cannot be implemented or tested. This is not a mathematical error — it's an engineering specification gap.

**Correction:** Specify the Short-Time Fourier Transform (STFT) parameters, the statistical estimator (Welch's method, multitaper, etc.), and the comparison methodology (z-score against baseline, Mahalanobis distance, etc.).

**References:**
- Welch, P. D. (1967). The use of fast Fourier transform for the estimation of power spectra. *IEEE Transactions on Audio and Electroacoustics*, 15(2), 70–73.

---

### Finding 7: Fourier Convergence Conditions

**Severity: Minor**

**Claim (from WHY_WAVES_ARE_CIRCLES.md):**
> "Joseph Fourier proved something remarkable: any signal — no matter how complex — can be decomposed into a sum of simple sine waves."

**Why it's slightly wrong:**

Fourier (1822) made this claim but did not rigorously prove it. The convergence conditions were later established by:
- **Dirichlet (1829):** Pointwise convergence for piecewise-smooth functions with finite discontinuities
- **Carleson (1966):** Almost-everywhere convergence for L² (square-integrable) functions
- **Gibbs phenomenon:** At discontinuities, the Fourier series overshoots by ~9% regardless of terms used

For practical BCI signals (continuous, finite-energy, band-limited), convergence is not an issue. But "any signal — no matter how complex" is technically an overstatement.

**Correction:** Add a note that convergence requires the signal to be square-integrable (finite energy), which all real BCI recordings satisfy.

**References:**
- Fourier, J. (1822). *Theorie analytique de la chaleur*. Firmin Didot.
- Carleson, L. (1966). On convergence and growth of partial sums of Fourier series. *Acta Mathematica*, 116, 135–157.

---

## 4. Impact on ONI Framework

### What Must Change

| Component | Current State | Required Change |
|-----------|--------------|-----------------|
| Visualization narrative | "This is physics" | "This is a pedagogical model of signal influence propagation" |
| Coherence metric motivation | "Derived from Fourier" | "Designed to measure Fourier component stability" |
| Shannon entropy claim | "Variance = entropy" | Remove; replace with accurate motivation |
| Scale-frequency invariant | "v is constant" | Acknowledge dispersion; present as approximate scaling law |
| Wavefront propagation | "Spherical wavefronts" | Volume conduction (quasi-static fields) |

### What Can Stay

| Component | Why It's Fine |
|-----------|--------------|
| Triangle → circle → sine wave pedagogy | Mathematically correct |
| Fourier decomposition of BCI signals | Standard signal processing |
| Cₛ as anomaly detection metric | Valid approach (as design, not derivation) |
| f × S qualitative scaling | Broadly true in neuroscience |
| 3D visualization itself | Effective pedagogical tool when labeled correctly |

### What Opens Up

Correcting these errors actually opens productive research directions:

1. **Volume conduction model → more realistic L8 analysis:** Understanding that BCI fields are quasi-static means L8 should analyze volume-conducted potentials, not wavefronts. This changes the detection math.

2. **Anisotropic tissue → directional signatures:** If the conductivity tensor is known (from DTI imaging), signals from specific brain regions have directional fingerprints. An attacker injecting from the wrong direction would have the wrong spatial signature.

3. **Dispersion → frequency-dependent layer boundaries:** Instead of f × S = constant, each layer could have a frequency-dependent transfer function. More complex, but more accurate and harder to spoof.

4. **Properly specified Cₛ → testable metric:** Once windowing and statistical parameters are specified, Cₛ can be validated on real EEG data from public datasets (PhysioNet, BNCI Horizon 2020).

---

## 5. Resolution Roadmap

| Finding | Priority | Resolution Path | Blocks |
|---------|----------|-----------------|--------|
| #1 Quasi-static fields | **P0** | Rewrite physics narrative; derive volume conduction model | Findings 2, 4 |
| #2 Anisotropy | **P1** | Literature review on DTI conductivity tensors; directional signature concept | Finding 1 |
| #3 Shannon entropy | **P0** | Simple text correction; choose accurate motivation | None |
| #4 Dispersion | **P1** | Compute v(f) from Cole-Cole parameters; reformulate f × S | Finding 1 |
| #5 Cₛ derivation language | **P0** | Soften language from "derived" to "designed/inspired" | None |
| #6 Variance specification | **P2** | Define STFT parameters; prototype on public EEG data | Finding 5 |
| #7 Fourier convergence | **P3** | Add convergence note | None |

---

## Acknowledgments

> The author wishes to acknowledge the support of colleagues and mentors in the development of this work. Initial research validation was conducted through LMArena (LMSYS, 2024-2025), enabling cross-model verification of hypotheses and findings to mitigate single-model bias. Deep research synthesis and writing assistance was provided by Claude (Anthropic, 2025). All original ideas, theoretical frameworks, analyses, and conclusions are the author's own. Final revisions, editing, and validation were performed by the author.

---

*Document created: 2026-01-29*
*Author: Kevin Qi + Claude (QI Collaboration)*
*For: ONI Framework — qinnovates/mindloft*
*Location: MAIN/legacy-core/publications/mathematical-foundations/TechDoc-Mathematical_Audit.md*
