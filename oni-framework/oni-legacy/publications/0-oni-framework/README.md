# ONI Framework — Index

> **The foundational 14-layer architecture extending OSI into biological neural systems for brain-computer interface security.**

**Status:** Published
**Last Updated:** 2026-01-29
**ONI Layers:** L1-L14 (All)

---

## Summary

The Open Neurosecurity Interoperability (ONI) Framework provides a systematic approach to understanding and securing brain-computer interfaces by extending the familiar OSI networking model into biological territory. Where OSI addresses data flow through silicon infrastructure, ONI adds seven biological layers (L1-L7) representing neural processing from molecular interactions to behavioral outputs.

Layer 8 — the Neural Gateway — serves as the critical boundary where biology meets silicon. This is where BCIs physically interface with neural tissue, and where security concerns become most acute. The framework enables security professionals to apply familiar network defense concepts (firewalls, intrusion detection, signal validation) to an entirely new domain.

By providing a common vocabulary across neuroscience, security engineering, and hardware design, ONI aims to prevent the fragmented approaches that left early internet infrastructure vulnerable.

---

## Dependencies

**This topic builds on:**

| Topic | Relationship |
|-------|--------------|
| OSI Model | Foundational network architecture that ONI extends |
| Neuroscience fundamentals | Biological layer definitions (L1-L7) |

**Topics that build on this:**

| Topic | Relationship |
|-------|--------------|
| [Coherence Metric](../coherence-metric/) | Signal validation mathematics for L8-L10 |
| [Scale-Frequency](../scale-frequency/) | Cross-layer frequency invariants |
| [Neural Firewall](../neural-firewall/) | Zero-trust security implementation at L8 |
| [Neural Ransomware](../neural-ransomware/) | Threat modeling across all layers |
| [Detection Theory](../detection-theory/) | Mathematical threat detection algorithms |
| [Mathematical Foundations](../mathematical-foundations/) | Equations reference, physics chain, mathematical audit |

---

## Documents

| Type | Document | Description |
|------|----------|-------------|
| **Whitepaper** | [**ONI_Whitepaper.md**](ONI_Whitepaper.md) | **Flagship document** — complete framework overview with market analysis, 8 figures, and regulatory alignment ([Web version](https://qinnovates.github.io/ONI/whitepaper/)) |
| Blog | [Blog-ONI_Framework.md](Blog-ONI_Framework.md) | Accessible introduction with real-world context ([Original on Medium](https://medium.com/@qikevinl/the-osi-of-mind-securing-human-ai-interfaces-3ca381b95c29)) |
| TechDoc | [TechDoc-ONI_Framework.md](TechDoc-ONI_Framework.md) | Complete layer specifications and academic methodology |

---

## Key Concepts

| Concept | Definition |
|---------|------------|
| 14-Layer Model | Extension of OSI's 7 layers to include 7 biological layers |
| Neural Gateway (L8) | Critical boundary layer where BCI hardware meets neural tissue |
| Layer-Aware Coherence Cₛ(S) | Unified metric combining Cₛ and f × S ≈ k — frequency-weighted, spatially-aware signal verification |
| Attack Surface | Each layer introduces distinct vulnerabilities requiring layer-specific defenses |
| Cross-Layer Threats | Attacks that propagate between biological and silicon domains |

---

## The 14 Layers

| Layer | Name | Domain |
|:-----:|------|--------|
| L1 | Physical Carrier | Silicon |
| L2 | Link Framing | Silicon |
| L3 | Network Routing | Silicon |
| L4 | Transport Flow | Silicon |
| L5 | Session State | Silicon |
| L6 | Data Encoding | Silicon |
| L7 | Application Interface | Silicon |
| **L8** | **Neural Gateway** | **Bridge** |
| L9 | Ion Channel Encoding | Biology |
| L10 | Oscillatory Synchronization | Biology |
| L11 | Cognitive Session | Biology |
| L12 | Semantic Assembly | Biology |
| L13 | Intent & Agency | Biology |
| L14 | Identity & Ethics | Biology |

---

## Governance & Ethics

| Document | Connection |
|----------|------------|
| [Neuroethics Alignment](../../governance/NEUROETHICS_ALIGNMENT.md) | Maps framework components to cognitive liberty, mental privacy, mental integrity principles |
| [UNESCO Alignment](../../governance/UNESCO_ALIGNMENT.md) | 15 of 17 UNESCO Recommendation (2025) elements implemented |
| [Regulatory Compliance](../../governance/REGULATORY_COMPLIANCE.md) | US & international regulatory mapping — FDA, state neurorights, MIND Act, UNESCO, Chile, EU |
| [Informed Consent](../../governance/INFORMED_CONSENT_FRAMEWORK.md) | Consent architecture for BCIs |

## Related Topics

| Topic | Connection |
|-------|------------|
| [Coherence Metric](../coherence-metric/) | Implements signal trust scoring referenced in L8-L10 |
| [Neural Firewall](../neural-firewall/) | Zero-trust architecture at the Neural Gateway |
| [Scale-Frequency](../scale-frequency/) | Mathematical invariants across biological layers |

---

## Keywords

**Primary:** ONI Framework, brain-computer interface, neural security, BCI architecture, layered security
**Technical:** OSI extension, protocol stack, signal processing, edge computing
**Biological:** neural gateway, synaptic transmission, action potential, cortical layers
**Security:** attack surface, zero-trust, intrusion detection, signal validation

---

## Future Work

- [ ] Detailed attack taxonomy per layer
- [ ] Hardware implementation guidelines for L8
- [x] Compliance mapping to FDA/EU medical device regulations — see [REGULATORY_COMPLIANCE.md](../../governance/REGULATORY_COMPLIANCE.md)
- [ ] Inter-BCI communication protocols (L10-L12)

---

← Back to [Index](../../INDEX.md)
