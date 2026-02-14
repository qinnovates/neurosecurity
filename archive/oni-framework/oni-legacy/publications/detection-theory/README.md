# Detection Theory

> Mathematical frameworks for threat detection in neural signal systems.

---

## Summary

This publication establishes the theoretical foundations for detecting threats in brain-computer interface (BCI) systems. It synthesizes methodologies from Security Information and Event Management (SIEM) systems, Network Traffic Analysis (NTA) platforms, and modern machine learning to create detection algorithms specifically designed for the ONI Framework's Neural Firewall.

**Key Innovation:** Privacy-preserving detection that enables multi-node collaboration without exposing individual coherence metrics.

---

## Documents

| Document | Description |
|----------|-------------|
| [TechDoc-Detection_Theory.md](TechDoc-Detection_Theory.md) | Full mathematical framework with proofs, implementation architecture, and privacy guarantees |

---

## Key Concepts

### Detection Taxonomy

| Type | Method | Strength | Weakness |
|------|--------|----------|----------|
| **Signature-Based** | Match known-bad patterns | Zero false positives for known threats | Cannot detect novel attacks |
| **Anomaly-Based** | Detect deviations from baseline | Can detect zero-day attacks | Higher false positive rate |
| **Behavioral** | Classify by observed actions | Detects intent, not just pattern | Requires training data |

### Core Equations

**Single-Node Anomaly:**
```
Anomaly(i,t) = |Cₛᵢ(t) - C̄ᵢ| > k·σᵢ
```

**Network Anomaly:**
```
Network_Anomaly(t) = ||C_network(t) - C̄_network||₂ > θ_network
```

**Privacy-Preserving Coherence:**
```
M_DP(Cₛ) = Cₛ + Lap(Δf/ε)    (satisfies ε-differential privacy)
```

### Privacy Stack

| Layer | Technique | Guarantee |
|-------|-----------|-----------|
| Local | No data sharing | Perfect privacy |
| Statistical | Differential privacy | Bounded information leakage |
| Collaborative | Secure MPC | Information-theoretic security |
| External | Homomorphic encryption | Computation on encrypted data |

---

## Dependencies

| Depends On | Relationship |
|------------|--------------|
| [Coherence Metric](../coherence-metric/) | Uses Cₛ as primary detection signal |
| [Neural Firewall](../neural-firewall/) | Implements detection at L8 |
| [ONI Layers](../../oni-framework/ONI_LAYERS.md) | Operates within 14-layer model |

| Depended By | Relationship |
|-------------|--------------|
| TARA/NSAM | Implements detection engine |

---

## Related Topics

- [Coherence Metric](../coherence-metric/) — Signal integrity measure used for detection
- [Neural Firewall](../neural-firewall/) — Security boundary where detection operates
- [Scale-Frequency](../scale-frequency/) — Additional validation constraint

---

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Theoretical Framework | Complete | This document |
| ODRL Specification | Draft | TechDoc Section 4.3 |
| Python Implementation | Planned | `tara-nsec-platform/tara_mvp/nsam/` |
| Privacy Protocols | Theoretical | TechDoc Section 5 |

---

## Quick Reference

**Detection Thresholds (recommended starting values):**

| Parameter | Value | Meaning |
|-----------|-------|---------|
| θ_min (coherence) | 0.3 | Minimum acceptable coherence |
| k (sigma multiplier) | 3 | Standard deviations for anomaly |
| ε (privacy) | 1.0 | Differential privacy parameter |
| δ (privacy) | 10⁻⁵ | Privacy breach probability |

---

*See [INDEX.md](../../INDEX.md) for full navigation and cross-references.*

*Last Updated: 2026-01-26*
