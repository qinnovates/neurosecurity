# Mathematical Foundations

> Rigorous mathematical analysis of the ONI Framework's core claims — what holds, what doesn't, and what needs further research.

---

## Summary

The ONI Framework makes mathematical claims connecting trigonometry, wave physics, Fourier analysis, and two core security primitives: the **Coherence Metric (Cₛ)** and the **Scale-Frequency Invariant (f × S ≈ k)**. This topic provides:

1. A **mathematical audit** identifying which claims are empirically valid, which are pedagogical simplifications, and which are incorrect
2. A **corrected foundations document** with empirically accurate physics and clearly labeled hypotheses
3. An **expansion framework** for systematically resolving open mathematical questions

## Status

| Claim | Status | Details |
|-------|--------|---------|
| Triangle → Circle → Sine Wave | **Valid** | Standard mathematics |
| Sine wave = projected circular motion | **Valid** | Standard mathematics |
| Fourier decomposition of neural signals | **Valid** | Standard signal processing (with convergence conditions) |
| BCI signals propagate as spherical wavefronts | **Incorrect** | Quasi-static regime at BCI frequencies; volume conduction, not wave propagation |
| Neural tissue is isotropic (circular wavefronts) | **Incorrect** | Anisotropic conductivity tensor |
| σ²φ + σ²τ + σ²γ = Shannon entropy | **Incorrect** | Variance ≠ entropy; different mathematical quantities |
| f × S ≈ k from v = fλ (constant v) | **Incomplete** | Requires non-dispersive medium; neural tissue is dispersive (Cole-Cole model) |
| Cₛ is derived from Fourier theory | **Overstated** | Cₛ is *defined* (design choice), not derived; inspired by Fourier component analysis |
| Fourier works for "any signal" | **Minor overstatement** | Requires L² convergence conditions (Dirichlet, 1829) |

## Key Documents

| Document | Summary |
|----------|---------|
| [TechDoc-Mathematical_Audit](TechDoc-Mathematical_Audit.md) | *Rigorous audit of every mathematical claim in the ONI Framework — what's valid, what's wrong, and what's open.* |
| [TechDoc-Mathematical_Foundations](TechDoc-Mathematical_Foundations.md) | *Corrected mathematical foundations with empirically accurate physics, labeled hypotheses, and expansion stubs.* |
| [TechDoc-Equations_Reference](TechDoc-Equations_Reference.md) | *Master catalog of all equations used or proposed in the ONI Framework — physical basis, ONI application, status, and the physics chain from Maxwell to Cₛ(S).* |

## Dependencies

| This Topic | Depends On | Relationship |
|------------|------------|-------------|
| Mathematical Foundations | [Coherence Metric](../coherence-metric/) | Audits the Cₛ formula and its Fourier interpretation |
| Mathematical Foundations | [Scale-Frequency](../scale-frequency/) | Audits the f × S ≈ k invariant and its wave physics basis |
| Mathematical Foundations | [Detection Theory](../detection-theory/) | Informs which detection methods are physically feasible |
| Mathematical Foundations | [Neural Firewall](../neural-firewall/) | Determines what L8 can actually compute on real signals |

## Related Topics

- [Coherence Metric](../coherence-metric/) — The Cₛ formula this audit examines
- [Scale-Frequency](../scale-frequency/) — The f × S ≈ k invariant this audit examines
- [Detection Theory](../detection-theory/) — Detection methods constrained by these physics
- [Why Waves Are Circles](../../../docs/WHY_WAVES_ARE_CIRCLES.md) — Pedagogical document (corrected with accuracy notes)
- [Signal Visualization Design](../../../docs/SIGNAL_VISUALIZATION_DESIGN.md) — Visualization rationale (corrected with accuracy notes)

## Expansion Roadmap

Each section in [TechDoc-Mathematical_Foundations](TechDoc-Mathematical_Foundations.md) is marked with expansion stubs:

| Section | Status | Next Steps |
|---------|--------|------------|
| Quasi-static field model | Stub | Derive volume conduction equations for electrode arrays |
| Anisotropic conductivity | Stub | Obtain DTI-based conductivity tensors from literature |
| Cole-Cole dispersion model | Stub | Compute f-dependent v(f) for neural tissue |
| Corrected scale-frequency relationship | Stub | Reformulate f × S with v(f) dispersion correction |
| Coherence metric specification | Stub | Specify windowing, sample count, statistical test |
| Cross-frequency coupling | Stub | Literature review on PAC as biometric fingerprint |
| Wavelet-based Cₛ | Stub | Prototype time-frequency coherence metric |
| Destructive interference / active cancellation | Stub | Prototype anti-phase signal generation for WRITE-path defense |

---

*Document created: 2026-01-29*
*Author: Kevin Qi + Claude (QI Collaboration)*
*For: ONI Framework — qinnovates/mindloft*
