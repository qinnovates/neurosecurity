# Future Work: Chebyshev's Inequality for Anomaly Detection

**Status:** Planned
**Priority:** High
**Target:** v0.3.0
**Author:** Kevin Qi
**Created:** 2026-01-29

---

## Summary

Integrate Chebyshev's inequality into the ONI detection algorithm to provide **distribution-free guarantees** on false positive rates for coherence anomaly detection.

## Motivation

The current detection approach (referenced in `TechDoc-Detection_Theory.md`) mentions Chebyshev's inequality as statistical justification but does not implement it. Adding this would:

1. **Remove Gaussian assumption** - Neural signals are often non-Gaussian
2. **Provide provable FP bounds** - P(false positive) ≤ 1/k² for any distribution
3. **Enable adaptive thresholds** - Per-node thresholds based on baseline statistics
4. **Support variable security postures** - Adjust k for sensitivity vs specificity

## Mathematical Foundation

### Chebyshev's Inequality

For random variable X with mean μ and standard deviation σ:

```
P(|X - μ| ≥ kσ) ≤ 1/k²
```

### Application to Coherence Detection

```python
# Anomaly detection with guaranteed false positive rate
def is_anomaly(coherence: float, baseline_mean: float, baseline_std: float, k: float = 3.0) -> bool:
    """
    Returns True if coherence is anomalous.
    Guarantee: P(false positive) ≤ 1/k² = 11.1% for k=3
    """
    return abs(coherence - baseline_mean) > k * baseline_std
```

## Implementation Location

- **Primary:** `oni/detection/chebyshev.py` (new module)
- **Integration:** `oni/coherence.py` - add `chebyshev_threshold` parameter
- **TARA:** `tara_mvp/core/anomaly.py` - use adaptive thresholds

## API Design

```python
from oni.detection import ChebyshevDetector

detector = ChebyshevDetector(target_false_positive_rate=0.05)  # k ≈ 4.47

# Single-node detection
result = detector.detect(
    current_coherence=0.45,
    baseline_coherences=[0.82, 0.85, 0.79, 0.88, 0.84]
)
# result.is_anomaly = True
# result.confidence = 0.95
# result.false_positive_bound = 0.05

# Network-level detection
network_result = detector.detect_network(
    node_coherences={"motor": 0.45, "sensory": 0.82, "visual": 0.79},
    baseline_stats=baseline_dict
)
```

## References

- Current theory: `publications/detection-theory/TechDoc-Detection_Theory.md` (lines 280-290)
- Full research notes: `~/Library/Mobile Documents/com~apple~CloudDocs/obsidian/02-Projects/ONI-Chebyshev-Integration.md`

## Exit Criteria

- [ ] `ChebyshevDetector` class implemented with tests
- [ ] Integration with `CoherenceResult` dataclass
- [ ] TARA anomaly pipeline updated
- [ ] Documentation updated in TechDoc-Detection_Theory.md
- [ ] Example notebook demonstrating usage

---

*This document tracks planned work. See full research notes in the Obsidian vault.*
