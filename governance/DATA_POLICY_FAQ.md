---
title: "Data Policy & FAQ"
description: "Data handling, privacy protections, and FAQs about neural data security"
order: 6
---

# QIF Framework Data Policy & FAQ

> **Guide to data handling philosophy, privacy architecture, and frequently asked questions about neural data security in the QIF Framework.**

**Version:** 2.0
**Last Updated:** 2026-03-05
**Status:** Living Document

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Data Handling Philosophy](#2-data-handling-philosophy)
3. [Privacy Architecture (Design Specification)](#3-privacy-architecture-design-specification)
4. [Anonymization & Known Vulnerabilities](#4-anonymization--known-vulnerabilities)
5. [Frequently Asked Questions](#5-frequently-asked-questions)
6. [User Rights (Design Requirements)](#6-user-rights-design-requirements)
7. [Future Roadmap](#7-future-roadmap)

---

## 1. Current State

### What QIF and TARA Are Today

**QIF** (Quantified Interconnection Framework) is a security architecture specification for brain-computer interfaces. It is a framework — a set of standards, threat models, and scoring systems. It is not a deployed product. There is no QIF software running on patient devices today.

**TARA** (Threat Analysis & Risk Assessment) is a static threat registry. It catalogs 109 dual-use BCI attack-therapy techniques with neurorights mappings, severity scores, and clinical correlations. TARA is a JSON dataset and a web-based reference tool. **TARA does not collect, store, receive, or process any user data.** It is a lookup table, not a platform.

**Cs (Coherence Score)** is a neurosecurity scoring metric validated on real EEG data sourced via BrainFlow. Validation was conducted on simulated signals. No human subjects were involved.

**What exists today:**
- A published threat taxonomy (109 techniques, open-source)
- A scoring system (NISS v1.1, validated on real EEG data)
- An architecture specification (11-band hourglass model)
- Governance documents (this one included)
- A preprint (DOI: 10.5281/zenodo.18640105)

**What does not exist yet:**
- Deployed software on any BCI device
- A cloud platform receiving neural data
- Federated learning infrastructure
- User-facing settings or dashboards

This document describes both what exists and what the architecture specifies for future implementations. Sections describing future capabilities are clearly labeled as design specifications.

---

## 2. Data Handling Philosophy

### Core Principle: Local-First Processing

The QIF architecture mandates that raw neural data never leaves the device. All signal processing, scoring, and anomaly detection happens locally.

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVICE (Local Processing)                    │
│                                                                  │
│  Raw Neural Signals → Variance Calculation → Cₛ Score           │
│         ↑                                        ↓               │
│    NEVER LEAVES                          Anonymization Layer     │
│                                                  ↓               │
│                                          Protected Score         │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                                   ▼
                                   Optional: Aggregated alerts only
                                   (design spec — not yet implemented)
```

### What the Architecture Prohibits

| Data Type | Local Processing | External Transmission | Notes |
|-----------|-----------------|----------------------|-------|
| Raw neural signals | ✅ Yes | ❌ **Never** | Waveforms, spike trains, ERP components |
| Decoded thoughts/intentions | ❌ Never extracted | ❌ **Never** | Semantic content never decoded |
| Coherence Score (Cₛ) | ✅ Yes | ⚠️ With protections (future) | See anonymization section |
| Threshold alerts | ✅ Yes | Categorical only (future) | LOW/MEDIUM/HIGH/CRITICAL |
| Device health metrics | ✅ Yes | Aggregated only (future) | Battery, connection quality |

---

## 3. Privacy Architecture (Design Specification)

> **Note:** This section describes the privacy architecture that QIF-compliant implementations must follow. No implementation exists yet.

### Zero-Knowledge Monitoring

The architecture specifies monitoring neural security without accessing neural content:

1. **Mathematical Reduction:** Raw signals → variance components → single Cₛ score
2. **One-Way Transformation:** Cannot reconstruct signals from scores (mathematically proven)
3. **Categorical Alerts:** Threshold breaches transmitted as categories, not values

### Data Access Model (Design Requirement)

| Entity | Access Level | Purpose |
|--------|--------------|---------|
| **User** | Full | Complete access to all local data |
| **Device** | Full | Local processing and protection |
| **Monitoring (if enabled)** | Scores only | Security anomaly detection |
| **Third Parties** | ❌ None | Never sold, shared, or accessed |

### Federated AI Training (Future)

The architecture specifies federated learning so AI models improve without centralizing data:

```
Device A ──┐                    ┌── Improved Model
Device B ──┼── Encrypted ──────►│   (same for all)
Device C ──┤   Gradients        └── Downloaded to
Device D ──┘       │                 all devices
                   ▼
           Secure Aggregation
           (sees no individual data)
```

**Status:** Not implemented. This is a design requirement for future QIF-compliant systems.

---

## 4. Anonymization & Known Vulnerabilities

### CRITICAL: Score Fingerprinting Vulnerability

**The Problem:** Even without raw neural data, Cₛ scores over time could create identifiable patterns. QIF documents this vulnerability openly.

| Risk | Description | Severity |
|------|-------------|----------|
| **Neural Fingerprinting** | Unique variance patterns in how coherence fluctuates | High |
| **Activity Inference** | Sudden Cₛ drops may correlate with specific cognitive states | Medium |
| **Re-identification** | Matching score patterns across sessions to identify users | High |
| **Temporal Correlation** | Time-series analysis revealing daily/weekly patterns | Medium |

### Why Simple Hashing Doesn't Work

Hashing (SHA-256, etc.) would make scores incomparable. Monitoring requires:
- Comparing scores over time (trend detection)
- Detecting threshold breaches (Cₛ < 0.6)
- Aggregating statistics across users

**Hashed scores = no useful monitoring.**

### Specified Mitigations

| Mitigation | How It Works | Trade-off |
|------------|--------------|-----------|
| **Differential Privacy** | Add calibrated Laplacian noise: Cₛ' = Cₛ + Lap(1/ε) | Slight accuracy loss (ε ≈ 1.0) |
| **Bucketed Transmission** | Send LOW/MEDIUM/HIGH instead of exact values | Loses precision for trends |
| **Temporal Aggregation** | 30-second windows for monitoring, 5-minute for training | Delayed detection |
| **Session Unlinkability** | Rotating pseudonyms per session | Cannot track long-term trends |
| **k-Anonymity** | Only transmit when indistinguishable from k-1 others | May delay alerts |

---

## 5. Frequently Asked Questions

### General Questions

#### Q: What is the QIF Framework?
**A:** QIF (Quantified Interconnection Framework) for Neural Security is an open-source security framework for brain-computer interfaces. It uses an 11-band hourglass architecture spanning silicon to synapse, with 7 neural bands (N7–N1), 1 interface band (I0), and 3 silicon bands (S1–S3).

#### Q: Is QIF a surveillance tool?
**A:** **No.** QIF is a security architecture designed for defense and protection. The framework:
- Never decodes thoughts or intentions
- Never transmits raw neural data
- Exists to protect users FROM unauthorized access
- Prioritizes user sovereignty and cognitive freedom

#### Q: Who created QIF?
**A:** QIF was created by Kevin Qi (Qinnovate) with AI assistance from Claude (Anthropic) and cross-validated by Gemini (Google) and ChatGPT (OpenAI). It builds on academic research from published BCI security literature. All contributions are documented in the [Transparency Statement](TRANSPARENCY.md).

---

### Data & Privacy Questions

#### Q: Does TARA collect or store my data?
**A:** **No.** TARA is a static threat taxonomy — a catalog of 109 BCI attack-therapy techniques. It is a reference database, like a dictionary. It does not receive, store, or process any user data, neural signals, or coherence scores.

#### Q: Can the Coherence Score (Cₛ) identify me?
**A:** **This is a known vulnerability we document openly.** Time-series of Cₛ scores could theoretically create identifiable patterns. The architecture specifies mitigations including differential privacy, bucketed transmission, temporal aggregation, and session pseudonyms. See [Section 4](#4-anonymization--known-vulnerabilities).

#### Q: What is the Coherence Score (Cₛ)?
**A:** The Coherence Score measures signal quality and trustworthiness:

```
Cₛ = e^(−(σ²φ + σ²τ + σ²γ))
```

Where:
- σ²φ = Phase variance (timing jitter)
- σ²τ = Transport variance (pathway integrity)
- σ²γ = Gain variance (amplitude stability)

**Interpretation:**
- Cₛ > 0.6: HIGH coherence (trustworthy signal)
- 0.3 < Cₛ ≤ 0.6: MEDIUM coherence (verify context)
- Cₛ ≤ 0.3: LOW coherence (reject or investigate)

#### Q: What attacks does QIF address?
**A:** QIF catalogs threats across all bands of the hourglass model:
- **Signal Injection:** Malicious signals trying to influence neural activity
- **Eavesdropping:** Unauthorized reading of neural data
- **Denial of Service:** Blocking legitimate neural communication
- **Neural Ransomware:** Holding neural function hostage
- **MRI/EMI Interference:** Environmental threats
- **Replay Attacks:** Replaying recorded signals

See the [TARA registry](/TARA/) for the full taxonomy of 109 techniques.

#### Q: Is QIF open source?
**A:** Yes. QIF is licensed under Apache 2.0:
- Free to use, modify, and distribute
- No proprietary dependencies
- Full transparency in implementation
- Community contributions welcome

---

### Ethical Questions

#### Q: How does QIF handle consent?
**A:** QIF specifies a **continuous consent model** informed by Lázaro-Muñoz et al. research:
- **Initial consent** before device activation
- **Ongoing consent** for significant changes
- **Granular scopes** (read, write, store, transmit)
- **Right to revoke** at any time
- **Special protections** for minors and incapacitated individuals

See [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md).

#### Q: What about children and vulnerable populations?
**A:** QIF specifies protections:
- **Minors (age 7-17):** Require both guardian consent AND child assent
- **Incapacitated adults:** Supported decision-making model
- **Transitional (age 16-17):** Increasing autonomy with guardian oversight

See [INFORMED_CONSENT_FRAMEWORK.md](INFORMED_CONSENT_FRAMEWORK.md#pediatric--incapacity-considerations).

#### Q: How do I report security vulnerabilities?
**A:** Report security issues responsibly:
- GitHub Security Advisories: [QIF Repository](https://github.com/qinnovates/qinnovate/security)
- Do NOT disclose publicly until patched

---

## 6. User Rights (Design Requirements)

> **Note:** These are design requirements for future QIF-compliant implementations. No implementation exists with these features today.

### Specified Data Rights

| Right | Description |
|-------|-------------|
| **Access** | View all data collected about you |
| **Portability** | Export data in machine-readable format |
| **Deletion** | Delete your data from all systems |
| **Correction** | Correct inaccurate data |
| **Objection** | Opt out of specific processing |
| **Restriction** | Limit how data is used |

### Opt-Out Requirements

QIF-compliant implementations must support:
- Opting out of any external data transmission
- Fully local mode (no cloud dependency)
- Disabling federated learning contribution
- Excluding data from aggregate statistics

---

## 7. Future Roadmap

### Planned Privacy Enhancements

| Feature | Status | Description |
|---------|--------|-------------|
| Federated AI Training | Design spec | TensorFlow Federated / PySyft integration |
| Homomorphic Encryption | Research | Compute on encrypted scores |
| Zero-Knowledge Proofs | Research | Prove compliance without revealing data |
| On-Device ML | Design spec | All inference local, no cloud dependency |

### Open Research Questions

1. Can Cs score time-series be used for fingerprinting? (Active mitigation designed)
2. What is the optimal privacy budget (ε) for neural data?
3. How to handle non-IID neural data in federated learning?
4. Can gradient inversion attacks reveal neural patterns?

### How to Contribute

- **Security Research:** Report vulnerabilities responsibly
- **Privacy Improvements:** Submit PRs for better anonymization
- **Documentation:** Help clarify confusing sections
- **Translation:** Make this accessible in more languages

---

## References

- Kohno, T., et al. (2009). Neurosecurity: Brain-Computer Interfaces and the Challenge of Providing Security and Privacy.
- Bonaci, T., et al. (2015). App stores for the brain: Privacy & security in Brain-Computer Interfaces.
- Lázaro-Muñoz, G., et al. (2020, 2022). Informed consent for implantable BCIs.
- McMahan, B., et al. (2017). Communication-Efficient Learning of Deep Networks from Decentralized Data.
- Abadi, M., et al. (2016). Deep Learning with Differential Privacy.

---

*This document is part of the QIF Framework governance documentation. For questions not covered here, please open a GitHub issue.*

**Document History:**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-26 | Initial release |
| 2.0 | 2026-03-05 | Major revision: clarified TARA is a static registry (no data storage), distinguished current state from design specs, updated to 11-band hourglass, removed references to non-existent UI/platform |

---

← Back to [Governance](/governance/) | [Neurosecurity Governance](NEUROSECURITY_GOVERNANCE.md)
