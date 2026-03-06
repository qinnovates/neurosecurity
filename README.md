<div align="center">

![divider](https://raw.githubusercontent.com/qinnovates/qinnovate/main/docs/images/divider-qinnovate.svg)

</div>

# Qinnovate

Open security research for brain-computer interfaces. Vendor-agnostic. Apache 2.0.

This project asks a question that existing frameworks have not yet systematically addressed: **what happens to a patient when their brain-computer interface is compromised?** Not the data. Not the device. The person.

---

### About This Work

The author is a security engineer with ~15 years of IT and security infrastructure experience, not a mathematician, physicist, or neuroscientist. AI tools (primarily Claude, with Gemini and ChatGPT for cross-validation) were used extensively — for literature synthesis, code generation, threat modeling, and writing. All AI-derived claims should be treated as **proposed and unvalidated** until independently verified by domain experts.

The framework, threat taxonomy, and governance structure are the author's contributions. Mathematical formalizations (signal integrity scoring, physics-derived equations) are future work pending collaboration with physicists and neuroscientists.

**Full transparency:** [Transparency Statement](governance/TRANSPARENCY.md) | [Derivation Log](qif-framework/QIF-DERIVATION-LOG.md) (86 entries) | [Validation Status](VALIDATION.md)

---

## Table of Contents

- [Validation Summary](#validation-summary)
- [What This Project Contains](#what-this-project-contains)
- [The TARA Insight](#the-tara-insight)
- [Why Neurosecurity](#why-neurosecurity)
- [Architecture](#architecture)
- [Terminology](#terminology)
- [Repository Structure](#repository-structure)
- [Site Revision History](#site-revision-history)
- [Collaboration](#collaboration)

---

### Validation Summary

Solo research, tested honestly. Full methodology and limitations at **[VALIDATION.md](VALIDATION.md)** | **[Live dashboard](https://qinnovate.com/research/validation/)**

| What | Result | Tier |
|------|--------|------|
| [Neurowall coherence monitor](VALIDATION.md#val-001) | 11/14 at 15s, 9/9 at 20s, 50-run stats, 0% FPR | Simulation + Independent |
| [BrainFlow validation](VALIDATION.md#val-002) | 16-channel, 100% detection, 0% FPR | Independent |
| [Physics security guardrails](VALIDATION.md#val-007) | 12/13 constraints verified, 4-layer architecture | Analytical + Cross-AI |
| [Protocol vulnerability](VALIDATION.md#val-006) | Real vulnerability in BCI streaming protocol, responsibly disclosed | Disclosed |
| [NSP transport](VALIDATION.md#val-003) | Round-trip simulation PASS, 65-90% compression | Simulation |
| [NISS scoring engine](VALIDATION.md#val-004) | 109/109 techniques scored, PINS flags correct | Simulation |
| [Citation verification](VALIDATION.md#val-009) | 3 fabricated citations caught and removed from preprint v1.0 | Audit |
| **Not yet tested** | NISS clinical validation, DSM-5-TR mappings, BCI Limits Eq, real EEG, real hardware, real attacks | |

This is early-stage research by a solo researcher. Empirical validation requires BCI hardware, IRB approval, and clinical expertise. Everything is published openly so research groups with those resources can test, validate, refute, or extend it.

---

## What This Project Contains

### Frameworks & Specifications

| Component | Description | Status |
|-----------|-------------|--------|
| **[QIF](https://qinnovate.com/framework/)** | 11-band hourglass security architecture for BCIs | Proposed, v7.0 |
| **[Working Paper](https://doi.org/10.5281/zenodo.18640105)** | Peer-citable academic paper (CC-BY 4.0) | Published |
| **[TARA](https://qinnovate.com/atlas/tara/)** | 109 BCI attack-therapy technique pairs, STIX 2.1 registry | v1.7 |
| **[qtara](https://pypi.org/project/qtara/)** | Python SDK for TARA registry management and STIX export | v0.2.0 |
| **[NSP](https://qinnovate.com/tools/nsp/)** | Post-quantum wire protocol for BCI data links | In development, v0.5 |
| **[NISS](https://qinnovate.com/atlas/scoring/)** | CVSS v4.0 extension proposal for neural interfaces (6 neural metrics) | Proposed, v1.1 |
| **[Runemate](https://qinnovate.com/tools/runemate/)** | Native DSL compiler (67.8% compression in simulation) | v1.0 Compiler |
| **[Security Guardrails](qif-framework/qif-sec-guardrails.md)** | Physics-derived defense architecture for BCIs | Concept |

### Tools

| Component | Description | Status |
|-----------|-------------|--------|
| **[Neurowall](./tools/neurowall/)** | Neural firewall prototype (differential privacy + NISS + policy engine) | In development, v0.8 |
| **[macshield](https://github.com/qinnovates/macshield)** | macOS workstation hardening for public WiFi | v0.4.1 |

### Governance

| Component | Description | Status |
|-----------|-------------|--------|
| **[Governance Wiki](https://qinnovate.com/governance/)** | Ethics, consent, regulatory compliance, accessibility | Published |
| **[Neurosecurity Governance](governance/NEUROSECURITY_GOVERNANCE.md)** | Neurorights mapping, UNESCO alignment, GRC gap analysis | Published |
| **[Policy Proposal](governance/NEUROSECURITY_POLICY_PROPOSAL.md)** | 6 recommendations for NIST, MITRE, FIRST, IEEE, FDA, UNESCO | v1.2 |

### Research & Academic

| Component | Description | Status |
|-----------|-------------|--------|
| **[Zenodo](https://doi.org/10.5281/zenodo.18640105)** | Working paper, CC-BY 4.0, LaTeX source included | Published |
| **[Research Sources](qif-framework/QIF-RESEARCH-SOURCES.md)** | 309+ verified sources across 9 domains | Active |
| **[CVE-TARA Mapping](shared/cve-technique-mapping.json)** | 55 NVD-verified CVEs mapped to 21 TARA techniques | Published |
| FIRST.org CVSS SIG | NISS proposed as CVSS v4.0 extension; outreach in progress | In progress |
| Peer review / empirical validation | Requires collaborators, IRB, BCI hardware | Blocked |

---

## The TARA Insight

TARA started as an attack matrix. 109 BCI attack techniques catalogued from published literature. Something unexpected emerged: the same mechanisms kept showing up on the therapeutic side.

Signal injection is an attack vector. It is also the basis of neurostimulation therapy for depression, Parkinson's, and chronic pain. The boundary between attack and therapy is not the mechanism. It is consent, dosage, and oversight.

About 75% of the 109 techniques map to a therapeutic counterpart today. This means the same framework that scores whether an attack is dangerous can also help bound whether a therapy is safe. TARA is both a threat registry and a safety reference.

[TARA Atlas](https://qinnovate.com/atlas/tara/) | [TARA blog post](https://qinnovate.com/news/2026-02-09-tara-therapeutic-atlas-of-risks-and-applications/)

---

## Why Neurosecurity

Three fields converge on BCIs. None covers the full problem alone.

| Field | Contributes | Cannot Do Alone |
|-------|------------|----------------|
| Neuroethics | Policies, rights frameworks, consent models | Detect a P300 interrogation attack in real time |
| Neuroscience | Mechanism knowledge, attack surface understanding | Score severity, map attack chains, build detection systems |
| Cybersecurity | TTPs, scoring, detection, incident response | Understand neural biology or define neurorights |

**Neurosecurity** (Denning, Matsuoka & Kohno, 2009) bridges all three. QIF is one attempt to operationalize that bridge — taking phenomena described by neuroscientists and concerns raised by neuroethicists and putting them into a testable security framework.

[Neurosecurity Governance](governance/NEUROSECURITY_GOVERNANCE.md) | [Origin classification of all 109 techniques](shared/qtara-registrar.json)

---

## Architecture

### QIF (Quantified Interconnection Framework)

An 11-band hourglass architecture: 7 neural bands (N7 Neocortex down to N1 Spinal Cord), a physical interface boundary (I0, the electrode-tissue interface), and 3 synthetic bands organized by physics regime and spatial scale (S1 Near-Field/On-Device, S2 Guided-Wave/Host-Local, S3 Far-Field/Wide-Area).

- **Site:** [qinnovate.com/framework](https://qinnovate.com/framework/)
- **Whitepaper:** [qinnovate.com/research/whitepaper](https://qinnovate.com/research/whitepaper/) (v7.1)
- **Working Paper:** [DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)

### TARA (Therapeutic Atlas of Risks and Applications)

109 techniques spanning 8 domains and 15 tactics. Each technique scored with CVSS v4.0 base vectors + proposed NISS extension metrics. MITRE-compatible IDs.

- **Atlas:** [qinnovate.com/atlas/tara](https://qinnovate.com/atlas/tara/)
- **API:** [`/api/tara.json`](https://qinnovate.com/api/tara.json) (full dataset, no auth) | [`/api/stix.json`](https://qinnovate.com/api/stix.json) (STIX 2.1 bundle)
- **SDK:** `pip install qtara`

### NISS (Neural Impact Scoring System)

A proposed CVSS v4.0 extension for neural interfaces. Six metrics that CVSS cannot express:

| Metric | Code | What It Measures |
|--------|------|-----------------|
| Biological Impact | BI | Tissue damage, neural pathway disruption |
| Cognitive Reconnaissance | CR | Thought decoding, neural data inference |
| Cognitive Disruption | CD | Perception manipulation, cognitive coercion |
| Consent Violation | CV | Whether the subject knew and agreed |
| Reversibility | RV | Can the damage be undone? |
| Neuroplasticity | NP | Long-term adaptive/maladaptive neural changes |

- **Scoring:** [qinnovate.com/atlas/scoring](https://qinnovate.com/atlas/scoring/)
- **Parser:** [src/lib/niss-parser.ts](src/lib/niss-parser.ts)

### NSP (Neural Sensory Protocol)

Post-quantum wire protocol (v0.5). ML-KEM-768, ML-DSA, AES-256-GCM-SIV at the frame level. Designed for implant-class hardware. Performance claims are from simulation only — hardware validation pending.

- **Spec:** [qinnovate.com/tools/nsp](https://qinnovate.com/tools/nsp/)
- **Implementation:** [qif-framework/nsp/nsp-core/](qif-framework/nsp/nsp-core/) (Rust)

### Runemate

Native DSL compiler (67.8% compression in simulation). Phase 2/3 goal: compile semantic content into electrode stimulation patterns for direct cortical rendering (vision restoration). This is speculative — the compiler exists, the cortical rendering does not.

- **Spec:** [qinnovate.com/tools/runemate](https://qinnovate.com/tools/runemate/)
- **Compiler:** [qif-framework/runemate/forge/](qif-framework/runemate/forge/) (Rust)

---

## Terminology

| Term | Usage |
|------|-------|
| **Neurosecurity** | The research discipline (Denning, Matsuoka & Kohno, 2009). Use when referencing the academic field. |
| **BCI security** | The applied engineering domain. Use when describing what QIF tools do in practice. |
| **Neuroethics** | Foundational scholarship informing QIF's design constraints. QIF is informed by neuroethics; QIF is not a neuroethics project. |
| **Governance** | Policy bridge between security and ethics. Spans the full stack, not just neural. Do not use "neurogovernance." |

---

## Repository Structure

```
qinnovates/qinnovate/
├── qif-framework/              # QIF specification + implementations
│   ├── nsp/nsp-core/           # Neural Sensory Protocol (Rust, PQ-secure)
│   ├── runemate/forge/         # Runemate DSL compiler (Rust)
│   ├── archive/oni-framework/  # Legacy ONI 14-layer model
│   ├── QIF-DERIVATION-LOG.md   # 86 entries of research decisions
│   ├── QIF-FIELD-JOURNAL.md    # First-person research observations
│   └── QIF-RESEARCH-SOURCES.md # 309+ verified sources
│
├── shared/                     # Cross-cutting data + tools
│   ├── qtara-registrar.json    # TARA techniques (CVSS + NISS)
│   ├── qtara/                  # Python SDK (pip install qtara)
│   ├── research-registry.json  # Structured research data
│   └── scripts/                # Data pipeline scripts
│
├── governance/                 # Ethics, consent, policy documents
├── paper/                      # Academic publications (LaTeX)
├── tools/                      # Security tools (neurowall, macshield)
├── src/                        # Astro 5 website (qinnovate.com)
├── docs/                       # Built site / GitHub Pages output
└── .github/workflows/          # CI/CD
```

---

## Site Revision History

Each weekly snapshot is tagged in git. Click the tag to browse code at that point, or checkout locally to run the site (`git checkout <tag> && npm ci && npm run dev`).

| Week | Date | Tag | Key Changes |
|------|------|-----|-------------|
| W10 | Mar 5 | [`site-archive-2026-03-05`](https://github.com/qinnovates/qinnovate/tree/site-archive-2026-03-05) | Academic review response, 5-pillar architecture, 404 redirects, scaffold framing, working paper rename |
| W09 | Mar 2 | [`site-W09-2026-03-02`](https://github.com/qinnovates/qinnovate/tree/site-W09-2026-03-02) | NISS v1.1 CR/CD split, Zenodo v1.5, guardrails formalization, research landscape expansion |
| W08 | Feb 23 | [`site-W08-2026-02-23`](https://github.com/qinnovates/qinnovate/tree/site-W08-2026-02-23) | Zenodo v1.4, skills hardening, epistemic integrity rules, CVE disclosure response |
| W07 | Feb 16 | [`site-W07-2026-02-16`](https://github.com/qinnovates/qinnovate/tree/site-W07-2026-02-16) | NSP v0.5, NISS v1.0, Zenodo v1.0, Neurowall sim, T0079 ear canal case study |
| W06 | Feb 9 | [`site-W06-2026-02-09`](https://github.com/qinnovates/qinnovate/tree/site-W06-2026-02-09) | 14-layer to hourglass migration, TARA atlas, OG social cards |
| W05 | Feb 2 | [`site-W05-2026-02-02`](https://github.com/qinnovates/qinnovate/tree/site-W05-2026-02-02) | Initial launch: landing page, 9 blog posts |

---

## Collaboration

This work needs collaborators. The research base is compiled (309+ verified sources). The threat taxonomy and scoring system exist. What comes next — empirical validation, clinical mappings, signal integrity formalization — requires domain expertise the author does not have alone.

If you work with neural data, BCI design, neuroethics, health policy, or regulatory compliance, please reach out.

**Contact:** kevin@qinnovate.com
**Website:** [qinnovate.com](https://qinnovate.com)
**GitHub:** [github.com/qinnovates](https://github.com/qinnovates)

---

<div align="center">

*Open security research for brain-computer interfaces*

*Apache 2.0 · Vendor-agnostic*

</div>

---

*Founded 2026*
