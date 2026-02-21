---
title: "Neuroethics Alignment"
description: "How the QIF Framework addresses core principles of neuroethics and cognitive liberty"
order: 2
---

# QIF Framework: Neuroethics Alignment

> How the QIF Framework addresses core principles of neuroethics and cognitive liberty.

**Last Updated:** 2026-02-10
**Version:** 1.2

---

## Table of Contents

- [Overview](#overview)
- [Privacy & Ethics Statement](#privacy--ethics-statement)
- [Core Neuroethics Principles](#core-neuroethics-principles)
- [Framework-to-Ethics Mapping](#framework-to-ethics-mapping)
  - [Coherence Metric (Cₛ) → Mental Integrity](#1-coherence-metric-cₛ--mental-integrity)
  - [Neural Firewall (L8) → Cognitive Liberty & Mental Integrity](#2-neural-firewall-l8--cognitive-liberty--mental-integrity)
  - [14-Layer Model → Comprehensive Threat Mapping](#3-14-layer-model--comprehensive-threat-mapping)
  - [Scale-Frequency Invariant → Anomaly Detection](#4-scale-frequency-invariant--anomaly-detection-for-mental-integrity)
  - [Transport Variance → Mental Privacy Protection](#5-transport-variance--mental-privacy-protection)
  - [Signal Rejection → Cognitive Sovereignty](#6-signal-rejection--cognitive-sovereignty)
- [Ethical Design Decisions Summary](#ethical-design-decisions-summary)
- [Stakeholder Perspectives (Lázaro-Muñoz Framework)](#stakeholder-perspectives-lázaro-muñoz-framework)
- [Gaps and Future Work](#gaps-and-future-work)
- [Alignment with Regulatory Frameworks](#alignment-with-regulatory-frameworks)
- [For Academic Review](#for-academic-review)
- [References](#references)

---

## Overview

The QIF Framework was designed with neuroethical principles as foundational constraints, not afterthoughts. This document maps each framework component to the ethical principles it protects and explains the design decisions through a neuroethics lens.

---

## Privacy & Ethics Statement

**QIF is NOT a surveillance framework.**

The QIF Framework exists to **protect** neural privacy and ensure the **integrity** of brain-computer interfaces. Its purpose is:

- **Defense** against malicious attacks (nation-state actors, cybercriminals, ransomware)
- **Protection** from accidental risks (MRI exposure, electromagnetic interference, device malfunction)
- **Privacy preservation** ensuring neural data remains confidential
- **Availability** maintaining BCI functionality when users depend on it
- **Human sovereignty** keeping humans in control of their own neural interfaces

The framework provides security without requiring surveillance. Signal integrity can be validated without reading thoughts. Attacks can be detected without decoding intent. The goal is to implement BCI security that preserves confidentiality, integrity, and availability — the same principles that protect all other computing systems.

---

## Core Neuroethics Principles

The following principles are widely recognized in neuroethics literature (Ienca & Andorno, 2017; Yuste et al., 2017; UNESCO IBC, 2021; UNESCO Recommendation on the Ethics of Neurotechnology, 2025):

> **See also:** [UNESCO_ALIGNMENT.md](UNESCO_ALIGNMENT.md) — comprehensive mapping of QIF to all three pillars of the UNESCO Recommendation on the Ethics of Neurotechnology (2025), the first global normative framework adopted by 194 Member States.

| Principle | Definition | Threat Without Protection |
|-----------|------------|---------------------------|
| **Cognitive Liberty** | Right to mental self-determination; freedom from unauthorized interference | External control of thoughts, forced neural modification |
| **Mental Privacy** | Right to keep neural data and mental states confidential | Unauthorized brain reading, thought surveillance |
| **Mental Integrity** | Right to protection from unauthorized alteration of neural function | Neural hacking, cognitive manipulation, "brain malware" |
| **Psychological Continuity** | Right to maintain personal identity and sense of self | Identity manipulation, memory tampering, personality modification |

---

## Framework-to-Ethics Mapping

### 1. Coherence Metric (Cₛ) → Mental Integrity

**The Problem**: How does a person (or their BCI) know if a neural signal is genuinely from their own brain versus injected by an attacker?

**QIF Solution**: The coherence metric quantifies signal trustworthiness across three dimensions:

| Component | What It Measures | Integrity Protection |
|-----------|------------------|----------------------|
| Phase variance (σ²φ) | Timing consistency | Detects out-of-sync injections that don't match brain rhythms |
| Transport variance (σ²τ) | Pathway integrity | Flags signals bypassing biological routes |
| Gain variance (σ²γ) | Amplitude stability | Catches artificially over/under-powered signals |

**Ethical Reasoning**: A signal that doesn't match expected biological patterns may indicate unauthorized alteration of neural function. By scoring coherence, the system provides a *quantitative basis* for mental integrity assessment (Ienca & Andorno, 2017).

**Design Decision**: The formula `Cₛ = e^(−(σ²φ + σ²τ + σ²γ))` was chosen because:
- Exponential decay ensures high sensitivity to small variances
- Multiplicative combination means *any* anomaly reduces trust
- Score range [0,1] enables threshold-based decisions

---

### 2. Neural Firewall (L8) → Cognitive Liberty & Mental Integrity

**The Problem**: How do you prevent unauthorized neural signals from reaching the brain (input attacks) or unauthorized reading of neural signals (output attacks)?

**QIF Solution**: Zero-trust security at the Neural Gateway (Layer 8), where electrodes meet neurons.

| Firewall Feature | Liberty/Integrity Protection |
|------------------|------------------------------|
| Coherence threshold | Blocks signals that don't "belong" |
| Authentication requirement | Ensures signal source is verified |
| Amplitude bounds | Prevents dangerously strong stimulation |
| Rate limiting | Stops flooding/DoS attacks on neural tissue |
| ACCEPT_FLAG state | Allows human review of borderline cases |

**Ethical Reasoning**:
- **Cognitive Liberty**: The firewall enforces the user's right to choose what enters their neural space. Unauthenticated signals are rejected regardless of coherence—you must have permission.
- **Mental Integrity**: Hardware bounds and rate limiting protect against physical harm from overstimulation.

**Design Decision**: The decision matrix requires *both* high coherence AND valid authentication for unconditional acceptance. This embodies the principle that even "good-looking" signals need permission—benevolent paternalism without consent is still a violation.

```
High Coherence + No Auth = REJECT (consent required)
Low Coherence + Valid Auth = REJECT (harm prevention)
```

---

### 3. 14-Layer Model → Comprehensive Threat Mapping

**The Problem**: Where can attacks occur? Where should defenses be placed?

**QIF Solution**: A complete architectural model from molecules to applications, with attack surfaces and defenses catalogued at each layer.

| Layer Range | Ethical Concern | QIF Contribution |
|-------------|-----------------|------------------|
| L1-L3 (Molecular→Microcircuit) | Biological manipulation at cellular level | Identifies attack surfaces; notes biological defenses |
| L4-L7 (Regional→Behavioral) | Higher-order cognitive manipulation | Maps system-level vulnerabilities |
| L8 (Neural Gateway) | The critical boundary | Places firewall at bio-digital interface |
| L9-L14 (Biology) | Neural/cognitive attack vectors | QIF-specific neurodefense applies |

**Ethical Reasoning**: You cannot protect what you cannot name. The 14-layer model provides *vocabulary* for discussing neural security across disciplines (neuroscience, security, ethics, law).

**Design Decision**: Layer 8 is explicitly marked as the "firewall layer" because:
- It's the boundary between biological autonomy and digital control
- Attacks at L8 can propagate in both directions
- Defense-in-depth requires strongest protection at the interface

---

### 4. Scale-Frequency Invariant → Anomaly Detection for Mental Integrity

**The Problem**: How do you detect signals that are technically "correct" but biologically implausible?

**QIF Solution**: The f × S ≈ k invariant validates that signal frequencies match the spatial scale they claim to originate from.

| Check | What It Catches | Integrity Protection |
|-------|-----------------|---------------------|
| Frequency vs. scale | Signals with wrong frequency for claimed origin | Attacker using 100Hz to target whole-brain (should be ~1Hz) |
| Deviation scoring | How "wrong" a signal is | Graduated response based on anomaly severity |
| Hierarchy validation | Does signal fit known neural processing levels? | Flags signals that don't match any biological scale |

**Ethical Reasoning**: An attacker might craft a signal that passes coherence checks but targets the wrong level of neural processing. Scale-frequency validation provides a *biological plausibility check* independent of signal quality.

---

### 5. Transport Variance → Mental Privacy Protection

**The Problem**: How do you detect if someone is accessing neural signals through unauthorized pathways?

**QIF Solution**: Transport variance (σ²τ) measures pathway integrity based on expected reliability of biological signal routes.

**Ethical Reasoning**: If a signal arrives via an unexpected pathway (bypassing normal synaptic routes), it may indicate:
- Unauthorized access point
- Compromised electrode
- Side-channel attack

By modeling expected pathway reliability, the system can flag signals that "took the wrong route"—a potential privacy breach.

---

### 6. Signal Rejection → Cognitive Sovereignty

**The Problem**: Who has final say over what enters or exits the neural space?

**QIF Solution**: The firewall's REJECT decision is absolute. Rejected signals do not reach neural tissue.

**Ethical Design Principles**:

1. **Default Deny**: Unknown signals are rejected, not accepted
2. **User Override**: System should support user-configurable thresholds (future work)
3. **Transparency**: Every rejection includes a reason (`result.reason`)
4. **Logging**: All decisions logged for audit (`firewall.log`)

**Ethical Reasoning**: Cognitive sovereignty means the human retains ultimate authority. The firewall is a *tool* that implements the user's policy, not an autonomous gatekeeper making independent judgments about what's "good" for the user.

---

## Ethical Design Decisions Summary

| Decision | Alternatives Considered | Ethical Reasoning for Choice |
|----------|------------------------|------------------------------|
| Exponential coherence decay | Linear scoring | Higher sensitivity to anomalies protects integrity |
| Authentication required even for high-coherence signals | Coherence-only acceptance | Consent is non-negotiable; quality doesn't imply permission |
| ACCEPT_FLAG intermediate state | Binary accept/reject | Allows human review; preserves user agency in edge cases |
| Open-source framework | Proprietary/closed | Transparency enables scrutiny; security through obscurity fails |
| Explicit documentation of limitations | Marketing-style claims | Honesty about research status enables informed adoption |

---

## Stakeholder Perspectives (Lázaro-Muñoz Framework)

Research by [Gabriel Lázaro-Muñoz et al.](https://bioethics.hms.harvard.edu/faculty-staff/gabriel-lazaro-munoz) at Harvard Medical School and Massachusetts General Hospital provides empirical grounding for QIF's ethical framework through extensive stakeholder interviews.

### Researcher-Identified Ethical Concerns

From interviews with 23 adaptive DBS researchers (Lázaro-Muñoz et al., 2020):

| Concern | Frequency | QIF Framework Response |
|---------|-----------|----------------------|
| **Data Privacy & Security** | 91% | Coherence validation, Privacy Score (Pₛ), BCI Anonymizer |
| **Risks & Safety** | 83% | Amplitude bounds, rate limiting, REJECT decisions |
| **Informed Consent** | 74% | See [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md) |
| **Automaticity & Programming** | 65% | Biomarker validation via scale-frequency invariant |
| **Autonomy & Control** | 57% | User Override Interface (planned), ACCEPT_FLAG pathway |
| **Patient Selection** | 39% | Candidacy criteria documentation |
| **Post-Trial Access** | 39% | See [POST_DEPLOYMENT_ETHICS.md](POST_DEPLOYMENT_ETHICS.md) |
| **Personality & Identity** | 30% | L14 Identity Layer protection, psychological continuity |

### Multi-Stakeholder Decision Model

QIF recognizes that neural device decisions involve multiple stakeholders with legitimate interests:

| Stakeholder | Role | Framework Integration |
|-------------|------|----------------------|
| **Patient/User** | Primary autonomy holder | Consent requirements, override capability |
| **Caregiver** | Support and assistance | Trusted contact designation, escalation paths |
| **Clinician** | Medical expertise | Candidacy assessment, parameter guidance |
| **Researcher** | Scientific understanding | Transparency documentation, data sharing protocols |
| **Engineer/Developer** | Technical capabilities | Security implementation, documentation |

### Relational Autonomy

Rather than strict individual autonomy, QIF adopts a **relational autonomy** model:

> "Patients could identify a close caregiver to provide assistance" in treatment decisions. — Lázaro-Muñoz et al., 2020

This means:
- Autonomy is exercised within relationships, not in isolation
- Trusted others can be formally designated in consent records
- ACCEPT_FLAG decisions can escalate to designated stakeholders
- Collaborative decision-making is supported, not just tolerated

### Special Populations

For populations requiring additional protections, see:

| Population | Reference Document |
|------------|-------------------|
| Children and adolescents | [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md#pediatric--incapacity-considerations) |
| Adults with cognitive impairment | [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md#incapacity-considerations) |
| Post-trial participants | [POST_DEPLOYMENT_ETHICS.md](POST_DEPLOYMENT_ETHICS.md) |

---

## Gaps and Future Work

### Policy-Layer Neurorights (Outside Security Scope)

Three neurorights proposed by Yuste and the NeuroRights Foundation (2017) and reinforced by UNESCO's 2025 Recommendation are intentionally not mapped in QIF's threat taxonomy. These are distributive justice and governance concerns — no attack technique directly violates them, and they cannot be operationalized through a security framework alone:

| Right | Source | Why Outside QIF Scope |
|-------|--------|----------------------|
| **Equitable Access to Mental Augmentation** | Yuste et al. (2017); UNESCO (2025) | Structural inequality, not an attack vector. No technique in TARA violates "fair access." |
| **Protection from Algorithmic Bias** | Yuste et al. (2017) | Downstream consequence of data misuse, partially addressed by Mental Privacy (MP). Bias arises from systems processing neural data, not from attacks on the interface itself. |
| **Free Will / Autonomous Decision-Making** | Yuste et al. (2017) | Substantially overlaps with Cognitive Liberty (CL), which covers freedom from external interference with mental processes. The philosophical distinction between CL and free will is important for neuroethics but does not produce distinct attack-technique-to-harm mappings. |

These rights are addressed at QIF's governance layer (this document, regulatory compliance guidance, and open publication) rather than the security layer (TARA, NISS, hourglass model). Their full operationalization is an active area of research.

### Currently Unaddressed

| Ethical Concern | Status | Notes |
|-----------------|--------|-------|
| **Informed Consent Mechanisms** | Not implemented | Framework validates signals but doesn't manage consent workflows |
| **User Override Interface** | Designed, not built | Users should be able to adjust thresholds based on risk tolerance |
| **Long-term Identity Protection** | Theoretical only | Psychological continuity requires longitudinal monitoring not in scope |
| **Pediatric/Incapacity Considerations** | Not addressed | Surrogate decision-making adds complexity |
| **Dual-Use Concerns** | Acknowledged | Security tools can inform attacks; mitigated by open publication |

### Planned Additions

1. **Neural Authentication Module** — Identity verification via neural signatures
2. **Consent Protocol Integration** — Hooks for consent management systems
3. **Adversarial Testing Framework** — Validate defenses against known attack patterns
4. **Regulatory Compliance Mapping** — FDA, EU AI Act, UNESCO recommendations

---

## Alignment with Regulatory Frameworks

| Framework | QIF Alignment |
|-----------|---------------|
| **UNESCO Recommendation on Ethics of Neurotechnology (2025)** | **15 of 17 elements fully implemented** — see [UNESCO_ALIGNMENT.md](UNESCO_ALIGNMENT.md) for complete mapping |
| **UNESCO IBC Report on Ethical Issues of Neurotechnology (2021)** | All five ethical challenges addressed: mental integrity, psychological continuity, autonomy, mental privacy, accessibility |
| **EU AI Act (2024)** | High-risk AI system transparency requirements met via documentation |
| **FDA Neural Device Guidance (2023)** | Security-by-design principles implemented |
| **IEEE Neuroethics Framework (2020)** | Human agency and oversight emphasized |
| **OECD Responsible Innovation in Neurotechnology (2019)** | Accountability, transparency, safety, and public engagement |
| **Chile Constitutional Neurorights Amendment (2021)** | Brain data protection precedent; regulatory compliance maps this framework |

---

## For Academic Review

This document demonstrates:

1. **Ethical Grounding**: Technical decisions traced to ethical principles
2. **Comprehensive Coverage**: All major neuroethics concerns addressed or explicitly noted as gaps
3. **Design Transparency**: Alternatives considered and reasoning documented
4. **Intellectual Honesty**: Limitations acknowledged; framework positioned as research, not solution

---

## References

Ienca, M., & Andorno, R. (2017). Towards new human rights in the age of neuroscience and neurotechnology. *Life Sciences, Society and Policy*, 13(1), 5.

Yuste, R., Goering, S., Arcas, B. A. Y., et al. (2017). Four ethical priorities for neurotechnologies and AI. *Nature*, 551(7679), 159-163.

UNESCO. (2025). *Recommendation on the Ethics of Neurotechnology*. Adopted at the 43rd session of the General Conference. https://www.unesco.org/en/ethics-neurotech/recommendation

UNESCO. (2021). *Ethical Issues of Neurotechnology*. International Bioethics Committee (IBC). https://unesdoc.unesco.org/ark:/48223/pf0000378724

OECD. (2019). *Recommendation on Responsible Innovation in Neurotechnology*. https://legalinstruments.oecd.org/api/print?ids=658&Lang=en

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2020). Researcher Perspectives on Ethical Considerations in Adaptive Deep Brain Stimulation Trials. *Frontiers in Human Neuroscience*, 14, 578695. https://doi.org/10.3389/fnhum.2020.578695

Lázaro-Muñoz, G., Pham, M. T., Muñoz, K. A., et al. (2022). Post-trial access in implanted neural device research: Device maintenance, abandonment, and cost. *Brain Stimulation*, 15(5), 1029-1036. https://doi.org/10.1016/j.brs.2022.07.051

Muñoz, K. A., Blumenthal-Barby, J., Storch, E. A., Torgerson, L., & Lázaro-Muñoz, G. (2020). Pediatric Deep Brain Stimulation for Dystonia: Current State and Ethical Considerations. *Cambridge Quarterly of Healthcare Ethics*, 29(4), 557-573.

---

← Back to [Governance](/governance/) | [UNESCO_ALIGNMENT.md](UNESCO_ALIGNMENT.md) | [TRANSPARENCY.md](TRANSPARENCY.md)
