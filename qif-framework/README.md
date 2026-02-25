# QIF Framework

> **QIF** — Quantified Interconnection Framework for Neural Security (pronounced **"CHIEF"**)

A ground-up architectural redesign of BCI security, built from neuroscience constraints rather than retrofitted IT models. The original ONI Framework put the Neural Gateway at Layer 8 (middle of a 14-layer stack). BCIs are physical hardware — they belong adjacent to OSI Layer 1. Everything needed to be rebuilt from that realization.

---

## Quick Links

| | |
|---|---|
| [Whitepaper (v7.0)](QIF-WHITEPAPER.md) | The full framework specification |
| [Wiki / Glossary](QIF-WIKI.md) | Every term, equation, and concept defined |
| [Source of Truth](QIF-TRUTH.md) | Canonical reference for all QIF equations and values |
| [Preprint (PDF)](https://qinnovate.com/papers/qif-bci-security-2026.pdf) | Zenodo preprint (DOI: [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)) |

---

## Architecture (9 documents)

Read in order. Each builds on the previous.

| # | Document | What It Covers |
|---|----------|---------------|
| 01 | [WHY-REVAMP](framework/01-WHY-REVAMP.md) | Why the original model was fundamentally flawed |
| 02 | [KNOWNS-AND-UNKNOWNS](framework/02-KNOWNS-AND-UNKNOWNS.md) | What neuroscience has confirmed vs. what remains open |
| 03 | [BCI-CAPABILITIES](framework/03-BCI-CAPABILITIES.md) | Every proven BCI READ/WRITE/CLOSED-LOOP today |
| 04 | [FRAMEWORKS-ANALYSIS](framework/04-FRAMEWORKS-ANALYSIS.md) | OSI, Kandel, biological organization — the math and patterns |
| 05 | [PROPOSED-MODEL](framework/05-PROPOSED-MODEL.md) | The funnel model and quantum tunneling thought experiment |
| 06 | [GAP-ANALYSIS](framework/06-GAP-ANALYSIS.md) | Known limits vs. open questions |
| 07 | [QUANTUM-BIOLOGY](framework/07-QUANTUM-BIOLOGY.md) | What's proven, what's not, and the measurement wall |
| 08 | [QUANTUM-INTEGER](framework/08-QUANTUM-INTEGER.md) | Q — the labeled gap for quantum unknowns at each ring |
| 09 | [QUANTUM-NEUROSECURITY](framework/09-QUANTUM-NEUROSECURITY.md) | Quantum bridges, DSKE, defense-in-depth rings, NIST CSF lifecycle |

---

## Neuroethics & Governance

| Document | Focus |
|----------|-------|
| [QIF-NEUROETHICS](QIF-NEUROETHICS.md) | Neuroethics principles mapped to QIF architecture |
| [Neurorights Derivation Log](NEURORIGHTS-DERIVATION-LOG.md) | How neurorights quantification was derived |
| [TRANSPARENCY](../governance/TRANSPARENCY.md) | Human-AI collaboration audit trail |
| [GOVERNANCE](../governance/NEUROSECURITY_GOVERNANCE.md) | UNESCO alignment, regulatory compliance, GRC gaps |
| [POLICY PROPOSAL](../governance/NEUROSECURITY_POLICY_PROPOSAL.md) | Six asks for six organizations, phased timeline |
| [INFORMED CONSENT](../governance/INFORMED_CONSENT_FRAMEWORK.md) | Consent requirements + pediatric & incapacity |
| [POST-DEPLOYMENT](../governance/POST_DEPLOYMENT_ETHICS.md) | Device lifecycle and abandonment prevention |
| [DATA POLICY](../governance/DATA_POLICY_FAQ.md) | Privacy FAQ and user rights |
| [ACCESSIBILITY](../governance/ACCESSIBILITY.md) | Accessibility standards and compliance |

---

## Security & Protocols

| Document | What It Is |
|----------|-----------|
| [NSP Protocol Spec](NSP-PROTOCOL-SPEC.md) | Neural Sensory Protocol v0.5 — post-quantum BCI security protocol |
| [NSP Pitch](NSP-PITCH.md) | NSP for manufacturers, investors, regulators |
| [Security Guardrails](qif-sec-guardrails.md) | Physics-derived defense constraints for BCIs |
| [Runemate Forge](RUNEMATE.md) | Neural rendering compiler for post-quantum BCI (Staves DSL) |
| [NSP Rust Implementation](nsp/) | PQ-secure Rust implementation of NSP |
| [Runemate Compiler](runemate/forge/) | Rust compiler for Staves DSL |

---

## Research

| Document | Status | Topic |
|----------|--------|-------|
| [Scientific Hypotheses](research/QIF-SCIENTIFIC-HYPOTHESES.md) | Active | Testable hypotheses derived from QIF |
| [BCI Economic Analysis](research/BCI-ECONOMIC-ANALYSIS.md) | Complete | Market dynamics and the neurosecurity imperative |
| [BCI Limits Equation](research/bci-limits-equation.md) | Needs verification | The physics equation that limits every BCI |
| [Ferrocene Exploration](research/ferrocene-exploration.md) | Exploration | Safety-critical Rust compiler for BCI devices |
| [SAIL Lab Intelligence](research/sail-lab-intelligence.md) | Complete | Stanford SAIL lab research mapping |
| [Cross-AI Whitepaper Prompt](research/CROSS-AI-WHITEPAPER-PROMPT.md) | Reference | Multi-model review prompt template |
| [Research Tracking](research/TRACKING.md) | Active | Open questions and research pipeline |
| [Future Paper Outline](QIF-SCIENTIFIC-PAPER-FUTURE.md) | Draft | Full academic paper structure (v7.0) |

---

## QIF Lab (Python)

Research lab for equation validation, visualization, and whitepaper generation.

| Path | What It Is |
|------|-----------|
| [qif-lab/](qif-lab/) | Python research lab (build, test, visualize) |
| [qif-lab/src/](qif-lab/src/) | Equations, figures, synthetic data generators |
| [qif-lab/figures/](qif-lab/figures/) | Generated visualizations (hourglass, coherence, decoherence) |
| [qif-lab/whitepaper/](qif-lab/whitepaper/) | Quarto-based immersive whitepaper (16 chapters) |

---

## Derivation & Process

| Document | Purpose |
|----------|---------|
| [Derivation Log](QIF-DERIVATION-LOG.md) | 79 entries tracing every research decision and insight |
| [Field Journal](QIF-FIELD-JOURNAL.md) | Personal/experiential observations (raw voice) |
| [Research Sources](QIF-RESEARCH-SOURCES.md) | Every citation, DOI, and reference used |
| [Truth Propagation](PROPAGATION.md) | How canonical truth flows through the project |

---

## Archive

| Path | What It Is |
|------|-----------|
| [ONI Framework](archive/oni-framework/) | Legacy 14-layer classical model (Python, Streamlit, publications) |

---

## Key Concepts

- **11-Band Hourglass** — N7-N1 | I0 | S1-S3 (7 neural, 1 interface, 3 synthetic)
- **Coherence Metric (Cs)** — Operational core of QIF v7.0
- **Quantum Integer (Q)** — Labeled gap for quantum unknowns at each ring (like Mendeleev's empty boxes)
- **DSKE** — Distributed Symmetric Key Establishment: quantum-safe encryption without quantum hardware at the implant
- **NISS** — Neural Impact Scoring System: extends CVSS for neural harm (reversibility, patient awareness)
- **TARA** — [Threat Atlas](../shared/qtara/) mapping 103 techniques across the hourglass

---

*Author: Kevin Qi*
*Status: Active Design Phase*
*See also: [Website](https://qinnovate.com) | [TARA Atlas](https://qinnovate.com/TARA/) | [Preprint](https://doi.org/10.5281/zenodo.18640105)*
