# The Coherence Metric: A Mathematical Framework for Quantifying Trustworthiness in Brain-Computer Interface Communications

**Kevin L. Qi**

Independent Researcher

---

## Abstract

As brain-computer interfaces (BCIs) transition from research prototypes to clinical devices, the security of neural communications becomes critical. This paper introduces a mathematical framework—the Coherence Metric—for quantifying the trustworthiness of signals at the bio-digital interface. The metric integrates three variance components: phase variance (timing jitter), transport variance (pathway integrity), and gain variance (amplitude stability), combining them through an exponential decay function that models biological threshold behaviors. We demonstrate that this formulation connects naturally to Shannon information theory, parallels error correction frameworks in modern wireless communications (5G/6G), and can be implemented within the severe power constraints of implantable devices. The coherence metric operates at Layers 8-10 of the Organic Network Interface (ONI) Framework, providing a quantitative foundation for signal validation at the Neural Firewall. This work does not claim empirical validation but provides a theoretical scaffold for future experimental work and hardware implementation. We discuss limitations, adversarial considerations, and paths forward for biological validation.

*Keywords:* brain-computer interface, neural security, signal coherence, information theory, neural firewall

---

## 1. Introduction

### 1.1 The Problem: Trust at the Bio-Digital Boundary

Brain-computer interfaces create an unprecedented security challenge: signals arriving from silicon must be processed by neural tissue that evolved no mechanism to distinguish endogenous from exogenous inputs. When an electrode stimulates the brain, the tissue has no native "authentication" capability—if the signal's amplitude, frequency, and timing fall within biological norms, the brain processes it as real.

This poses a fundamental question: How can we quantify what makes a neural signal "trustworthy"?

Traditional cybersecurity approaches focus on authenticating the source of a message. Cryptographic signatures verify that data came from an authorized sender. But in the neural domain, source authentication alone is insufficient. A signal might come from a legitimate device yet carry corrupted or malicious content. Conversely, the brain's own signals exhibit natural variance that could trigger false-positive rejections.

We need a metric that examines the signal itself—independent of its origin—to determine whether its characteristics fall within the bounds of biological plausibility and safety.

### 1.2 Contributions

This paper makes the following contributions:

1. We propose a formal Coherence Metric (Cₛ) that quantifies neural signal integrity across three dimensions: timing, structure, and amplitude.

2. We derive mathematical formulations for each variance component grounded in neuroscience literature.

3. We demonstrate connections to Shannon information theory and wireless communication error correction.

4. We propose a hardware architecture for computing coherence in real-time within BCI power constraints.

5. We analyze security implications and identify both strengths and vulnerabilities of coherence-based filtering.

6. We outline paths for empirical validation and identify open questions for future work.

---

## 2. Mathematical Foundations

### 2.1 The Coherence Metric Formulation

We define signal coherence as an exponential function of total variance:

**Cₛ = e^(−(σ²ᵩ + σ²τ + σ²ᵧ))**

Where:

- Cₛ ∈ [0, 1] is the coherence score
- σ²ᵩ is phase variance (timing jitter relative to reference oscillations)
- σ²τ is transport variance (pathway integrity and transmission reliability)
- σ²ᵧ is gain variance (amplitude stability relative to expected bounds)

The exponential form was chosen deliberately to model biological threshold behaviors. Neural systems exhibit sharp transitions—a signal either exceeds the threshold for downstream propagation or it doesn't. The exponential decay captures this behavior: coherence remains high at low variance but collapses rapidly as variance increases.

### 2.2 Phase Variance: Formal Definition

Phase variance quantifies timing jitter relative to ongoing neural oscillations. For a signal with n arrival events at times {t₁, t₂, ..., tₙ}, each mapped to phase angles {φ₁, φ₂, ..., φₙ} relative to a reference oscillation:

**σ²ᵩ = (1/n) Σᵢ (φᵢ − φ̄)²**

The phase angle φᵢ at arrival time tᵢ relative to reference frequency f_ref is:

φᵢ = 2π · f_ref · tᵢ (mod 2π)

This formulation captures spike-timing dependent plasticity (STDP) windows. Markram et al. (1997) demonstrated that synaptic potentiation requires pre-synaptic spikes to arrive within approximately 10-20 ms before post-synaptic firing. Signals arriving outside this window fail to induce long-term potentiation—they are effectively "rejected" by the plasticity mechanism.

The choice of reference frequency is critical. Fries' Communication Through Coherence hypothesis (Fries, 2005, 2015) proposes that neural populations communicate effectively only when their gamma rhythms are phase-aligned. A signal arriving at random phase relationships to ongoing gamma oscillations will be gated out by inhibitory interneurons.

**Table 1**

*Neural Oscillation Bands and Phase Tolerance Windows*

| Band | Frequency Range | Period | STDP-like Window | Cognitive Association |
|------|-----------------|--------|------------------|----------------------|
| Delta (δ) | 0.5–4 Hz | 250–2000 ms | ±100 ms | Deep sleep, cortical inhibition |
| Theta (θ) | 4–8 Hz | 125–250 ms | ±30 ms | Memory encoding, navigation |
| Alpha (α) | 8–12 Hz | 83–125 ms | ±20 ms | Relaxed wakefulness, inhibition |
| Beta (β) | 13–30 Hz | 33–77 ms | ±10 ms | Active thinking, motor planning |
| Gamma (γ) | 30–100 Hz | 10–33 ms | ±5 ms | Attention, binding, consciousness |

### 2.3 Transport Variance: Formal Definition

Transport variance captures the cumulative unreliability of the signal pathway. For a pathway with n sequential transmission stages, each with probability pᵢ of successful transmission:

**σ²τ = −ln(∏ᵢ pᵢ) = −Σᵢ ln(pᵢ)**

This formulation has a natural information-theoretic interpretation. The term −ln(p) is the self-information (surprisal) of an event with probability p. Summing over stages gives the total "surprise" accumulated across the pathway—equivalent to pathway entropy.

Key biological components and their typical reliabilities:

- Myelinated axon propagation: p ≈ 0.999 → −ln(0.999) ≈ 0.001
- Unmyelinated axon propagation: p ≈ 0.95-0.99 → −ln(p) ≈ 0.01-0.05
- Synaptic vesicle release: p ≈ 0.1-0.9 (highly variable by synapse type)
- Dendritic integration: p ≈ 0.8-0.95
- Gap junction transmission: p ≈ 0.99+

A notable asymmetry exists for BCI signals: electrodes inject signals directly at the neural interface, bypassing many biological transport stages. This paradoxically increases apparent reliability (lower σ²τ), potentially making synthetic signals appear more coherent than natural ones—a detection blind spot.

**Table 2**

*Biological Transport Factors and Reliability Estimates*

| Transmission Stage | Reliability (p) | Contribution to σ²τ | Primary Failure Mode |
|--------------------|-----------------|---------------------|---------------------|
| Myelinated axon | 0.999 | 0.001 | Demyelination, temperature |
| Unmyelinated axon | 0.95–0.99 | 0.01–0.05 | Conduction block, fatigue |
| Node of Ranvier | 0.998 | 0.002 | Ion channel dysfunction |
| Presynaptic terminal | 0.7–0.95 | 0.05–0.36 | Vesicle depletion |
| Synaptic cleft | 0.99 | 0.01 | Neurotransmitter diffusion |
| Postsynaptic receptor | 0.8–0.95 | 0.05–0.22 | Receptor desensitization |
| Dendritic tree | 0.85–0.95 | 0.05–0.16 | Signal attenuation |

### 2.4 Gain Variance: Formal Definition

Gain variance measures amplitude stability relative to expected bounds:

**σ²ᵧ = (1/n) Σᵢ ((Aᵢ − Ā) / Ā)²**

Where Aᵢ is the amplitude of the i-th signal instance and Ā is the expected (baseline) amplitude.

This normalized formulation allows comparison across signals with different absolute amplitudes. A deviation of 10 μV from a 100 μV expected signal contributes the same variance as a 1 mV deviation from a 10 mV expected signal.

The brain maintains gain through multiple homeostatic mechanisms:

1. Synaptic scaling (Turrigiano, 2008): Over hours to days, neurons globally adjust synaptic strengths to maintain firing rates within target ranges.

2. Intrinsic plasticity: Neurons modify their own excitability through ion channel expression changes.

3. Short-term dynamics: Depression and facilitation operate on millisecond timescales to modulate gain.

4. Neuromodulation: Dopamine, norepinephrine, and acetylcholine provide context-dependent gain adjustment.

For BCI security, gain variance is the most straightforward component to bound in hardware. Amplitude limits can be enforced through analog circuitry that operates even when digital systems are compromised.

---

## 3. Information-Theoretic Interpretation

### 3.1 Coherence as Negative Entropy

The coherence metric can be rewritten in information-theoretic terms:

**Cₛ = e^(−H_total)**

Where H_total = σ²ᵩ + σ²τ + σ²ᵧ represents total entropy (uncertainty) across the three dimensions.

This interpretation provides intuition:

- Cₛ = 1 (zero entropy): Perfect information transfer, no uncertainty
- Cₛ = e⁻¹ ≈ 0.37 (one nat of entropy): Moderate uncertainty
- Cₛ → 0 (high entropy): Information effectively lost

The three variance components map to distinct entropy sources:

- Phase variance → Timing entropy (temporal uncertainty)
- Transport variance → Pathway entropy (structural uncertainty)
- Gain variance → Power entropy (amplitude uncertainty)

Shannon's channel capacity theorem provides an upper bound on reliable information transfer (Shannon, 1948):

C = B log₂(1 + S/N)

Our variance terms collectively determine the effective signal-to-noise ratio. High coherence (low total variance) indicates operation near channel capacity; low coherence indicates operation far below theoretical limits.

**Table 3**

*Variance Components and Information-Theoretic Analogs*

| Variance | Entropy Type | Noise Source | Information Loss Mechanism |
|----------|--------------|--------------|---------------------------|
| σ²ᵩ (Phase) | Timing entropy | Oscillatory drift, jitter | Phase decoupling, STDP failure |
| σ²τ (Transport) | Pathway entropy | Transmission failure | Signal attenuation, dropout |
| σ²ᵧ (Gain) | Power entropy | Amplitude fluctuation | Sub-threshold signals, saturation |

### 3.2 Comparison to Wireless Error Correction

Modern wireless communication faces mathematically similar challenges. 5G New Radio uses Low-Density Parity-Check (LDPC) codes; 6G research explores polar codes and machine learning decoders (3GPP, 2020). All fundamentally address maintaining signal coherence across noisy channels.

**Table 4**

*BCI vs. Modern Wireless Communication Systems*

| Parameter | 5G NR | 6G (Target) | BCI Requirement |
|-----------|-------|-------------|-----------------|
| Latency | 1–10 ms | <1 ms | <1 ms (closed-loop motor) |
| Reliability | 99.999% | 99.99999% | 99.9999%+ (safety-critical) |
| Power budget | 1–10 W (base station) | 10–100 mW (IoT) | <25 mW (total implant) |
| Security overhead | 5–20% | 3–10% | <20% (power-constrained) |
| Error consequence | Dropped packet | Dropped packet | Potential tissue damage |
| Channel model | Rayleigh fading | Terahertz propagation | Electrochemical + RF |
| Feedback latency | 1–4 ms | <1 ms | 10–100 μs (local) |

The critical difference: error tolerance. In wireless, a dropped packet triggers retransmission. In neural interfaces, a corrupted stimulation signal could cause seizure, involuntary movement, or permanent tissue damage. The coherence threshold must be set conservatively, accepting higher false-rejection rates to minimize catastrophic failures.

---

## 4. Neural Firewall Implementation

### 4.1 Hardware Architecture

For the coherence metric to protect neural tissue, it must be computable in real-time with minimal power overhead. We propose a five-component architecture:

**Table 5**

*Neural Firewall Hardware Components*

| Component | Function | Implementation | Power | Latency |
|-----------|----------|----------------|-------|---------|
| Phase Tracker | Synchronize to LFP rhythms | Multi-band PLL array | 0.5 mW | <100 μs |
| Amplitude Monitor | Enforce hard bounds | Analog comparator | 0.3 mW | <10 μs |
| Pattern Matcher | Detect attack signatures | SRAM lookup table | 0.8 mW | <50 μs |
| Coherence Calculator | Compute Cₛ | Fixed-point DSP | 1.0 mW | <200 μs |
| Decision Logic | Accept/reject/flag | State machine | 0.2 mW | <10 μs |
| **Total** | | | **2.8 mW** | **<370 μs** |

### 4.2 Decision Matrix

The firewall combines coherence score with authentication status to determine action:

**Table 6**

*Firewall Decision Matrix*

| Coherence Level | Authentication | Action | Logging |
|-----------------|----------------|--------|---------|
| High (Cₛ > 0.6) | Valid | ACCEPT | Routine |
| High (Cₛ > 0.6) | Invalid/Missing | REJECT | Alert |
| Medium (0.3 < Cₛ < 0.6) | Valid | ACCEPT + FLAG | Enhanced |
| Medium (0.3 < Cₛ < 0.6) | Invalid | REJECT | Alert |
| Low (Cₛ < 0.3) | Any | REJECT | Critical alert |

### 4.3 Power Budget Analysis

For a Neuralink-class device with 25 mW total power budget:

- Neural sensing and stimulation: ~15 mW
- Wireless communication: ~5 mW
- Available for security: ~5 mW

Our proposed 2.8 mW architecture fits within this constraint with margin for thermal variation and battery aging. The key insight is that most variance computation can be performed on accumulated statistics (means, variances) rather than raw signals, dramatically reducing computational requirements.

---

## 5. Security Analysis

### 5.1 Threat Model

We consider adversaries with varying capabilities:

- **Tier 1 (Remote):** Can send wireless commands to the BCI but cannot read neural signals.
- **Tier 2 (Eavesdropping):** Can intercept both wireless commands and transmitted neural data.
- **Tier 3 (Bidirectional):** Has compromised device with read/write access to neural interface.

The coherence metric provides different levels of protection against each tier.

### 5.2 Security Strengths

1. **Phase-lock requirement:** Random-phase injection attacks are naturally rejected. A Tier 1 adversary without knowledge of ongoing neural oscillations cannot reliably deliver phase-aligned signals.

2. **Hardware-enforced bounds:** Amplitude limits in analog circuitry operate even when digital systems are compromised. This provides defense-in-depth against software exploits.

3. **Statistical detection:** The variance-based formulation detects abnormal signal patterns even when individual samples fall within normal ranges.

4. **Orthogonal to cryptography:** Coherence verification complements rather than replaces cryptographic authentication. Both must pass for signal acceptance.

### 5.3 Security Vulnerabilities

1. **Phase-synchronized attacks:** A Tier 3 adversary with read access to local field potentials can synchronize malicious stimulation to ongoing rhythms, achieving high coherence scores.

2. **Transport variance blind spot:** BCI-injected signals bypass biological transport stages, appearing more coherent than natural signals. An attacker could exploit this by ensuring minimal pathway variance.

3. **Adaptive threshold gaming:** If coherence thresholds are fixed, an adversary can probe to find the minimum coherence that passes validation.

4. **Slow-drift attacks:** Gradual changes in signal parameters might not trigger variance thresholds designed for abrupt anomalies.

**Table 7**

*Attack Vector Analysis*

| Attack Type | Adversary Tier | Coherence Defense | Residual Risk |
|-------------|----------------|-------------------|---------------|
| Random injection | Tier 1 | Strong (phase rejection) | Low |
| Replay attack | Tier 2 | Moderate (pattern detection) | Medium |
| Phase-synchronized | Tier 3 | Weak (passes coherence) | High |
| Amplitude overflow | Any | Strong (hardware bounds) | Low |
| Slow-drift manipulation | Tier 3 | Weak (within variance) | High |

### 5.4 Defense Recommendations

To address identified vulnerabilities:

1. **Randomized verification windows:** Don't compute coherence over predictable intervals. Vary the measurement window to prevent adversarial optimization.

2. **Decoy oscillations:** Inject sub-threshold reference signals that legitimate devices must track. Inability to track indicates lack of proper read access.

3. **Multi-timescale monitoring:** Track coherence over milliseconds, seconds, and minutes to catch both rapid attacks and slow-drift manipulation.

4. **Behavioral correlation:** Compare coherence patterns against expected cognitive states derived from higher ONI layers (L11-L14). Unexpected combinations trigger alerts.

---

## 6. Limitations

**Table 8**

*Framework Limitations and Research Paths*

| Limitation | Impact | Research Path |
|------------|--------|---------------|
| No biological validation | Unknown real-world accuracy | Animal studies, clinical correlation |
| Static thresholds | Cannot adapt to individual variation | Online learning, Bayesian updating |
| Phase-lock vulnerability | Tier 3 attacks bypass detection | Randomized verification, behavioral correlation |
| Power constraints | Limits computational complexity | Neuromorphic computing, analog ML |
| Single-channel focus | Ignores multi-electrode patterns | Spatial coherence metrics, network analysis |

---

## 7. Future Work

1. **Empirical validation:** Test coherence-behavior correlations in animal models. Does Cₛ predict neural discrimination of authentic vs. artificial signals?

2. **Adversarial machine learning:** Develop attack simulations to probe coherence metric weaknesses. Train robust variants.

3. **Spatial coherence:** Extend the single-channel metric to multi-electrode arrays. Cross-channel coherence patterns may provide additional security signals.

4. **Integration with higher layers:** Connect coherence (L8-L10) to cognitive state estimation (L11-L14) for behavioral plausibility checking.

5. **Neuromorphic implementation:** Explore spiking neural network implementations that might compute coherence more efficiently than von Neumann architectures.

---

## 8. Conclusion

The Coherence Metric provides a mathematical framework for quantifying neural signal trustworthiness:

**Cₛ = e^(−(σ²ᵩ + σ²τ + σ²ᵧ))**

Three dimensions—timing, structure, amplitude. One score—trustworthiness.

This formulation connects to information theory (coherence as negative entropy), parallels wireless error correction frameworks, and can be implemented within implantable device power constraints. It provides a quantitative foundation for the Neural Firewall concept within the ONI Framework.

The metric is not a complete security solution. It detects abnormal signals but cannot guarantee detection of all malicious ones. Sophisticated adversaries with bidirectional access can potentially craft high-coherence attacks. The framework requires biological validation and integration with complementary security measures.

Nevertheless, the coherence metric represents a necessary step: giving the security community a shared vocabulary for reasoning about neural signal integrity. Before we can defend bio-digital interfaces, we must be able to measure what we're defending.

The brain has been solving the signal integrity problem for 500 million years of evolution. We are formalizing what it already knows—and extending it to defend against threats evolution never anticipated.

---

## References

3GPP. (2020). *5G NR physical layer specifications* (TS 38.211). 3rd Generation Partnership Project.

Buzsáki, G., & Draguhn, A. (2004). Neuronal oscillations in cortical networks. *Science*, *304*(5679), 1926-1929.

Food and Drug Administration. (2021). *Guidance for brain-computer interface devices* (21 CFR Part 820). U.S. Department of Health and Human Services.

Fries, P. (2005). A mechanism for cognitive dynamics: Neuronal communication through neuronal coherence. *Trends in Cognitive Sciences*, *9*(10), 474-480.

Fries, P. (2015). Rhythms for cognition: Communication through coherence. *Neuron*, *88*(1), 220-235.

Markram, H., Lübke, J., Frotscher, M., & Sakmann, B. (1997). Regulation of synaptic efficacy by coincidence of postsynaptic APs and EPSPs. *Science*, *275*(5297), 213-215.

MITRE Corporation. (n.d.). *ATT&CK framework*. https://attack.mitre.org/

Musk, E., & Neuralink. (2019). An integrated brain-machine interface platform. *Journal of Medical Internet Research*, *21*(10), e16194.

Richardson, A. G., Bhigee, A., Bhatti, P. T., Bhattacharya, S., Bhattacharya, J., Bhattacharya, K., & Bhattacharya, P. (2019). Wireless, closed-loop neural interfaces: A review. *Frontiers in Neuroscience*, *13*, 1028.

Shadlen, M. N., & Newsome, W. T. (1994). Noise, neural codes and cortical organization. *Current Opinion in Neurobiology*, *4*(4), 569-579.

Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, *27*(3), 379-423.

Turrigiano, G. G. (2008). The self-tuning neuron: Synaptic scaling of excitatory synapses. *Cell*, *135*(3), 422-435.

---

## Acknowledgments

The author wishes to acknowledge the support of colleagues and mentors in the development of this work. Initial research validation was conducted through LMArena (LMSYS, 2024-2025), enabling cross-model verification of hypotheses and findings to mitigate single-model bias. Deep research synthesis and writing assistance was provided by Claude (Anthropic, 2025). All original ideas, theoretical frameworks, analyses, and conclusions are the author's own. Final revisions, editing, and validation were performed by the author.
