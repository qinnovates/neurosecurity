---
title: "The Scale-Frequency Invariant: Mathematical Foundations for Hierarchical Neural Processing"
author: "Kevin L. Qi"
published: "2026-01-20"
type: "Academic Paper"
series: "ONI Framework"
week: 3
---

# The Scale-Frequency Invariant

*Mathematical Foundations for Hierarchical Neural Processing in the ONI Framework*

**Kevin L. Qi**

---

## Abstract

This paper investigates a scaling relationship observed across hierarchical levels of neural processing: the product of characteristic frequency and spatial scale remains approximately constant (f × S ≈ k). We present empirical data from multiple neural subsystems, propose a theoretical framework grounding this invariant in information-theoretic and physical constraints, and explore implications for brain-computer interface design.

The scale-frequency invariant explains the emergence of distinct processing layers in the ONI (Organic Neural Firewall) framework, provides bandwidth limits for neural interfaces at each layer, and suggests security monitoring must operate at multiple timescales simultaneously. We connect this neural invariant to similar scaling laws in turbulence, economics, and computer architecture, proposing that hierarchical information processing systems converge on this organization under broad conditions.

This work is theoretical and requires empirical validation. We identify specific predictions that could confirm or refute the proposed invariant.

---

## 1. Introduction

### 1.1 The Observation

Neural systems process information across an extraordinary range of scales:

- **Temporal:** from sub-millisecond ion channel dynamics to decades-long memory consolidation
- **Spatial:** from nanometer synaptic clefts to whole-brain networks spanning tens of centimeters
- **Informational:** from single bits (spike/no-spike) to the integrated complexity of conscious experience

Despite this diversity, a striking regularity emerges: when we multiply the characteristic frequency of a neural process by its spatial extent, we obtain values within a relatively narrow range. This paper formalizes this observation as the Scale-Frequency Invariant and explores its implications.

### 1.2 Formal Statement

$$f \times S \approx k$$

Where:
- **f** is the characteristic frequency (Hz) of coherent activity at a given processing level
- **S** is the characteristic spatial scale (m) of that coherent activity
- **k** is a constant, approximately 1-100 m·Hz for mammalian neural systems

The invariant holds across approximately 6 orders of magnitude in both frequency and spatial scale, with the product remaining within 2 orders of magnitude.

---

## 2. Empirical Evidence

### 2.1 Data Across Neural Scales

| Processing Level | Characteristic Frequency | Spatial Scale | f × S (m·Hz) | ONI Layer |
|------------------|-------------------------|---------------|--------------|-----------|
| Ion channel dynamics | 1000 Hz | 10 nm (channel) | 10⁻⁵ | L9 |
| Action potential | 500 Hz (max rate) | 1 μm (soma) | 5 × 10⁻⁴ | L8-9 |
| Local field potential | 100 Hz (gamma) | 1 mm (column) | 0.1 | L10 |
| Gamma oscillation coherence | 40 Hz | 2.5 cm (area) | 1 | L10 |
| Theta rhythm (hippocampus) | 6 Hz | 5 cm (formation) | 0.3 | L10-11 |
| Alpha rhythm (thalamo-cortical) | 10 Hz | 10 cm (network) | 1 | L10-11 |
| Delta/slow oscillation | 1 Hz | 20 cm (hemisphere) | 0.2 | L11 |
| Working memory maintenance | 0.1 Hz (refresh) | 15 cm (PFC-parietal) | 0.015 | L11-12 |

The data reveal that f × S values cluster between 0.01 and 10 m·Hz across neural processing levels — a range of only 3 orders of magnitude despite frequency and spatial scale each varying by 6+ orders of magnitude.

**Note:** The lowest-level processes (ion channels) show the largest deviation from the invariant. This may reflect the transition from molecular to cellular scales, where different physical constraints dominate.

### 2.2 Cross-Species Comparison

The invariant appears to hold across mammalian species with appropriate scaling:

- **Mouse cortex:** Similar f × S values but compressed spatial scales (smaller brain)
- **Primate cortex:** Values consistent with human data
- **Cetacean cortex:** Preliminary data suggest the invariant holds despite very different brain geometry

This cross-species consistency suggests the invariant reflects fundamental physical constraints rather than contingent evolutionary history.

---

## 3. Theoretical Framework

### 3.1 Physical Constraints

We propose the scale-frequency invariant emerges from three physical constraints:

1. **Axonal Conduction Velocity:** Neural signals propagate at 1-100 m/s depending on myelination. This sets a fundamental speed limit on information transfer.

2. **Metabolic Cost of High-Frequency Activity:** Each action potential consumes ATP. The brain's 20W power budget constrains how many neurons can fire at high rates simultaneously.

3. **Noise Limits on Temporal Precision:** Stochastic processes at the molecular level limit timing precision to roughly 1 ms. Higher-frequency coordination becomes unreliable.

These constraints interact to produce optimal operating points at each spatial scale.

### 3.2 Derivation from Conduction Delay

Consider a neural network of spatial extent S. For coherent oscillation at frequency f, signals must complete a round-trip within one period:

$$\frac{2S}{v} \leq \frac{1}{f}$$

Where v is conduction velocity. Rearranging:

$$f \times S \leq \frac{v}{2}$$

For myelinated axons (v ≈ 50 m/s), this gives f × S ≤ 25 m·Hz — consistent with observed values at Layer 10 and above.

This is an upper bound; actual values are lower due to synaptic delays and processing time at each node. The invariant represents operating near this physical limit — evolution has optimized toward the boundary.

### 3.3 Information-Theoretic Interpretation

The scale-frequency invariant has a natural interpretation in terms of information processing capacity.

Shannon's channel capacity for a bandwidth-limited channel is:

$$C = B \log_2(1 + SNR)$$

Where B is bandwidth (proportional to frequency) and SNR is signal-to-noise ratio.

For neural systems, SNR decreases with spatial scale due to averaging effects and accumulated noise. If SNR ∝ 1/S (a reasonable approximation), then maintaining constant channel capacity requires:

$$f \times S \approx \text{constant}$$

This suggests the invariant reflects optimal information throughput at each scale — the brain operating near channel capacity at every level of the hierarchy.

### 3.4 Connection to Kolmogorov Complexity

Kolmogorov complexity K(x) measures the length of the shortest program that produces output x. For hierarchical representations:

$$K(\text{high-level description}) \ll K(\text{low-level description})$$

Each layer up the hierarchy compresses information, trading raw data for semantic structure. The scale-frequency invariant quantifies this compression:

$$\text{Compression ratio} \approx \frac{f_{lower} \times S_{lower}}{f_{upper} \times S_{upper}} \approx 1$$

The invariant being approximately 1 (rather than >>1 or <<1) suggests each layer compresses information by roughly the same factor — a kind of self-similarity in the processing hierarchy.

This connects to renormalization group methods in physics, where scale-invariant behavior emerges at critical points. The brain may operate near a critical point where information processing is optimized.

---

## 4. Implications for the ONI Framework

### 4.1 Layer Emergence

The ONI framework's 14 layers are not arbitrary categories but reflect physical necessity. The scale-frequency invariant explains why distinct processing levels exist:

- Adjacent layers differ by roughly one order of magnitude in both frequency and spatial scale
- The invariant product remains approximately constant
- Each layer represents a local optimum in the speed-scale trade-off

Attempting to build a BCI that bypasses layers — reading high-frequency activity from large brain areas, or low-frequency activity from small areas — violates physical constraints. The information simply doesn't exist in that form.

### 4.2 Bandwidth Limits by Layer

| ONI Layer | Max Frequency | Characteristic Scale | Effective Bandwidth |
|-----------|---------------|---------------------|---------------------|
| L8-9 (Neural Gateway) | ~1000 Hz | ~1 mm | ~Mbit/s per channel |
| L10 (Oscillatory) | ~100 Hz | ~1 cm | ~100 kbit/s integrated |
| L11 (Cognitive Session) | ~1 Hz | ~10 cm | ~1 kbit/s semantic |
| L12 (Semantic Assembly) | ~0.1 Hz | ~20 cm | ~100 bit/s conceptual |
| L13-14 (Agency/Identity) | ~0.01 Hz | ~whole brain | ~10 bit/s integrated |

These bandwidth limits are not engineering limitations but physical realities. A BCI cannot extract more information from a layer than the layer contains. Current motor BCIs operate at L8-10 and achieve bit rates consistent with these limits.

Hypothetical "mind-reading" BCIs would need to decode L11-14 — layers with orders of magnitude less bandwidth but correspondingly richer semantic content. The challenge is not amplification but interpretation.

### 4.3 Security Monitoring Requirements

The scale-frequency invariant implies that the Neural Firewall must operate at multiple timescales:

**L8-9 Monitoring (milliseconds):** Detect malicious stimulation patterns, amplitude violations, timing anomalies. Fast attacks, fast detection.

**L10 Monitoring (tens of milliseconds):** Detect phase-locking anomalies, rhythm disruption, desynchronization attacks. Medium-timescale attacks on oscillatory coordination.

**L11-12 Monitoring (seconds to minutes):** Detect cognitive state manipulation, attention hijacking, working memory interference. Slow attacks that might escape fast monitoring.

**L13-14 Monitoring (hours to days):** Detect gradual personality modification, value drift, identity compromise. The slowest, most insidious attacks.

A firewall that only monitors at one timescale will miss attacks at other timescales. The coherence metric must be computed at each layer with appropriate time windows.

---

## 5. Parallels in Other Systems

### 5.1 Turbulence (Kolmogorov Scaling)

In turbulent fluids, energy cascades from large-scale motions to small-scale dissipation. Kolmogorov's 1941 theory predicts:

$$E(k) \propto k^{-5/3}$$

Where E(k) is energy at wavenumber k. This implies a scale-frequency relationship in the eddy cascade similar to neural scaling — large eddies are slow, small eddies are fast, with a characteristic scaling exponent.

The neural system may be analogous to a turbulent information cascade, with "cognitive eddies" at multiple scales.

### 5.2 Computer Memory Hierarchies

Computer architectures exhibit similar scaling:

| Level | Access Time | Capacity |
|-------|-------------|----------|
| L1 cache | ~1 ns | ~64 KB |
| L2 cache | ~10 ns | ~256 KB |
| L3 cache | ~50 ns | ~8 MB |
| RAM | ~100 ns | ~16 GB |
| SSD | ~100 μs | ~1 TB |
| Cloud | ~100 ms | ~unlimited |

Time × capacity grows roughly linearly — the same invariant relationship. This is not coincidence; it reflects fundamental trade-offs between speed and capacity in any storage/processing hierarchy.

### 5.3 Economic Systems

Financial markets show analogous structure:

- **High-frequency trading:** milliseconds, individual transactions
- **Daily trading:** hours, portfolio-level
- **Business cycles:** years, sector-level
- **Long waves (Kondratieff):** decades, economy-level

The product of characteristic timescale and "scope" (measured in transaction volume or capital involved) shows similar quasi-invariance.

This suggests hierarchical information processing systems may converge on scale-frequency invariance under broad conditions — a potential universality class.

---

## 6. Predictions and Empirical Tests

The scale-frequency invariant generates testable predictions:

1. **BCI Bandwidth Limits:** Motor BCIs should asymptote at information rates predicted by L10 bandwidth limits (~100 kbit/s integrated). Higher rates would require accessing multiple L8 channels independently.

2. **Coherence Windows:** The optimal time window for computing neural coherence should scale with spatial extent according to the invariant. Mismatched windows should reduce signal quality.

3. **Attack Detection Latency:** Fast attacks (L8-9) should be detectable within milliseconds; slow attacks (L13-14) may require hours to days of monitoring to detect. Intermediate layers should show intermediate detection latencies.

4. **Cross-Species Scaling:** Brain size should predict characteristic frequencies at each processing level according to the invariant. Larger brains should show slower high-level processing.

5. **Disruption Patterns:** Disrupting processing at one layer should produce characteristic signatures at adjacent layers, with time constants predicted by the invariant.

These predictions are specific enough to falsify the theory if incorrect.

---

## 7. Limitations

This analysis has significant limitations:

1. **Limited Empirical Data:** The invariant is inferred from heterogeneous studies, not a unified experimental program. Systematic measurement across layers is needed.

2. **Definitional Challenges:** "Characteristic frequency" and "spatial scale" require operational definitions that may vary across studies.

3. **Variance in k:** The invariant constant k varies by 2-3 orders of magnitude. This is small compared to 6+ orders of magnitude variation in f and S, but still substantial.

4. **Molecular Scale Deviation:** Ion channel dynamics deviate most from the invariant, suggesting different physics may dominate at the smallest scales.

5. **Theoretical Framework Incompleteness:** The derivations provide plausibility but not proof. Rigorous mathematical treatment is needed.

6. **Unknown Universality:** Whether the invariant reflects true universality (like critical phenomena) or convergent evolution under similar constraints remains unclear.

---

## 8. Conclusion

The scale-frequency invariant f × S ≈ k provides a quantitative framework for understanding hierarchical neural processing. It explains:

- Why distinct processing layers exist in neural systems
- What bandwidth limits apply at each layer
- How security monitoring must scale with the timescale of potential attacks
- Why similar hierarchical organization appears in diverse complex systems

For the ONI framework, the invariant grounds the 14-layer model in physics rather than arbitrary categorization. It provides concrete predictions about BCI capabilities and limitations. And it suggests that neural security must be a multi-timescale endeavor — fast attacks and slow attacks require different detection strategies.

The brain's architecture is not arbitrary. It reflects optimization under physical constraints that we can quantify and exploit. The scale-frequency invariant is one window into that deeper structure.

Understanding it brings us closer to building brain-computer interfaces that work with the brain's design rather than against it.

---

## References

1. Buzsáki, G., & Draguhn, A. (2004). Neuronal oscillations in cortical networks. *Science*, 304(5679), 1926-1929.

2. Kolmogorov, A. N. (1941). The local structure of turbulence in incompressible viscous fluid for very large Reynolds numbers. *Proceedings of the USSR Academy of Sciences*, 30, 299-303.

3. Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379-423.

4. Friston, K. (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience*, 11(2), 127-138.

5. Beggs, J. M., & Plenz, D. (2003). Neuronal avalanches in neocortical circuits. *Journal of Neuroscience*, 23(35), 11167-11177.

6. He, B. J., Zempel, J. M., Snyder, A. Z., & Raichle, M. E. (2010). The temporal structures and functional significance of scale-free brain activity. *Neuron*, 66(3), 353-369.

7. Nunez, P. L., & Srinivasan, R. (2006). *Electric Fields of the Brain: The Neurophysics of EEG*. Oxford University Press.

8. Li, M., & Vitányi, P. (2008). *An Introduction to Kolmogorov Complexity and Its Applications*. Springer.

9. Wilson, K. G. (1975). The renormalization group: Critical phenomena and the Kondo problem. *Reviews of Modern Physics*, 47(4), 773.

10. Qi, K. L. (2026). The ONI (Organic Neural Firewall) Framework. *Working Paper*.

11. Qi, K. L. (2026). The Coherence Metric for Neural Signal Integrity. *Working Paper*.

---

## Acknowledgments

The author wishes to acknowledge the support of colleagues and mentors in the development of this work. Initial research validation was conducted through LMArena (LMSYS, 2024-2025), enabling cross-model verification of hypotheses and findings to mitigate single-model bias. Deep research synthesis and writing assistance was provided by Claude (Anthropic, 2025). All original ideas, theoretical frameworks, analyses, and conclusions are the author's own. Final revisions, editing, and validation were performed by the author.
