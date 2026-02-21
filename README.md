<div align="center">

![divider](https://raw.githubusercontent.com/qinnovates/qinnovate/main/docs/images/divider-qinnovate.svg)

</div>

# Qinnovate

**From brain-dumps to frameworks and tangible results.*

Qinnovate develops open frameworks, protocols, and governance alignment with tools for securing brain-computer interfaces. Vendor-agnostic. Community-driven. Apache 2.0.

The standards bodies that shaped the internet didn't build browsers. They built the rules that made browsers possible. Qinnovate does the same for neural interfaces.

---

> **Research Disclaimer**
>
> This project is early-stage research by a solo researcher. The frameworks, threat models, and scoring systems published here are derived from existing peer-reviewed neuroscience, physics, and cybersecurity literature, combined with the author's professional security experience. They have not been independently peer-reviewed or empirically validated as a whole.
>
> **What has been tested:** A small number of TARA techniques have been validated through direct experimentation, including protocol-level vulnerability research with coordinated disclosure. The individual research papers cited throughout are peer-reviewed and verified.
>
> **What has not been tested:** The majority of TARA techniques are theoretical threat models constructed from published research. The attack chains, NISS scores, Neural Impact Chains, DSM-5-TR diagnostic mappings, and depth-of-penetration models are analytical derivations, not empirical results. The BCI limits equation is a hypothesis awaiting validation. The NSP protocol has been implemented but not deployed on real BCI hardware.
>
> **What this means:** Empirical validation of this work requires a multidisciplinary research group with access to BCI hardware, IRB-approved human subjects protocols, clinical neuroscience expertise, and controlled lab environments. That is beyond what one person can do. The frameworks are published openly so that research groups with those resources can test, validate, refute, or extend them.
>
> **If you are a researcher, lab, or institution interested in empirical validation, [please reach out](mailto:kevin@qinnovate.com).** This work needs collaborators.

---

## Table of Contents

- [What We Build](#what-we-build)
- [The TARA Insight](#the-tara-insight)
- [Neurorights Map](#neurorights-map)
- [Architecture](#architecture)
  - [QIF](#qif-quantified-interconnection-framework)
  - [NSP](#nsp-neural-security-protocol)
  - [TARA](#tara-therapeutic-atlas-of-risks-and-applications)
  - [Open API](#open-api)
  - [NISS](#niss-neural-impact-scoring-system)
  - [Runemate](#runemate)
  - [Governance](#governance)
- [Repository Structure](#repository-structure)
- [Other Qinnovates Projects](#other-qinnovates-projects)
- [Collaboration](#collaboration)
- [Academic Rigor & Transparency](#academic-rigor--transparency)

---

<!-- VERSION-TABLE-START — Update versions here when releasing. Canonical sources noted in comments. -->
## What We Build

> `🟢 Shipped` `🟡 In Progress` `🔵 Planned` `🔴 Blocked`

### Frameworks & Specifications

| Component | Description | Status |
|-----------|-------------|--------|
| **[QIF](https://qinnovate.com/whitepaper/)** | 11-band hourglass security architecture for BCIs | 🟢 v6.2.1 |
| **[Preprint](https://doi.org/10.5281/zenodo.18640105)** | Peer-citable academic paper ([DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)) | 🟢 v1.4 |
| **[TARA](https://qinnovate.com/TARA/)** | 103 BCI attack-therapy technique pairs, STIX 2.1 registry | 🟢 v1.6 |
| **[qtara](https://pypi.org/project/qtara/)** | Python SDK for TARA registry management and STIX export | 🟢 v0.2.0 |
| **[NSP](https://qinnovate.com/nsp/)** | Post-quantum wire protocol for BCI data links | 🟡 v0.5, Secure Core done |
| **[NISS](https://qinnovate.com/scoring/)** | First CVSS v4.0 extension for neural interfaces (5 neural metrics) | 🟢 v1.0 |
| **[Runemate](https://qinnovate.com/runemate/)** | Native DSL compiler (67.8% compression), code-to-visual-cortex goal | 🟢 v1.0 Compiler |
| Cortical Renderer | Runemate Phase 2/3: electrode stimulation pattern generation | 🔵 Planned |
| BCI Limits Equation | Information-theoretic bounds on BCI channel capacity | 🟡 Hypothesis |

### Tools & Hardware

| Component | Description | Status |
|-----------|-------------|--------|
| **[Neurowall](./tools/neurowall/)** | Neural firewall neckband (coherence + differential privacy + NISS) | 🟡 v0.5 |
| Neckband hardware | Physical behind-the-neck wearable for Neurowall | 🔵 Planned |
| **[macshield](./tools/macshield/)** | macOS workstation hardening for public WiFi | 🟢 Active |
| neurosim | Simulated BCI attack/defense environment | 🟡 In Progress |

### Governance

| Component | Description | Status |
|-----------|-------------|--------|
| **[Doc suite](https://qinnovate.com/governance/)** | Neuroethics, consent, regulatory compliance, accessibility | 🟢 Published |
| **[Neurorights mapping](governance/NEUROETHICS_ALIGNMENT.md)** | 5 neurorights mapped to enforcement mechanisms | 🟢 Published |
| **[UNESCO alignment](governance/UNESCO_ALIGNMENT.md)** | 15 of 17 UNESCO Recommendation elements implemented | 🟢 Published |
| Regulatory-as-Code | Machine-verifiable compliance via NIST/ISO control codes | 🔵 Planned |

### Academic

| Component | Description | Status |
|-----------|-------------|--------|
| **[Zenodo](https://doi.org/10.5281/zenodo.18640105)** | Preprint published, CC-BY 4.0, LaTeX source included | 🟢 Published |
| arXiv | Cross-post of preprint | 🔴 Needs endorsement |
| Graz BCI Conference | Submission for March 2026 deadline | 🟡 In Progress |
| LSL CVE | Coordinated vulnerability disclosure (liblsl) | 🟡 Awaiting response |
| Peer review / empirical validation | Requires collaborators, IRB, BCI hardware | 🔴 Blocked |

### Website

| Component | Description | Status |
|-----------|-------------|--------|
| **[qinnovate.com](https://qinnovate.com)** | All pages: whitepaper, TARA, scoring, NSP, runemate, governance, lab | 🟢 Live |
<!-- VERSION-TABLE-END -->

---

## The TARA Insight

TARA started as an attack matrix. I catalogued 103 BCI attack techniques from a pure security mindset, and something unexpected happened: the same mechanisms kept showing up on the therapeutic side.

Signal injection is an attack vector. It is also the basis of neurostimulation therapy for depression, Parkinson's, and chronic pain. Replay attacks are a threat. Repetitive stimulation protocols are a treatment. The RF mapping techniques an adversary uses to map a building through WiFi walls are the same physics a clinician would use to calibrate a visual prosthesis through electrodes.

About 75% of the 103 techniques map to a therapeutic counterpart today. The boundary between attack and therapy is not mechanism. It is consent, dosage, and oversight.

This means the same framework that scores whether an attack is dangerous can also bound whether a therapy is safe. TARA is both a threat registry and a safety specification. The dual-use mapping is the point.

**If injection attacks are real, then the inverse is also real: controlled injection can treat. The security model IS the safety model.**

[Read the full TARA atlas](https://qinnovate.com/TARA/) | [TARA blog post](https://qinnovate.com/publications/2026-02-09-tara-therapeutic-atlas-of-risks-and-applications/)

---

## Neurorights Map

Everything Qinnovate builds traces back to five neurorights defined by Ienca & Andorno (2017) and Yuste et al. (2017). This table maps each right to the specific framework, tool, or document that enforces it.

| Neuroright | What It Protects | Enforced By |
|------------|-----------------|-------------|
| **Cognitive Liberty** | Freedom from unauthorized interference with mental self-determination | [QIF](qif-framework/) (coherence metric detects injected signals), [Neurowall](tools/neurowall/) (blocks unauthorized stimulation at the hardware layer), [NISS](https://qinnovate.com/scoring/) CG metric (scores cognitive compromise severity) |
| **Mental Privacy** | Neural data and mental states stay confidential | [NSP](qif-framework/nsp/) (PQ encryption of all BCI data in transit), [TARA](https://qinnovate.com/TARA/) (catalogues 103 data exfiltration vectors), [Data Policy](governance/DATA_POLICY_FAQ.md) (retention and deletion rules), [Informed Consent](governance/INFORMED_CONSENT_FRAMEWORK.md) |
| **Mental Integrity** | Protection from unauthorized alteration of neural function | [QIF](qif-framework/) (signal coherence scoring flags anomalies), [NISS](https://qinnovate.com/scoring/) BI metric (quantifies tissue/pathway damage), [Neurowall](tools/neurowall/) (real-time anomaly detection pipeline), [Runemate](qif-framework/runemate/) (TARA validates every stimulation pattern before delivery) |
| **Psychological Continuity** | Personal identity and sense of self remain intact | [NISS](https://qinnovate.com/scoring/) NP metric (tracks neuroplastic changes over time), [TARA](https://qinnovate.com/TARA/) dual-use mapping (bounds both attack severity and therapeutic safety), [Pediatric Considerations](governance/INFORMED_CONSENT_FRAMEWORK.md#pediatric--incapacity-considerations) (developing brains get extra protections), Project Firefly (privacy-first journaling for kids, coming soon) |
| **Equal Access** | BCI security is not limited to those who can pay | Apache 2.0 license (all specs, code, and data are open), [Open API](https://qinnovate.com/api/tara.json) (free STIX feed, no auth), [qtara SDK](https://pypi.org/project/qtara/) (free Python package), [macshield](tools/macshield/) (free workstation hardening) |

Sources: [Neuroethics Alignment](governance/NEUROETHICS_ALIGNMENT.md) | [UNESCO Alignment](governance/UNESCO_ALIGNMENT.md) | [Code of Ethics](governance/ETHICAL-NEUROSECURITY-CODE-OF-ETHICS.md)

---

## Architecture

### QIF (Quantified Interconnection Framework)

The security model. An 11-band hourglass architecture: 7 neural bands (N7 Neocortex down to N1 Spinal Cord), a physical interface boundary (I0, the electrode-tissue interface), and 3 silicon bands (S1 Analog up to S3 Radio/Wireless).

- **Whitepaper:** [qinnovate.com/whitepaper](https://qinnovate.com/whitepaper/) (v6.2.1)
- **Academic Preprint:** [DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105) (28 pages, CC-BY 4.0, always latest version)
- **Specification:** [qif-framework/](qif-framework/)
- **Interactive explorer:** [qinnovate.com/lab/hourglass.html](https://qinnovate.com/lab/hourglass.html)

### NSP (Neural Security Protocol)

The wire protocol (v0.5). Post-quantum encryption (ML-KEM-768, ML-DSA, AES-256-GCM-SIV) at the frame level. Designed for implant-class hardware: sub-4ms latency, under 4% power overhead on ARM Cortex-M4.

- **Spec:** [qinnovate.com/nsp](https://qinnovate.com/nsp/)
- **Implementation:** [qif-framework/nsp/nsp-core/](qif-framework/nsp/nsp-core/) (Rust, PQ-secure)

### TARA (Therapeutic Atlas of Risks and Applications)

The threat-therapy registry. 103 techniques spanning 8 domains and 15 tactics. Each technique scored with CVSS v4.0 base vectors + NISS extension metrics. MITRE-compatible IDs.

- **Registry:** [qinnovate.com/TARA](https://qinnovate.com/TARA/)
- **API:** [qinnovate.com/api/stix.json](https://qinnovate.com/api/stix.json) (STIX 2.1 Feed)
- **Data:** [shared/qtara-registrar.json](shared/qtara-registrar.json)
- **SDK:** `pip install qtara`

### Open API

The full TARA dataset is available as a public JSON API. No auth required.

| Endpoint | What It Returns |
|----------|----------------|
| [`/api/tara.json`](https://qinnovate.com/api/tara.json) | All techniques with CVSS v4.0 vectors, NISS scores, DSM-5-TR diagnostic mappings, physics feasibility constraints, therapeutic analogs, FDA status, safe dosing parameters, governance requirements, and engineering specs. |
| [`/api/stix.json`](https://qinnovate.com/api/stix.json) | Same data as a STIX 2.1 Bundle. Drop it into any STIX-compatible threat intel platform. |

Each technique includes: attack mechanism, QIF band mapping, dual-use classification (attack vs. therapy), clinical conditions treated by the same mechanism, regulatory crosswalk (FDA, IEC, ISO), DSM-5-TR codes (primary and secondary), and physics coupling parameters.

### NISS (Neural Impact Scoring System)

The scoring extension. First CVSS v4.0 extension designed for neural interfaces. Five metrics that CVSS structurally cannot express:

| Metric | Code | What It Measures |
|--------|------|-----------------|
| Biological Impact | BI | Tissue damage, neural pathway disruption |
| Cognitive Integrity | CG | Memory, attention, executive function compromise |
| Consent Violation | CV | Whether the subject knew and agreed |
| Reversibility | RV | Can the damage be undone? |
| Neuroplasticity | NP | Long-term adaptive/maladaptive neural changes |

- **Scoring:** [qinnovate.com/scoring](https://qinnovate.com/scoring/)
- **Spec:** [qif-framework/NISS-v1.0-SPEC.md](qif-framework/NISS-v1.0-SPEC.md) (pending publication)

### Runemate

The rendering pipeline. v1.0 introduces a native DSL compiler achieving 67.8% compression (1059 B source to 341 B bytecode). Phase 2/3 compiles semantic content into electrode stimulation patterns for direct cortical rendering. The long-term goal is vision restoration: translating visual information into signals a blind patient's visual cortex can interpret.

The Forge (gateway compiler, Rust std) compiles content. The Scribe (implant interpreter, Rust no_std, ~200KB) renders it. TARA validates every output pattern before delivery, bounding both attack severity and therapeutic safety.

- **Spec:** [qinnovate.com/runemate](https://qinnovate.com/runemate/) (v1.0, 19 sections, ~2900 lines)
- **Compiler:** [qif-framework/runemate/forge/](qif-framework/runemate/forge/) (native DSL-to-Staves, encrypted)
- **Full specification:** [qif-framework/RUNEMATE.md](qif-framework/RUNEMATE.md)

### Governance

Published documents covering the full neuroethics landscape:

| Document | Scope |
|----------|-------|
| [Accessibility](governance/ACCESSIBILITY.md) | Inclusive BCI design requirements |
| [Code of Conduct](governance/CODE_OF_CONDUCT.md) | Community standards and contribution guidelines |
| [Data Policy](governance/DATA_POLICY_FAQ.md) | Neural data handling, retention, deletion |
| [Informed Consent](governance/INFORMED_CONSENT_FRAMEWORK.md) | BCI-specific consent + pediatric & incapacity protocols |
| [Neuroethics Alignment](governance/NEUROETHICS_ALIGNMENT.md) | Framework-to-ethics principle mapping |
| [Post-Deployment Ethics](governance/POST_DEPLOYMENT_ETHICS.md) | Ongoing monitoring obligations |
| [QIF Neuroethics](governance/QIF-NEUROETHICS.md) | 11 open questions on quantum biometric governance |
| [Regulatory Compliance](governance/REGULATORY_COMPLIANCE.md) | FDA, EU MDR, neurorights crosswalk, regulatory gaps, NIST/ISO goals |
| [Transparency](governance/TRANSPARENCY.md) | Human-AI collaboration audit trails |
| [UNESCO Alignment](governance/UNESCO_ALIGNMENT.md) | International neuroethics principles |

---

## Repository Structure

```
qinnovates/qinnovate/
├── qif-framework/              # QIF specification + implementations
│   ├── framework/              # Architectural documents
│   ├── tara-threat/            # TARA threat registry source
│   ├── qif-lab/                # Equation testing
│   ├── nsp/                    # Neural Security Protocol (Rust + spec)
│   │   └── nsp-core/           # Rust PQ-secure implementation
│   ├── runemate/               # Runemate rendering pipeline
│   │   └── forge/              # DSL compiler (Rust)
│   ├── archive/                # Legacy models
│   │   └── oni-framework/      # ONI 14-layer model
│   ├── QIF-WHITEPAPER.md
│   ├── QIF-TRUTH.md
│   ├── QIF-FIELD-JOURNAL.md
│   ├── QIF-DERIVATION-LOG.md
│   └── RUNEMATE.md
│
├── shared/                     # Cross-cutting data + tools
│   ├── qtara-registrar.json    # TARA techniques (CVSS + NISS)
│   ├── qtara/                  # Python SDK (pip install qtara)
│   ├── scripts/                # Data pipeline scripts
│   └── archive/                # Deprecated data files
│
├── paper/                      # Academic publications
│   └── preprint/               # Zenodo preprint
│
├── governance/                 # Neuroethics documents
│   └── processes/              # Standards development lifecycle
│
├── tools/                      # Practical security tools
│   ├── macshield/              # macOS workstation hardening
│   └── neurowall/              # Neural firewall neckband
│
├── blogs/                      # Blog posts + field journal entries
├── scripts/                    # Site scripts + CI utilities
│   └── verify/                 # Citation & fact verification pipeline
│
├── src/                        # Astro 5 website (qinnovate.com)
│   ├── pages/
│   ├── components/
│   ├── layouts/
│   ├── lib/                    # TS constants + utilities
│   └── styles/
│
├── docs/                       # Built site / GitHub Pages output
└── .github/workflows/          # CI/CD
```

---

## Other Qinnovates Projects

| Project | Description |
|---------|-------------|
| **Project Firefly** | Privacy-first journaling app for kids. Local-first architecture, COPPA/GDPR compliant. (Private, in development) |

---

## Collaboration

Qinnovate seeks partnerships with researchers, standards bodies, BCI manufacturers, and regulators. The framework is Apache 2.0 because trust is verified, not assumed.

**Contact:** kevin@qinnovate.com
**Website:** [qinnovate.com](https://qinnovate.com)
**GitHub:** [github.com/qinnovates](https://github.com/qinnovates)

---

## Academic Rigor & Transparency

Qinnovate follows a strict **Dual-Agent Collaboration Protocol** to ensure that all AI-assisted development is auditable and transparent. 

- **Traceable Decisions**: Every AI session is logged in `_memory/`.
- **HITL Verification**: All logs are cryptographically hashed and verified by a human maintainer.
- **Audit Statement**: See our **[Transparency Statement](governance/TRANSPARENCY.md)** for a full record of contributions, cognitive boundaries, and tool disclosures.

---

<div align="center">

**Defining open standards for the neural frontier**

*Apache 2.0 · Vendor-agnostic · Community-driven*

</div>

---

*Founded 2026*
