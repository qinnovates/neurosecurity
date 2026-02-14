<div align="center">

![divider](https://raw.githubusercontent.com/qinnovates/qinnovate/main/docs/images/divider-qinnovate.svg)

</div>

# Qinnovate

**Open Standards for Brain-Computer Interface Security**

Qinnovate develops open frameworks, protocols, and governance standards for securing brain-computer interfaces. Vendor-agnostic. Community-driven. Apache 2.0.

The standards bodies that shaped the internet didn't build browsers. They built the rules that made browsers possible. Qinnovate does the same for neural interfaces.

---

## What We Build

| Standard | What It Does | Status |
|----------|-------------|--------|
| **[QIF](https://qinnovate.com/whitepaper/)** | 11-band hourglass security architecture for BCIs. Mirroring the OSI model for the mind. | v5.2, published |
| **[Preprint](https://doi.org/10.5281/zenodo.18640106)** | Peer-citable academic paper: architecture, TARA, NISS, and Neural Impact Chain. [DOI: 10.5281/zenodo.18640106](https://doi.org/10.5281/zenodo.18640106) | v1.0, published |
| **[TARA](https://qinnovate.com/TARA/)** | 71 attack-therapy technique pairs. STIX 2.1 compliant registry. | v1.0, published |
| **[qtara](https://pypi.org/project/qtara/)** | Official Python SDK for TARA registry management and STIX export. | v0.1.2, released |
| **[NSP](https://qinnovate.com/nsp/)** | Post-quantum wire protocol for BCI data links. Under 4% implant power overhead. | v0.3, draft |
| **[NISS](https://qinnovate.com/scoring/)** | First CVSS v4.0 extension for neural interfaces. 5 metrics CVSS cannot express. | v1.0, published |
| **[Runemate](https://qinnovate.com/runemate/)** | Rendering pipeline: HTML-to-bytecode today, code-to-visual-cortex tomorrow. Vision restoration is the goal. | v0.3, spec |
| **[Governance](https://qinnovate.com/governance/)** | 10 neuroethics and regulatory compliance documents. UNESCO-aligned. | Published |

---

## The TARA Insight

TARA started as an attack matrix. I catalogued 71 BCI attack techniques from a pure security mindset, and something unexpected happened: the same mechanisms kept showing up on the therapeutic side.

Signal injection is an attack vector. It is also the basis of neurostimulation therapy for depression, Parkinson's, and chronic pain. Replay attacks are a threat. Repetitive stimulation protocols are a treatment. The RF mapping techniques an adversary uses to map a building through WiFi walls are the same physics a clinician would use to calibrate a visual prosthesis through electrodes.

About 60% of the 71 techniques map to a therapeutic counterpart today. The boundary between attack and therapy is not mechanism. It is consent, dosage, and oversight.

This means the same framework that scores whether an attack is dangerous can also bound whether a therapy is safe. TARA is both a threat registry and a safety specification. The dual-use mapping is the point.

**If injection attacks are real, then the inverse is also real: controlled injection can treat. The security model IS the safety model.**

[Read the full TARA atlas](https://qinnovate.com/TARA/) | [TARA blog post](https://qinnovate.com/publications/2026-02-09-tara-therapeutic-atlas-of-risks-and-applications/)

---

## Standards We're Inspired By

Qinnovate exists because these organizations proved that open standards make entire industries possible. We hope to collaborate with them as BCI security matures.

| Organization | What They Standardized | What We Learn From Them |
|-------------|----------------------|------------------------|
| **[FIRST.org](https://first.org)** | CVSS (vulnerability scoring), CSIRT coordination | NISS extends their CVSS v4.0 framework for neural impact |
| **[MITRE](https://mitre.org)** | ATT&CK (adversary tactics and techniques framework) | TARA uses ATT&CK-style technique IDs (QIF-T0001+) across 7 domains |
| **[CVE Program](https://cve.org)** | Vulnerability identifiers (CVE-XXXX-XXXXX), operated by MITRE since 1999, transitioning to [CVE Foundation](https://www.thecvefoundation.org/) | TARA technique IDs complement CVE by covering BCI-specific threats that don't map to traditional software vulns |
| **[NIST](https://nist.gov)** | Cybersecurity Framework, NVD (enriches CVEs with CVSS scores), post-quantum crypto (FIPS 203/204) | QIF aligns with NIST CSF; NSP implements ML-KEM/ML-DSA |
| **[IEEE](https://ieee.org)** | Electrical/electronics/computing standards | QIF's 11-band model follows IEEE standards methodology |
| **[W3C](https://w3.org)** | HTML, CSS, WebAssembly, accessibility (WCAG) | Runemate compiles W3C standards (HTML/CSS) to neural bytecode |
| **[IETF](https://ietf.org)** | TCP/IP, TLS, HTTP, DNS (via RFCs) | NSP is designed as an RFC-style protocol specification |
| **[ICANN](https://icann.org)** | Domain names, IP address allocation | Governance model for neutral, global coordination |
| **[ISO](https://iso.org)** | Quality, safety, medical device standards (14971, 62304) | Runemate's regulatory strategy maps to IEC 62304 |
| **[OWASP](https://owasp.org)** | Web application security (Top 10, testing guides) | TARA threat categories parallel OWASP's structured approach |
| **[FDA](https://fda.gov)** | Medical device approval (510(k), De Novo, PMA) | Runemate's Scribe targets FDA Class II/III software classification |

---

## Architecture

### QIF (Quantified Interconnection Framework)

The security model. An 11-band hourglass architecture: 7 silicon bands (S3 Radio down to S1 Analog), a physical interface boundary (I0, the electrode-tissue interface), and 3 neural bands (N1 Peripheral up to N3 Cortical).

- **Whitepaper:** [qinnovate.com/whitepaper](https://qinnovate.com/whitepaper/) (v5.2, 30 pages)
- **Academic Preprint:** [DOI: 10.5281/zenodo.18640106](https://doi.org/10.5281/zenodo.18640106) (25 pages, CC-BY 4.0)
- **Specification:** [qif-framework/](qif-framework/)
- **Interactive explorer:** [qinnovate.com/lab/hourglass.html](https://qinnovate.com/lab/hourglass.html)

### NSP (Neural Security Protocol)

The wire protocol. Post-quantum encryption (ML-KEM, ML-DSA, AES-256-GCM) at the frame level. Designed for implant-class hardware: sub-4ms latency, under 4% power overhead on ARM Cortex-M4.

- **Spec:** [qinnovate.com/nsp](https://qinnovate.com/nsp/)

### TARA (Therapeutic Atlas of Risks and Applications)

The threat-therapy registry. 71 techniques across 7 domains (Access, Collection, Execution, Impact, Persistence, Reconnaissance, Exfiltration) and 11 tactics. Each technique scored with CVSS v4.0 base vectors + NISS extension metrics. MITRE-compatible IDs (QIF-T0001 through QIF-T0071).

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

- **Spec:** [qinnovate.com/runemate](https://qinnovate.com/runemate/) (v0.3, 19 sections, ~2900 lines)
- **Full specification:** [qif-framework/RUNEMATE.md](qif-framework/RUNEMATE.md)

### Governance

10 published documents covering the full neuroethics landscape:

| Document | Scope |
|----------|-------|
| [Accessibility](governance/ACCESSIBILITY.md) | Inclusive BCI design requirements |
| [Data Policy](governance/DATA_POLICY_FAQ.md) | Neural data handling, retention, deletion |
| [Informed Consent](governance/INFORMED_CONSENT_FRAMEWORK.md) | BCI-specific consent protocols |
| [Neuroethics Alignment](governance/NEUROETHICS_ALIGNMENT.md) | Framework-to-ethics principle mapping |
| [Pediatric Considerations](governance/PEDIATRIC_CONSIDERATIONS.md) | Protections for minors |
| [Post-Deployment Ethics](governance/POST_DEPLOYMENT_ETHICS.md) | Ongoing monitoring obligations |
| [QIF Neuroethics](governance/QIF-NEUROETHICS.md) | 11 open questions on quantum biometric governance |
| [Regulatory Compliance](governance/REGULATORY_COMPLIANCE.md) | FDA, EU MDR, neurorights mapping |
| [Transparency](governance/TRANSPARENCY.md) | Human-AI collaboration audit trails |
| [UNESCO Alignment](governance/UNESCO_ALIGNMENT.md) | International neuroethics principles |

---

## Website

[qinnovate.com](https://qinnovate.com) is built with [Astro](https://astro.build/) 5.x and deployed via GitHub Pages.

```bash
npm install
npm run dev      # localhost:4321
npm run build
npm run preview
```

### Pages

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/whitepaper/` | QIF v5.2 whitepaper (30 pages) |
| `/framework/` | Interactive 3D hourglass model |
| `/TARA/` | 71-technique threat-therapy registry with filtering |
| `/nsp/` | Neural Security Protocol spec |
| `/runemate/` | Runemate compression engine spec |
| `/scoring/` | NISS v1.0 scoring system |
| `/governance/` | 10 neuroethics documents |
| `/publications/` | 16 blog posts and research papers |
| `/news/` | Aggregated BCI/neurosecurity RSS feed |
| `/roadmap/` | Development roadmap with milestones |
| `/glossary/` | Framework terminology |
| `/explore/` | Interactive visualizations hub |
| `/lab/hourglass.html` | Click-into-detail 11-band explorer |
| `/about/` | Mission, author, contact |

---

## Repository Structure

```
qinnovates/qinnovate/
├── src/                        # Astro 5 website
│   ├── pages/                  # 18 page routes
│   ├── components/             # Nav, Footer, Hourglass3D, etc.
│   ├── layouts/                # BaseLayout, PageLayout
│   ├── lib/                    # qif-constants.ts, threat-data.ts, runemate-constants.ts
│   └── styles/                 # global.css (Tailwind 4)
│
├── qif-framework/              # QIF specification
│   ├── framework/              # 9 architectural documents
│   ├── tara-threat/            # TARA threat registry source
│   ├── qif-lab/                # Equation testing
│   ├── QIF-WHITEPAPER.md       # v5.2 whitepaper
│   ├── QIF-TRUTH.md            # Canonical source of truth
│   └── RUNEMATE.md             # Runemate v0.3 spec (19 sections)
│
├── shared/                     # Cross-cutting data
│   └── qtara-registrar.json    # 71 TARA techniques with CVSS + NISS vectors
│
├── governance/                 # 10 neuroethics documents
├── blogs/                      # 16 blog posts (Astro content collection)
├── research/                   # Research notes
├── processes/                  # Standards development lifecycle
│
├── oni-framework/              # ONI 14-layer model (legacy, preserved)
├── oni-legacy/                 # ONI archive (demos, publications)
│
├── docs/                       # Static assets (CNAME, fonts, images)
├── public/                     # Additional static assets
├── scripts/                    # RSS fetcher, utilities
└── .github/workflows/          # CI/CD (deploy, news update, wiki sync)
```

---

## Collaboration

Qinnovate seeks partnerships with researchers, standards bodies, BCI manufacturers, and regulators. The framework is Apache 2.0 because trust is verified, not assumed.

**Contact:** kevin@qinnovate.com
**Website:** [qinnovate.com](https://qinnovate.com)
**GitHub:** [github.com/qinnovates](https://github.com/qinnovates)

---

<div align="center">

**Defining open standards for the neural frontier**

*Apache 2.0 · Vendor-agnostic · Community-driven*

</div>

---

*Founded 2026 · Updated 2026-02-14*
