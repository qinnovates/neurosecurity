# QIF Framework

A ground-up architectural redesign of BCI security, built from neuroscience constraints rather than retrofitted IT models.

## Quick Links

| | |
|---|---|
| [Whitepaper (v6.3)](whitepapers/QIF-WHITEPAPER.md) | Full framework specification ([v8.0 draft](whitepapers/QIF-WHITEPAPER-V8-DRAFT.md)) |
| [Wiki / Glossary](whitepapers/QIF-WIKI.md) | Every term, equation, and concept defined |
| [Source of Truth](whitepapers/QIF-TRUTH.md) | Canonical reference for all QIF equations and values |
| [Preprint (PDF)](https://qinnovate.com/papers/qif-bci-security-2026.pdf) | Zenodo preprint (DOI: [10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)) |

---

## Structure

```
osi-of-mind/
├── specs/                          # Core specifications
│   ├── NSP-PROTOCOL-SPEC.md       # Neural Sensory Protocol v0.5 (post-quantum)
│   ├── RUNEMATE.md                # Neural rendering compiler (Staves DSL)
│   ├── NISS-NEUROLOGICAL-EXTENSION.md  # NISS clinical extensions
│   ├── qif-sec-guardrails.md      # Physics-derived defense architecture
│   ├── INTEGRATION-ROADMAP.md     # NSP + Runemate + Neurowall integration path
│   └── PROPAGATION.md             # How canonical truth flows through the project
│
├── whitepapers/                    # Published and draft papers
│   ├── QIF-WHITEPAPER.md          # v6.3 (stable)
│   ├── QIF-WHITEPAPER-V8-DRAFT.md # v8.0 (current draft)
│   ├── QIF-TRUTH.md               # Canonical equations and values
│   ├── QIF-SCIENTIFIC-PAPER-FUTURE.md  # Full academic paper outline
│   └── QIF-WIKI.md                # Knowledge base / glossary
│
├── logs/                           # Derivation logs (non-primary)
│   └── NEURORIGHTS-DERIVATION-LOG.md
│
├── QIF-DERIVATION-LOG.md          # Single source of truth (113 entries)
├── QIF-FIELD-JOURNAL.md           # First-person research observations
├── QIF-RESEARCH-SOURCES.md        # 340+ verified citations
├── GUARDRAILS.md                  # Neuroethics constraint mapping (G1-G8)
├── VALIDATION.md                  # Validation framework and status
│
├── framework/                      # 9-document architecture series (read in order)
├── nsp/                            # NSP Rust implementation (PQ-secure)
├── runemate/                       # Runemate Rust compiler
├── research/                       # Research methodology and hypotheses
├── (qif-lab archived to _archive/)
├── tara-threat/                    # TARA threat catalog
├── tools/                          # Security tools (neurowall, neurosim, macshield)
└── images/                         # Diagrams
```

---

## Architecture (9 documents)

Read in order. Each builds on the previous.

| # | Document | What It Covers |
|---|----------|---------------|
| 01 | [WHY-REVAMP](framework/01-WHY-REVAMP.md) | Why the original model was fundamentally flawed |
| 02 | [KNOWNS-AND-UNKNOWNS](framework/02-KNOWNS-AND-UNKNOWNS.md) | What neuroscience has confirmed vs. what remains open |
| 03 | [BCI-CAPABILITIES](framework/03-BCI-CAPABILITIES.md) | Every proven BCI READ/WRITE/CLOSED-LOOP today |
| 04 | [FRAMEWORKS-ANALYSIS](framework/04-FRAMEWORKS-ANALYSIS.md) | OSI, Kandel, biological organization |
| 05 | [PROPOSED-MODEL](framework/05-PROPOSED-MODEL.md) | The funnel model and quantum tunneling thought experiment |
| 06 | [GAP-ANALYSIS](framework/06-GAP-ANALYSIS.md) | Known limits vs. open questions |
| 07 | [QUANTUM-BIOLOGY](framework/07-QUANTUM-BIOLOGY.md) | What's proven, what's not, and the measurement wall |
| 08 | [QUANTUM-INTEGER](framework/08-QUANTUM-INTEGER.md) | Q: the labeled gap for quantum unknowns |
| 09 | [QUANTUM-NEUROSECURITY](framework/09-QUANTUM-NEUROSECURITY.md) | Quantum bridges, DSKE, defense-in-depth |

---

## Derivation & Process

| Document | Purpose |
|----------|---------|
| [Derivation Log](QIF-DERIVATION-LOG.md) | 113 entries tracing every research decision and insight |
| [Field Journal](QIF-FIELD-JOURNAL.md) | Personal/experiential observations (raw voice) |
| [Research Sources](QIF-RESEARCH-SOURCES.md) | 340+ verified citations, DOIs, and references |
| [Neurorights Log](logs/NEURORIGHTS-DERIVATION-LOG.md) | Neurorights framework derivation |

---

## Neuroethics & Governance

See [governance/](../governance/) for the full policy library. Key documents:

| Document | Focus |
|----------|-------|
| [GUARDRAILS](GUARDRAILS.md) | 8 neuroethics constraints mapped to QIF scope limits |
| [QIF-NEUROETHICS](../governance/policy/QIF-NEUROETHICS.md) | Open ethical questions and thesis foundation |
| [Governance Questions](../governance/QIF-GOVERNANCE-QUESTIONS.md) | Who decides what for the brain (RACI) |
| [Transparency](../governance/TRANSPARENCY.md) | Human-AI collaboration audit trail |

---

## Key Concepts

- **11-Band Hourglass** : N7-N1 | I0 | S1-S3 (7 neural, 1 interface, 3 synthetic)
- **Coherence Metric (Cs)** : Operational core of QIF
- **NISS** : Extends CVSS for neural harm (reversibility, patient awareness)
- **TARA** : [Threat Atlas](../datalake/qtara/) mapping 161 techniques across the hourglass

---

*Author: Kevin Qi*
*Status: Active Design Phase*
*See also: [Website](https://qinnovate.com) | [TARA Atlas](https://qinnovate.com/TARA/) | [Preprint](https://doi.org/10.5281/zenodo.18640105)*
