# Classical Model for Neurosecurity

> The ONI 14-Layer Framework — established, tested, foundational.

> **Start here:** [INDEX.md](INDEX.md) — Central wiki hub with navigation, dependency map, cross-references, and reading order.

---

## Table of Contents

- [Securing Today's Neural Frontier](#securing-todays-neural-frontier)
- [Contents](#contents)
  - [Publications (31 documents across 8 topics)](#publications-31-documents-across-8-topics)
  - [Python Packages](#python-packages)
  - [Threat Taxonomy](#threat-taxonomy)
  - [Resources](#resources)
  - [Archive](#archive)
- [Relationship to the Quantum Model](#relationship-to-the-quantum-model)

---

## Securing Today's Neural Frontier

The Classical Model extends the OSI networking stack into the biological domain, providing the first comprehensive reference architecture for brain-computer interface security. This is the established foundation that the [Quantum Model (QIF)](../qif/) builds upon.

---

## Contents

### Publications (31 documents across 8 topics)

| Topic | Documents | Focus |
|-------|-----------|-------|
| [ONI Framework](publications/0-oni-framework/) | Whitepaper, blog, TechDoc | The original 14-layer model |
| [Coherence Metric](publications/coherence-metric/) | Blog, TechDoc | Signal integrity measurement (Cs) |
| [Detection Theory](publications/detection-theory/) | TechDoc | Privacy-preserving ML for neural signals |
| [Mathematical Foundations](publications/mathematical-foundations/) | 3 TechDocs | Equations reference and audit |
| [Neural Firewall](publications/neural-firewall/) | Blog, TechDoc | Layer 8 security architecture |
| [Neural Ransomware](publications/neural-ransomware/) | Blog, TechDoc | Threat modeling for BCIs |
| [Quantum Encryption](publications/quantum-encryption/) | 3 Blogs, 2 TechDocs | QKD, tunneling traversal time |
| [Scale-Frequency](publications/scale-frequency/) | Blog, TechDoc | The f x S ~ k invariant |

### Python Packages

| Package | Version | Install |
|---------|---------|---------|
| **oni-framework** | 0.2.0 | `pip install oni-framework` |
| **oni-tara** | 0.8.0 | `pip install oni-tara` |

- [oni-framework/](oni-framework/) — 14-layer model, coherence metric, scale-frequency, neural firewall
- [tara-nsec-platform/](tara-nsec-platform/) — Telemetry Analysis & Response Automation (TARA)

### Threat Taxonomy

- 10 tactics, 46 techniques mapped to ONI layers
- MITRE ATT&CK-inspired neural threat taxonomy
- See: [ONI_THREAT_MATRIX.md](oni-framework/ONI_THREAT_MATRIX.md)

### Resources

- [resources/brand/](resources/brand/) — Brand configuration and sync
- [resources/agents/](resources/agents/) — Research verification personas and protocols
- [resources/templates/](resources/templates/) — APA and blog formatting templates
- [resources/pipeline/](resources/pipeline/) — Research monitoring and keyword tracking
- [resources/editor/](resources/editor/) — Editor agent for cross-reference validation

### Archive

- [archive/website-versions/](archive/website-versions/) — Website evolution (v1 through v6)

---

## Relationship to the Quantum Model

The Classical Model identified the right problem — BCIs have no security standard. The [Quantum Model (QIF)](../qif/) deepens that vision by rebuilding from neuroscience constraints. Key learnings:

1. **BCIs are physical hardware** — they belong at OSI Layer 1, not Layer 8
2. **The brain is a cycle, not a stack** — the funnel model replaced the linear layer model
3. **Consciousness can't be modeled** — v1 relied too heavily on abstract concepts of "self"
4. **Quantum unknowns need containers** — the Q integer concept emerged from this gap

The publications here remain valid research. The architectural model evolved.

---

*Originally developed as: ONI (Open Neurosecurity Interoperability)*
*Author: Kevin Qi*
*See also: [Quantum Model →](../qif/) | [Neuroethics →](../governance/)*
