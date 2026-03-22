# Threat Taxonomy

**ONI Neural Threat Taxonomy — 46 attack techniques across 10 tactics mapped to the 14-layer ONI model.**

## Overview

The first comprehensive BCI threat taxonomy that extends beyond device-level and signal-level attacks to classify threats against cognition, meaning, and identity (L9–L14). Synthesizes terminology from published BCI security research and maps every technique to specific ONI layers.

## Key Concepts

- **10 Tactics:** Reconnaissance, Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Collection, Lateral Movement, Impact
- **46 Techniques:** Each mapped to a specific ONI layer with research citations
- **Neural Credential Access:** Brainprint theft (Armstrong, 2015), P300 interrogation (Martinovic, 2012), session hijacking
- **Neurorights Mapping:** Techniques linked to cognitive liberty, mental privacy, mental integrity, psychological continuity

## Documents

| Document | Description |
|----------|-------------|
| [TechDoc-Neural_Threat_Taxonomy](TechDoc-Neural_Threat_Taxonomy.md) | Full taxonomy with 46 techniques, cross-framework mappings, and coverage analysis |

## Dependencies

- [ONI Framework](../0-oni-framework/) — 14-layer model that provides the structural basis
- [Neural Firewall](../neural-firewall/) — Defense mechanisms at L8
- [Detection Theory](../detection-theory/) — Anomaly detection approaches
- [Coherence Metric](../coherence-metric/) — Cₛ signal validation (referenced in T8.3)

## Related Topics

- [Neural Ransomware](../neural-ransomware/) — Deep dive into one specific attack type
- [Scale-Frequency](../scale-frequency/) — Temporal scale invariant referenced in detection

## Interactive Visualizations

- [ONI Framework 3D Viz](https://qinnovates.github.io/ONI/visualizations/08-oni-framework-viz.html) — All 46 techniques in interactive 3D
- [ONI Threat Matrix](https://qinnovates.github.io/ONI/visualizations/06-oni-threat-matrix.html) — MITRE-style matrix view

---

*[← Back to INDEX](../../INDEX.md)*
