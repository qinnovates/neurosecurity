<div align="center">

![divider](https://raw.githubusercontent.com/qinnovates/qinnovate/main/public/images/divider-qinnovate.svg)

</div>

# Qinnovate

**Open Standards for Brain-Computer Interface Security**

> *Like NIST for neurosecurity, IEEE for BCIs, W3C for neural interfaces*

Qinnovate is a vendor-agnostic standards body developing open frameworks, governance standards, and research for securing brain-computer interfaces.

---

<div align="center">

![divider](https://raw.githubusercontent.com/qinnovates/qinnovate/main/public/images/divider-qinnovate.svg)

</div>

## What is Qinnovate?

Qinnovate houses:
- **QIF (Quantum Indeterministic Framework)** — Quantum BCI security model (7-band hourglass)
- **ONI (Open Neurosecurity Interoperability)** — Classical BCI security model (14-layer architecture)
- **Classical-Quantum Bridge** — Shared threat taxonomy mapping both frameworks
- **Neuroethics Standards** — UNESCO alignment, GDPR/HIPAA compliance, informed consent frameworks
- **Threat Intelligence** — BCI attack taxonomy, threat matrix, security patterns
- **Governance** — Regulatory compliance frameworks, transparency protocols

---

## Dual-Framework Architecture

### QIF (Quantum Indeterministic Framework)

**Quantum BCI security** - The first framework to incorporate quantum mechanical principles into BCI security.

- **Architecture:** 7-band hourglass model (3-1-3 symmetric: S3/S2/S1/I0/N1/N2/N3)
- **Status:** Active development
- **Version:** 3.1 Hourglass
- **License:** Apache 2.0

[Read the specification](qif-framework/)

### ONI (Open Neurosecurity Interoperability)

**Classical BCI security** - OSI extension model providing classical security architecture for BCIs.

- **Architecture:** 14-layer model (L1-L14: Silicon to Cognitive Sovereignty)
- **Status:** Active (classical complement to QIF)
- **Version:** 2.x
- **License:** Apache 2.0

[Read the specification](oni-framework/)

### Classical-Quantum Bridge

The **shared bridge** maps threats and security controls across both frameworks:

- **Threat matrix** categorized with K (common), D (differences), S (sum)
- **Layer-Band translation** (e.g., L8 to I0, L9 to I0/N1)
- **Validation tools** for consistency checking

[Explore the bridge](shared/)

---

## Governance & Neuroethics

Qinnovate maintains comprehensive governance standards:

- **UNESCO Alignment** — Neuroethics principles
- **Regulatory Compliance** — GDPR, HIPAA, FDA frameworks
- **Informed Consent** — BCI-specific consent protocols
- **Pediatric Guidelines** — Special protections for minors
- **Accessibility Standards** — Inclusive BCI design
- **Transparency Protocol** — Human-AI collaboration audit trails
- **QIF Neuroethics** — 11 open questions on quantum biometric governance

[View governance standards](governance/)

---

## Research & Publications

Academic papers, technical specifications, and research findings:

### ONI Research
- **31 publications** across 8 topics (coherence metric, neural firewall, quantum encryption, etc.)
- Classical BCI security foundations
- Scale-frequency invariant principles

### QIF Research
- **Quantum indeterminacy** in neural security
- **Decoherence** and quantum threats
- **7-band hourglass** architecture
- Comprehensive whitepaper with equations-as-code

[Browse ONI research](oni-framework/publications/)
[Browse QIF research](qif-framework/)

---

## Ecosystem

### Implementations

**Mindloft** builds commercial products implementing Qinnovate standards:
- [mindloft.org](https://mindloft.org) — BCI security platform
- Products: Mindloft Core, SDK, Subvocalization BCI
- [github.com/qinnovates/mindloft](https://github.com/qinnovates/mindloft) — Product repository

**Relationship:**
- Qinnovate = Standards body (this repo)
- Mindloft = Product company (implements the standards)

Think: **W3C** (Qinnovate) vs **Chrome** (Mindloft)

### Community

- **Contributing:** Open to academic researchers, security experts, neuroethicists
- **Governance:** Community-driven standards development
- **License:** Apache 2.0 (standards), CC-BY 4.0 (research)

---

## Development Process

Qinnovate operates through the **VERA Engine** (Validation, Ethics, Research, Authority) — our approach to standards development that prioritizes "time-to-autonomy" over "time-to-market."

VERA fuses the Scientific Method with the Public Policy Cycle, ensuring every technological advancement is lab-proven and legally codified before release as authorized knowledge.

**[Read the full VERA Engine documentation](processes/qinnovate-lifecycle.md)**

### Three-Phase Authority Cycle

1. **Technical Lab (Research & Validation)** — Hypothesis formulation, controlled POC development, sandboxed lab testing
2. **Governance Hub (The Filter)** — Data vetting via Q-Metrics, NIST/IEEE alignment, policy enforcement
3. **External Council (Policy & Implementation)** — Independent peer review, policy formalization, authorized dissemination

### Key Principles

- **Standards Authority Only:** Qinnovate excludes product deployment to maintain institutional independence
- **Lab-Only Testing:** All POCs conducted exclusively in controlled environments with ethical oversight
- **Scientific Rigor:** Every standard must be lab-proven before external validation
- **Separation of Concerns:** Standards body (Qinnovate) remains independent from implementation entities (e.g., Mindloft)

---

## Website

The website ([qinnovate.com](https://qinnovate.com)) is built with [Astro](https://astro.build/) 5.x and lives in this repo.

```bash
npm install
npm run dev      # localhost:4321
npm run build    # outputs to dist/
npm run preview  # preview production build
```

Pushes to `main` trigger automated build and deploy via GitHub Actions.

---

## Repository Structure

```
qinnovates/qinnovate/
├── src/                    # Astro website source
├── blogs/                  # Blog posts (Markdown content collection)
├── public/                 # Static assets, CNAME, fonts
├── scripts/                # RSS feed fetcher
├── package.json            # Astro dependencies
├── astro.config.mjs        # Astro configuration
│
├── qif-framework/          # Quantum BCI security (7-band)
│   ├── framework/          # 9 architectural documents
│   ├── qif-lab/            # Equation testing & validation
│   ├── QIF-WHITEPAPER.md   # Comprehensive research
│   └── QIF-TRUTH.md        # Canonical source of truth
│
├── oni-framework/          # Classical BCI security (14-layer)
│   ├── framework/          # Python package + specs
│   ├── publications/       # 31 research papers
│   └── INDEX.md            # Main wiki
│
├── shared/                 # Classical-Quantum bridge
│   ├── threat-matrix.json  # Threat taxonomy
│   └── validation/         # Bridge validation tools
│
├── governance/             # Neuroethics & regulatory
│   └── ... (9 governance documents)
│
├── processes/              # VERA Engine & workflows
│   └── qinnovate-lifecycle.md
│
└── .github/workflows/      # CI/CD pipelines
    ├── deploy.yml          # Astro build + GitHub Pages deploy
    ├── update-news.yml     # Daily RSS feed cache update
    └── ...
```

---

## Resources

| Resource | Description |
|----------|-------------|
| [VERA Engine](processes/qinnovate-lifecycle.md) | Standards development process documentation |
| [QIF Whitepaper](https://mindloft.org/qif-whitepaper/) | Interactive whitepaper with AI voiceover |
| [QIF Framework](qif-framework/) | Complete QIF specification |
| [ONI Framework](oni-framework/) | Complete ONI specification |
| [Classical-Quantum Bridge](shared/) | Threat taxonomy mapping |
| [Governance Docs](governance/) | Neuroethics and compliance standards |
| [Website](https://qinnovate.com) | Official standards body site |

---

## Partnerships & Collaboration

Qinnovate seeks partnerships with:
- **Universities** — Academic research collaboration
- **Standards Bodies** — IEEE, NIST, ISO alignment
- **Industry** — Vendor-neutral implementation guidance
- **Regulators** — FDA, EU, regulatory framework development

**Contact:** standards@qinnovate.com

---

## License

All content in this repository is licensed under **CC BY-NC-ND 4.0** (Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International).

You may share with attribution, but commercial use and modifications require explicit written permission from the copyright holder.

For licensing inquiries: standards@qinnovate.com

---

## Links

- **Website:** [qinnovate.com](https://qinnovate.com)
- **Product Implementation:** [mindloft.org](https://mindloft.org)
- **GitHub Org:** [github.com/qinnovates](https://github.com/qinnovates)
- **This Repo:** [github.com/qinnovates/qinnovate](https://github.com/qinnovates/qinnovate)

---

<div align="center">

**Defining open standards for the neural frontier**

*Vendor-agnostic, Community-driven, Academically rigorous*

</div>

---

*Established: 2026*
*Updated: 2026-02-07*
