<div align="center">

![divider](https://raw.githubusercontent.com/qinnovates/qinnovate/main/docs/images/divider-qinnovate.svg)

</div>

# Qinnovate

**Open Standards for Brain-Computer Interface Security**

Qinnovate develops open frameworks, protocols, and governance standards for securing brain-computer interfaces. Vendor-agnostic. Community-driven. Apache 2.0.

The standards bodies that shaped the internet didn't build browsers. They built the rules that made browsers possible. Qinnovate does the same for neural interfaces.

---

> **Research Disclaimer**
>
> This project is early-stage research by a solo researcher. The frameworks, threat models, and scoring systems published here are derived from existing peer-reviewed neuroscience, physics, and cybersecurity literature, combined with the author's professional security experience. They have not been independently peer-reviewed or empirically validated as a whole.
>
> **What has been tested:** A small number of TARA techniques have been validated through direct experimentation, including protocol-level vulnerability research with coordinated disclosure. The individual research papers cited throughout are peer-reviewed and verified.
>
> **What has not been tested:** The majority of the 103 TARA techniques are theoretical threat models constructed from published research. The attack chains, NISS scores, Neural Impact Chains, DSM-5-TR diagnostic mappings, and depth-of-penetration models are analytical derivations, not empirical results. The BCI limits equation is a hypothesis awaiting validation. The NSP protocol has been implemented but not deployed on real BCI hardware.
>
> **What this means:** Empirical validation of this work requires a multidisciplinary research group with access to BCI hardware, IRB-approved human subjects protocols, clinical neuroscience expertise, and controlled lab environments. That is beyond what one person can do. The frameworks are published openly so that research groups with those resources can test, validate, refute, or extend them.
>
> **If you are a researcher, lab, or institution interested in empirical validation, [please reach out](mailto:kevin@qinnovate.com).** This work needs collaborators.

---

## What We Build

| Standard | What It Does | Status |
|----------|-------------|--------|
| **[QIF](https://qinnovate.com/whitepaper/)** | 11-band hourglass security architecture for BCIs. Mirroring the OSI model for the mind. | v6.2.1, published |
| **[Preprint](https://doi.org/10.5281/zenodo.18640105)** | Peer-citable academic paper: architecture, TARA, NISS, and Neural Impact Chain. [DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105) | v1.4, published |
| **[TARA](https://qinnovate.com/TARA/)** | 103 attack-therapy technique pairs. STIX 2.1 compliant registry. | v1.0, published |
| **[qtara](https://pypi.org/project/qtara/)** | Official Python SDK for TARA registry management and STIX export. | v0.1.2, released |
| **[NSP](https://qinnovate.com/nsp/)** | Post-quantum wire protocol for BCI data links. Under 4% implant power overhead. | v0.4, Secure Core Complete |
| **[NISS](https://qinnovate.com/scoring/)** | First CVSS v4.0 extension for neural interfaces. 5 metrics CVSS cannot express. | v1.0, published |
| **[Runemate](https://qinnovate.com/runemate/)** | Rendering pipeline: HTML-to-bytecode today, code-to-visual-cortex tomorrow. Vision restoration is the goal. | v0.4, Secure Pipe Verified |
| **[Governance](https://qinnovate.com/governance/)** | 12 neuroethics and regulatory compliance documents. UNESCO-aligned. | Published |
| **[Tools](./tools/)** | Accessible security tools (e.g., macshield) to secure the workstation layer. | NEW (Alpha) |

---

## The TARA Insight

TARA started as an attack matrix. I catalogued 102 BCI attack techniques from a pure security mindset, and something unexpected happened: the same mechanisms kept showing up on the therapeutic side.

Signal injection is an attack vector. It is also the basis of neurostimulation therapy for depression, Parkinson's, and chronic pain. Replay attacks are a threat. Repetitive stimulation protocols are a treatment. The RF mapping techniques an adversary uses to map a building through WiFi walls are the same physics a clinician would use to calibrate a visual prosthesis through electrodes.

About 75% of the 102 techniques map to a therapeutic counterpart today. The boundary between attack and therapy is not mechanism. It is consent, dosage, and oversight.

This means the same framework that scores whether an attack is dangerous can also bound whether a therapy is safe. TARA is both a threat registry and a safety specification. The dual-use mapping is the point.

**If injection attacks are real, then the inverse is also real: controlled injection can treat. The security model IS the safety model.**

[Read the full TARA atlas](https://qinnovate.com/TARA/) | [TARA blog post](https://qinnovate.com/publications/2026-02-09-tara-therapeutic-atlas-of-risks-and-applications/)

---

## Architecture

### QIF (Quantified Interconnection Framework)

The security model. An 11-band hourglass architecture: 7 neural bands (N7 Neocortex down to N1 Spinal Cord), a physical interface boundary (I0, the electrode-tissue interface), and 3 silicon bands (S1 Analog up to S3 Radio/Wireless).

- **Whitepaper:** [qinnovate.com/whitepaper](https://qinnovate.com/whitepaper/) (v6.2.1)
- **Academic Preprint:** [DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105) (28 pages, CC-BY 4.0, always latest version)
- **Specification:** [qif-framework/](qif-framework/)
- **Interactive explorer:** [qinnovate.com/lab/hourglass.html](https://qinnovate.com/lab/hourglass.html)

### NSP (Neural Security Protocol)

The wire protocol. Post-quantum encryption (ML-KEM, ML-DSA, AES-256-GCM) at the frame level. Designed for implant-class hardware: sub-4ms latency, under 4% power overhead on ARM Cortex-M4.

- **Spec:** [qinnovate.com/nsp](https://qinnovate.com/nsp/)
- **Implementation:** [src/lib/nsp-core/](src/lib/nsp-core/) (Rust, PQ-secure)

### TARA (Therapeutic Atlas of Risks and Applications)

The threat-therapy registry. 103 techniques across 8 domains (Access, Collection, Execution, Impact, Persistence, Reconnaissance, Exfiltration, Evasion) and 15 tactics. Each technique scored with CVSS v4.0 base vectors + NISS extension metrics. MITRE-compatible IDs (QIF-T0001 through QIF-T0102).

- **Registry:** [qinnovate.com/TARA](https://qinnovate.com/TARA/)
- **API:** [qinnovate.com/api/stix.json](https://qinnovate.com/api/stix.json) (STIX 2.1 Feed)
- **Data:** [shared/qtara-registrar.json](shared/qtara-registrar.json)
- **SDK:** `pip install qtara`

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

The rendering pipeline. Phase 1 compiles HTML/CSS into Staves bytecode for bandwidth-constrained BCIs (62-77% compression, screens and headsets). Phase 2/3 compiles semantic content into electrode stimulation patterns for direct cortical rendering. The long-term goal is vision restoration: translating visual information into signals a blind patient's visual cortex can interpret.

The Forge (gateway compiler, Rust std) compiles content. The Scribe (implant interpreter, Rust no_std, ~200KB) renders it. TARA validates every output pattern before delivery, bounding both attack severity and therapeutic safety.

Runemate paves the road for BCI content delivery the way W3C paved the road for web content. The bytecode format, the safety bounds, the rendering model: these become the shared infrastructure that BCI manufacturers build on.

- **Spec:** [qinnovate.com/runemate](https://qinnovate.com/runemate/) (v0.4, 19 sections, ~2900 lines)
- **Compiler:** [src/lib/runemate-forge/](src/lib/runemate-forge/) (HTML-to-Staves, encrypted)
- **Full specification:** [qif-framework/RUNEMATE.md](qif-framework/RUNEMATE.md)

### Governance

12 published documents covering the full neuroethics landscape:

| Document | Scope |
|----------|-------|
| [Accessibility](governance/ACCESSIBILITY.md) | Inclusive BCI design requirements |
| [Code of Conduct](governance/CODE_OF_CONDUCT.md) | Community standards and contribution guidelines |
| [Data Policy](governance/DATA_POLICY_FAQ.md) | Neural data handling, retention, deletion |
| [Informed Consent](governance/INFORMED_CONSENT_FRAMEWORK.md) | BCI-specific consent protocols |
| [Neuroethics Alignment](governance/NEUROETHICS_ALIGNMENT.md) | Framework-to-ethics principle mapping |
| [Pediatric Considerations](governance/PEDIATRIC_CONSIDERATIONS.md) | Protections for minors |
| [Post-Deployment Ethics](governance/POST_DEPLOYMENT_ETHICS.md) | Ongoing monitoring obligations |
| [QIF Neuroethics](governance/QIF-NEUROETHICS.md) | 11 open questions on quantum biometric governance |
| [Regulatory Compliance](governance/REGULATORY_COMPLIANCE.md) | FDA, EU MDR, neurorights crosswalk |
| [Regulatory Gaps](governance/REGULATORY_GAPS.md) | Structural challenges in BCI law |
| [Transparency](governance/TRANSPARENCY.md) | Human-AI collaboration audit trails |
| [UNESCO Alignment](governance/UNESCO_ALIGNMENT.md) | International neuroethics principles |

---

## Repository Structure

```
qinnovates/qinnovate/
├── qif-framework/              # QIF specification
│   ├── framework/              # 10 architectural documents
│   ├── tara-threat/            # TARA threat registry source
│   ├── qif-lab/                # Equation testing
│   ├── QIF-WHITEPAPER.md       # v6.2.1 whitepaper
│   ├── QIF-TRUTH.md            # Canonical source of truth
│   └── RUNEMATE.md             # Runemate v0.4 spec
│
├── shared/                     # Cross-cutting data
│   ├── qtara-registrar.json    # 103 TARA techniques (CVSS + NISS)
│   └── archive/                # Deprecated/merged data files
│
├── governance/                 # 11 neuroethics documents
│   └── processes/              # Standards development lifecycle
│
├── paper/                      # Academic publications
│   └── preprint/               # Zenodo preprint (DOI: 10.5281/zenodo.18640105)
│
├── packaging/                  # Published packages
│   └── qtara/                  # Python SDK (pip install qtara)
│
├── crates/                     # Rust implementations
│   └── nsp/                    # Neural Security Protocol (Rust)
│
├── blogs/                      # 18 blog posts (Astro content collection)
├── scripts/                    # RSS fetcher, TARA tools, utilities
│   └── forms/                  # Consulting form & Apps Script handler
│
├── src/                        # Astro 5 website (qinnovate.com)
│   ├── pages/                  # Page routes
│   ├── components/             # Nav, Footer, Hourglass3D, etc.
│   ├── layouts/                # BaseLayout, PageLayout
│   ├── lib/                    # qif-constants.ts, threat-data.ts
│   └── styles/                 # global.css (Tailwind 4)
│
├── archive/                    # Legacy projects (preserved)
│   └── oni-framework/          # ONI 14-layer model
│
├── docs/                       # Built site / GitHub Pages output
└── .github/workflows/          # CI/CD (deploy, news, wiki sync)
```

---

## Collaboration

Qinnovate seeks partnerships with researchers, standards bodies, BCI manufacturers, and regulators. The framework is Apache 2.0 because trust is verified, not assumed.

**Contact:** kevin@qinnovate.com
**Website:** [qinnovate.com](https://qinnovate.com)
**GitHub:** [github.com/qinnovates](https://github.com/qinnovates)

---

## Academic Rigor & Transparency

Qinnovate follows a strict **Dual-Agent Collaboration Protocol** to ensure that all AI-assisted development is auditable and transparent. 

- **Traceable Decisions**: Every AI session is logged in `_memory/collab/`.
- **HITL Verification**: All logs are cryptographically hashed and verified by a human maintainer.
- **Audit Statement**: See our **[Transparency Statement](governance/TRANSPARENCY.md)** for a full record of contributions, cognitive boundaries, and tool disclosures.

---

<div align="center">

**Defining open standards for the neural frontier**

*Apache 2.0 · Vendor-agnostic · Community-driven*

</div>

---

*Founded 2026 · Updated 2026-02-18*
