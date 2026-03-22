# Scale-Frequency — Index

> **Mathematical relationship between spatial scale and temporal frequency across neural processing layers (f × S ≈ k).**

**Status:** Published
**Last Updated:** 2026-01-21
**ONI Layers:** L1-L7 (biological layers)

---

## Summary

Scale-Frequency analysis reveals a fundamental invariant in neural information processing: the product of spatial scale and temporal frequency remains approximately constant across biological layers. This relationship (f × S ≈ k, where k clusters in the range of ~0.01–25 m·Hz for mammalian neural systems) emerges from the physics of axonal conduction and has direct implications for BCI design. See the [Mathematical Audit](../mathematical-foundations/TechDoc-Mathematical_Audit.md) for dispersion caveats.

At molecular scales (L1), processes operate at microsecond timescales with frequencies in the MHz range. At whole-brain scales (L6), oscillations occur at Hz frequencies but coordinate across centimeters of tissue. The scale-frequency constant provides a unifying principle for understanding how information compresses and expands as it traverses the neural hierarchy.

For BCI security, this invariant establishes expectations for legitimate signals at each layer — deviations from the expected scale-frequency relationship can indicate signal manipulation or injection attempts.

---

## Dependencies

**This topic builds on:**

| Topic | Relationship |
|-------|--------------|
| [ONI Framework](../0-oni-framework/) | Layer definitions for scale-frequency mapping |

**Topics that build on this:**

| Topic | Relationship |
|-------|--------------|
| [Coherence Metric](../coherence-metric/) | Frequency expectations inform coherence validation |

---

## Documents

| Type | Document | Description |
|------|----------|-------------|
| Blog | [Blog-Scale_Frequency.md](Blog-Scale_Frequency.md) | Accessible introduction to neural scaling laws ([Original on Medium](https://medium.com/@qikevinl/the-hidden-equation-your-brain-runs-on-and-why-it-matters-5be5598eac1f)) |
| TechDoc | [TechDoc-Scale_Frequency.md](TechDoc-Scale_Frequency.md) | Mathematical derivation and empirical validation |

---

## Key Concepts

| Concept | Definition |
|---------|------------|
| Scale-Frequency Constant | f × S ≈ k (~0.01–25 m·Hz for mammalian neural systems; clusters within 3 orders of magnitude despite variables spanning 6+) |
| Spatial Scale (S) | Physical extent of neural structures at each layer |
| Temporal Frequency (f) | Characteristic oscillation rates at each layer |
| Information Compression | How signals transform across scale boundaries |
| Cross-Scale Coherence | Synchronization patterns linking layer frequencies |

---

## Related Topics

| Topic | Connection |
|-------|------------|
| [Coherence Metric](../coherence-metric/) | Uses frequency expectations for validation |
| [ONI Framework](../0-oni-framework/) | Provides layer structure for scale mapping |

---

## Keywords

**Primary:** scale-frequency, neural scaling, frequency invariants, cross-scale patterns
**Technical:** spectral analysis, spatial frequency, temporal dynamics, oscillations
**Biological:** neural oscillations, cortical columns, brain rhythms, synaptic timing
**Security:** signal validation, anomaly detection, frequency fingerprinting

---

## Future Work

- [ ] Empirical validation across BCI modalities
- [ ] Individual variation in scale-frequency constant
- [ ] Real-time frequency monitoring at L8
- [ ] Integration with coherence metric calculations

---

← Back to [Index](../../INDEX.md)
