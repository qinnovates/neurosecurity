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
- **QIF (Quantum Indeterministic Framework)** — 11-band hourglass BCI security model (v4.0)
- **NSP (Neural Sensory Protocol)** — Post-quantum wire protocol for BCI data links
- **Project Runemate** — HTML-to-bytecode compression engine (65-90% savings)
- **ONI (Open Neurosecurity Interoperability)** — Classical BCI security model (14-layer, legacy complement)
- **Classical-Quantum Bridge** — Shared threat taxonomy mapping both frameworks
- **Neuroethics Standards** — UNESCO alignment, GDPR/HIPAA compliance, informed consent frameworks
- **Threat Intelligence** — 60 MITRE-compatible techniques (T2001-T2899), 18 attack vectors, BCI device registry
- **Governance** — Regulatory compliance frameworks, transparency protocols

---

## Dual-Framework Architecture

### QIF (Quantum Indeterministic Framework)

**Quantum BCI security** - The first framework to incorporate quantum mechanical principles into BCI security.

- **Architecture:** 11-band hourglass model (7-1-3 asymmetric: N7-N1 / I0 / S1-S3)
- **Three Pillars:** QIF (threat model) + NSP (wire protocol) + Runemate (compression)
- **Status:** Active development
- **Version:** 4.0
- **Equation:** QI(b,t) = e^(-S(b,t)) — unified Boltzmann security score

[Read the specification](qif-framework/)

### ONI (Open Neurosecurity Interoperability)

**Classical BCI security** - OSI extension model providing classical security architecture for BCIs.

- **Architecture:** 14-layer model (L1-L14: Synthetic to Cognitive Sovereignty)
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
- **11-band hourglass** architecture (7-1-3 asymmetric)
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
- **License:** Apache 2.0

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
├── src/                    # Astro 5 website source
│   ├── pages/              # Site pages (see Website Pages below)
│   ├── components/         # Astro + React components (Nav, Footer, Hourglass3D, etc.)
│   ├── layouts/            # BaseLayout, PageLayout, PublicationLayout
│   ├── lib/                # qif-constants.ts, threat-data.ts, utils.ts
│   └── styles/             # global.css (Tailwind 4)
│
├── blogs/                  # 14 blog posts (Markdown content collection)
├── docs/                   # Static assets served by Astro (publicDir)
│   ├── CNAME               # qinnovate.com
│   ├── fonts/              # Inter, JetBrains Mono
│   └── images/             # SVG dividers, OG images
├── public/                 # Additional static assets
│   └── lab/hourglass.html  # Interactive 11-band layer explorer
├── scripts/                # RSS feed fetcher (fetch-news.mjs)
│
├── qif-framework/          # QIF specification (11-band hourglass)
│   ├── framework/          # 9 architectural documents
│   ├── qif-lab/            # Equation testing & validation
│   ├── QIF-WHITEPAPER.md   # Comprehensive research paper
│   └── QIF-TRUTH.md        # Canonical source of truth
│
├── oni-framework/          # ONI specification (14-layer, legacy complement)
│   ├── framework/          # Python package + specs
│   ├── publications/       # 31 research papers
│   └── INDEX.md            # Main wiki
│
├── shared/                 # Classical-Quantum bridge
│   ├── threat-matrix.json  # Cross-model threat taxonomy
│   └── qtara-registrar.json  # 71 TARA-enriched techniques (QIF-T0001+)
│
├── governance/             # Neuroethics & regulatory (9 documents)
├── processes/              # VERA Engine & workflows
│
└── .github/workflows/      # CI/CD pipelines
    ├── deploy.yml          # Astro build + GitHub Pages deploy
    ├── update-news.yml     # Daily RSS feed cache update
    └── wiki-sync.yml       # GitHub Wiki auto-sync
```

### Website Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero, three pillars, hourglass preview, latest publications |
| `/framework/` | Framework | QIF v4.0 specification with interactive 3D hourglass |
| `/whitepaper/` | Whitepaper | QIF v5.0 whitepaper — three pillars, unified equation, 72 references |
| `/nsp/` | NSP | Neural Sensory Protocol v0.3 — five-layer post-quantum spec |
| `/runemate/` | Runemate | Project Runemate — HTML-to-Staves compression engine |
| `/explore/` | Explore | All interactive visualizations in one hub |
| `/threats/` | Threats | 18 attack vectors mapped across 11 bands with severity heatmap |
| `/publications/` | Publications | Blog posts and research papers |
| `/news/` | News & Intel | Aggregated RSS feed from BCI/neurosecurity sources |
| `/about/` | About | Mission, team, contact |
| `/lab/hourglass.html` | Layer Explorer | Interactive 11-band hourglass with click-into-details |
| `/visualizations/qi/` | QI Explorer | 3D Boltzmann landscape with real-time equation simulation |

---

## Resources

| Resource | Description |
|----------|-------------|
| [VERA Engine](processes/qinnovate-lifecycle.md) | Standards development process documentation |
| [QIF Whitepaper](https://qinnovate.com/whitepaper/) | QIF v5.0 whitepaper — three pillars, 11-band model, unified equation |
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

**Contact:** kevin@qinnovate.com

---

## License

All content in this repository is licensed under the **Apache License, Version 2.0**.

You may use, modify, and distribute freely with attribution. See [LICENSE](LICENSE) for full terms.

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
*Updated: 2026-02-08*
