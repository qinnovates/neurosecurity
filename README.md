<div align="center">

![divider](https://raw.githubusercontent.com/qinnovates/neurosecurity/main/site/images/divider-qinnovate.svg)

# Neurosecurity

**Open security research for brain-computer interfaces**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.18640105-blue)](https://doi.org/10.5281/zenodo.18640105)
[![Site](https://img.shields.io/badge/Site-qinnovate.com-gold)](https://qinnovate.com)
[![Data Studio](https://img.shields.io/badge/Data_Studio-31_datasets-green)](https://qinnovate.com/data-studio/)
[![TARA](https://img.shields.io/badge/TARA-161_techniques-red)](https://qinnovate.com/atlas/tara/)

</div>

> **By using this repository, you consent to the terms in [DISCLAIMER.md](DISCLAIMER.md).** This is early-stage research — not a validated standard, not a clinical tool, not production software. The human brain is not a test environment. See [DISCLAIMER.md](DISCLAIMER.md), [Code of Conduct](CODE_OF_CONDUCT.md), and [Security Policy](SECURITY.md).

## What is Neurosecurity?

Every field that touches the brain has two faces. Neuroethics established this structure in 2002 (Roskies): the **ethics of neuroscience** asks how to conduct brain research responsibly, while the **neuroscience of ethics** asks what the brain reveals about moral reasoning itself. One governs the science. The other lets the science inform governance.

Neurosecurity follows the same pattern.

**Security of Neuroscience** (Applied) — How do we defend neural systems? Traditional security engineering applied to brain-computer interfaces: threat modeling, severity scoring, encryption, real-time monitoring. Known threats, known defenses, tools that work today.

**Neuroscience of Security** (Foundational) — What does the brain teach us about security itself? What new threats, rights, and principles emerge as BCIs evolve? Where are the boundaries between attack and therapy, surveillance and monitoring, data and identity? This is the work that needs to happen before the technology outpaces our ability to govern it.

| | Security of Neuroscience | Neuroscience of Security |
|---|---|---|
| **Question** | How do we defend neural systems? | What are we defending, and from what? |
| **Timeframe** | Now — build with today's tools | Ahead — prepare for tomorrow's threats |
| **Method** | Engineering | Research + philosophy |
| **Output** | Tools, protocols, detections | Principles, rights, governance |
| **In this repo** | TARA, NISS, NSP, Neurowall, QIF Model | Governance questions, neurorights, dual-use insight, consent boundaries |
| **Parallel** | *Ethics of neuroscience* (Roskies) | *Neuroscience of ethics* (Roskies) |

Applied without foundational is blind — you're defending something you don't understand. Foundational without applied is toothless — you're philosophizing without building anything.

This project does both. It asks a question no existing framework has systematically addressed: **what happens to a patient when their brain-computer interface is compromised?** Not the data. Not the device. The person.

---

## Quick Start

**Browse the data:** [qinnovate.com/data-studio](https://qinnovate.com/data-studio/) — 31 open datasets, downloadable as Parquet

**Query with Python:**
```python
import pandas as pd
df = pd.read_parquet("https://qinnovate.com/data/parquet/techniques.parquet")
df[df.severity == "critical"]
```

**Query with DuckDB:**
```sql
SELECT * FROM read_parquet('https://qinnovate.com/data/parquet/techniques.parquet')
WHERE severity = 'critical' ORDER BY niss_score DESC;
```

**Run the site locally:**
```bash
git clone https://github.com/qinnovates/neurosecurity.git
cd neurosecurity && npm ci && npm run dev
```

**Validate everything:**
```bash
npm run health    # Check data sync, governance, counts
npm run build     # Build site (282 pages)
```

---

## About This Work

The author is a security engineer with ~15 years of IT and security infrastructure experience, not a mathematician, physicist, or neuroscientist. AI tools (primarily Claude, with Gemini and ChatGPT for cross-validation) were used extensively. All AI-derived claims should be treated as **proposed and unvalidated** until independently verified by domain experts.

**Full transparency:** [Transparency Statement](governance/TRANSPARENCY.md) | [Derivation Log](model/QIF-DERIVATION-LOG.md) (113 entries) | [Decision Log](governance/DECISION-LOG.md) | [Validation Status](model/VALIDATION.md)

---

## Repository Structure

```
neurosecurity/
├── src/                              # Astro 5 website (qinnovate.com)
├── site/                             # Built site output (GitHub Pages)
│
├── model/                            # QIF Model — specs, whitepapers, derivation logs
│   ├── specs/                        # NSP, Runemate, NISS, guardrails
│   ├── whitepapers/                  # v6.3, v8.0 draft, wiki, truth
│   ├── QIF-DERIVATION-LOG.md         # 113 entries — single source of truth
│   ├── QIF-FIELD-JOURNAL.md          # First-person research observations
│   └── QIF-RESEARCH-SOURCES.md       # 340+ verified sources
│
├── research/                         # Blog posts, academic paper, clinical notes
│   ├── blog/                         # Field journal entries + technical posts
│   ├── paper/                        # LaTeX preprint (Zenodo DOI)
│   └── clinical/                     # Clinical research notes (threat modeling refs)
│
├── datalake/                         # Source of truth for all data
│   ├── qtara-registrar.json          # TARA techniques (161, CVSS + NISS)
│   ├── impact-chains.json            # Precomputed threat-to-outcome chains
│   └── qtara/                        # Python SDK (pip install qtara)
│
├── governance/                       # Ethics, consent, policy, audit trail
│   ├── policy/                       # 10 policy documents (neurorights, consent, accessibility)
│   ├── DECISION-LOG.md               # Auto-generated from derivation log
│   └── TRANSPARENCY.md               # Auto-generated AI disclosure
│
├── tools/                            # Security tools (neurowall, neurosim, macshield)
├── scripts/                          # Build + data pipelines
└── .github/workflows/                # CI/CD (deploy, audit, sync)
```

---

## Table of Contents

- [Quick Start](#quick-start)
- [Validation Summary](#validation-summary)
- [What This Project Contains](#what-this-project-contains)
- [The TARA Insight](#the-tara-insight)
- [Why Neurosecurity](#why-neurosecurity)
- [Architecture](#architecture)
- [Data Studio & Open Datasets](#data-studio--datalake)
- [Governance & Logging](#governance--logging-architecture)
- [Developer Commands](#developer-commands)
- [Repository Structure](#repository-structure)
- [Tools](#tools)
- [Collaboration](#collaboration)

---

### Tools

| Tool | What It Does | Install |
|------|-------------|---------|
| **[Quorum](https://github.com/qinnovates/quorum)** | Orchestrate a swarm of AI experts on any question. Structured dissent, fact-checking, multi-agent validation. | `claude install qinnovates/quorum` |
| **[BCI Security Plugin](https://github.com/qinnovates/bci-security-plugin)** | First BCI security toolkit for AI coding assistants. Scans code for neural data handling issues. | `claude install qinnovates/bci-security-plugin` |
| **[NeuroSIM](https://github.com/qinnovates/neurosim)** | Neural Security Operations Simulator. BCI signal processing meets security operations. | See repo |
| **[macshield](https://github.com/qinnovates/macshield)** | Network-aware macOS security hardening. | `brew install qinnovates/tools/macshield` |

---

### Validation Summary

Solo research, tested honestly. Full methodology and limitations at **[VALIDATION.md](model/VALIDATION.md)** | **[Live dashboard](https://qinnovate.com/research/validation/)**

| What | Result | Tier |
|------|--------|------|
| [Neurowall coherence monitor](model/VALIDATION.md#val-001) | 11/14 at 15s, 9/9 at 20s, 50-run stats, 0% FPR | Simulation + Independent |
| [BrainFlow validation](model/VALIDATION.md#val-002) | 16-channel, 100% detection, 0% FPR | Independent |
| [Physics security guardrails](model/VALIDATION.md#val-007) | 12/13 constraints verified, 4-layer architecture | Analytical + Cross-AI |
| [Protocol vulnerability](model/VALIDATION.md#val-006) | Real vulnerability in BCI streaming protocol, responsibly disclosed | Disclosed |
| [NSP transport](model/VALIDATION.md#val-003) | Round-trip simulation PASS, 65-90% compression | Simulation |
| [NISS scoring engine](model/VALIDATION.md#val-004) | 109/109 techniques scored, PINS flags correct | Simulation |
| [Citation verification](model/VALIDATION.md#val-009) | 3 fabricated citations caught and removed from preprint v1.0 | Audit |
| **Not yet tested** | NISS clinical validation, DSM-5-TR mappings, BCI Limits Eq, real EEG, real hardware, real attacks | |

This is early-stage research by a solo researcher. Empirical validation requires BCI hardware, IRB approval, and clinical expertise. Everything is published openly so research groups with those resources can test, validate, refute, or extend it.

---

## What This Project Contains

### Frameworks & Specifications

| Component | Description | Status |
|-----------|-------------|--------|
| **[QIF](https://qinnovate.com/framework/)** | 11-band hourglass security architecture for BCIs | Proposed, v6.3 ([v8.0 draft](model/whitepapers/QIF-WHITEPAPER-V8-DRAFT.md)) |
| **[Working Paper](https://doi.org/10.5281/zenodo.18640105)** | Peer-citable academic paper (CC-BY 4.0) | Published |
| **[TARA](https://qinnovate.com/atlas/tara/)** | 161 BCI technique pairs, STIX 2.1 registry | v1.7 |
| **[qtara](https://pypi.org/project/qtara/)** | Python SDK for TARA registry management and STIX export | v0.2.0 |
| **[NSP](https://qinnovate.com/tools/nsp/)** | Post-quantum wire protocol for BCI data links | In development, v0.5 |
| **[NISS](https://qinnovate.com/atlas/scoring/)** | CVSS v4.0 extension proposal for neural interfaces (6 neural metrics) | Proposed, v1.1 |
| **[Runemate](https://qinnovate.com/tools/runemate/)** | Native DSL compiler (67.8% compression in simulation) | v1.0 Compiler |
| **[Security Guardrails](model/specs/qif-sec-guardrails.md)** | Physics-derived defense architecture for BCIs | Concept |
| **[Knight's Watch](https://qinnovate.com/vision/)** | Opt-in community deterrence mesh for missing children and anti-trafficking. Privacy-first (no raw data leaves device), COPPA-compliant by architecture, blockchain-auditable participation. Inherits NSP/Neurowall/Runemate stack | Concept |

### Tools

| Component | Description | Status |
|-----------|-------------|--------|
| **[Neural Atlas](https://qinnovate.com/neural-atlas/)** | Browser-based neural security monitoring with sample EEG data, threat detection, and NISS scoring | Published |
| **[Neurowall](./tools/neurowall/)** | Neural firewall prototype (differential privacy + NISS + policy engine) | In development, v0.8 |
| **[macshield](https://github.com/qinnovates/macshield)** | macOS workstation hardening for public WiFi | v0.4.1 |

**Neural Atlas — Built With:**
| Technology | Purpose |
|-----------|---------|
| BrainFlow | 40+ BCI devices |
| React + Vite | Frontend |
| Web Workers | In-browser engine |
| FFT | Client-side PSD analysis |

### Governance

| Component | Description | Status |
|-----------|-------------|--------|
| **[Governance Wiki](https://qinnovate.com/governance/)** | Ethics, consent, regulatory compliance, accessibility | Published |
| **[Neurosecurity Governance](governance/policy/NEUROSECURITY_GOVERNANCE.md)** | Neurorights mapping, UNESCO alignment, GRC gap analysis | Published |
| **[Policy Proposal](governance/policy/NEUROSECURITY_POLICY_PROPOSAL.md)** | 6 recommendations for NIST, MITRE, FIRST, IEEE, FDA, UNESCO | v1.2 |

### Research & Academic

| Component | Description | Status |
|-----------|-------------|--------|
| **[Zenodo](https://doi.org/10.5281/zenodo.18640105)** | Working paper, CC-BY 4.0, LaTeX source included | Published |
| **[Research Sources](model/QIF-RESEARCH-SOURCES.md)** | 340+ verified sources across 9 domains | Active |
| **[CVE-TARA Mapping](shared/cve-technique-mapping.json)** | 55 NVD-verified CVEs mapped to 21 TARA techniques | Published |
| **[EEG Data Pipeline](shared/EEG-DATA-PIPELINE.md)** | Curated EEG datasets, synthetic generation, KQL tagging, license verification | Active |
| FIRST.org CVSS SIG | NISS proposed as CVSS v4.0 extension; outreach in progress | In progress |
| Peer review / empirical validation | Requires collaborators, IRB, BCI hardware | Blocked |

---

## The TARA Insight

TARA started as an attack matrix. 161 BCI techniques catalogued from published literature. Something unexpected emerged: the same mechanisms kept showing up on the therapeutic side.

Signal injection is an attack vector. It is also the basis of neurostimulation therapy for depression, Parkinson's, and chronic pain. The boundary between attack and therapy is not the mechanism. It is consent, dosage, and oversight.

About 75% of the 161 techniques map to a therapeutic counterpart today. This means the same framework that scores whether an attack is dangerous can also help bound whether a therapy is safe. TARA is both a threat registry and a safety reference.

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

[Neurosecurity Governance](governance/policy/NEUROSECURITY_GOVERNANCE.md) | [Origin classification of all 161 techniques](shared/qtara-registrar.json)

---

## Architecture

### QIF

An 11-band hourglass architecture: 7 neural bands (N7 Neocortex down to N1 Spinal Cord), a physical interface boundary (I0, the electrode-tissue interface), and 3 synthetic bands organized by physics regime and spatial scale (S1 Near-Field/On-Device, S2 Guided-Wave/Host-Local, S3 Far-Field/Wide-Area).

- **Site:** [qinnovate.com/framework](https://qinnovate.com/framework/)
- **Whitepaper:** [qinnovate.com/research/whitepaper](https://qinnovate.com/research/whitepaper/) (v6.3, v8.0 in progress)
- **Working Paper:** [DOI: 10.5281/zenodo.18640105](https://doi.org/10.5281/zenodo.18640105)

### TARA

161 techniques spanning 8 domains and 16 tactics. Each technique scored with CVSS v4.0 base vectors + proposed NISS extension metrics. MITRE-compatible IDs.

- **Atlas:** [qinnovate.com/atlas/tara](https://qinnovate.com/atlas/tara/)
- **API:** [`/api/tara.json`](https://qinnovate.com/api/tara.json) (full dataset, no auth) | [`/api/stix.json`](https://qinnovate.com/api/stix.json) (STIX 2.1 bundle)
- **SDK:** `pip install qtara`

### NISS

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

- **Spec:** [qinnovate.com/guardrails/nsp](https://qinnovate.com/guardrails/nsp/)
- **Implementation:** [model/nsp/nsp-core/](model/nsp/nsp-core/) (Rust)

### Runemate

Native DSL compiler (67.8% compression in simulation). Phase 2/3 goal: compile semantic content into electrode stimulation patterns for direct cortical rendering (vision restoration). This is speculative — the compiler exists, the cortical rendering does not.

- **Spec:** [qinnovate.com/guardrails/runemate](https://qinnovate.com/guardrails/runemate/)
- **Compiler:** [model/runemate/forge/](model/runemate/forge/) (Rust)

---

## Automation & Data Pipelines

### News Feed (Daily)

Fetches 14 RSS feeds filtered for BCI/neurotech relevance. Maintains a rolling 30-item cache for the site's news page.

| | |
|---|---|
| **Script** | `npm run fetch-news` → [`scripts/fetch-news.mjs`](scripts/fetch-news.mjs) |
| **Schedule** | Daily at 17:00 UTC (noon EST) via [`update-news.yml`](.github/workflows/update-news.yml) |
| **Output** | [`src/data/external-news-cache.json`](src/data/external-news-cache.json) (rolling 30 items) |
| **Commit** | `chore: update news feed cache [skip ci-deploy]` (only if changed) |

### Intel Feed (Weekly)

Fetches 45+ RSS feeds plus 9 Google News queries. Auto-tags items (funding, product, regulatory, research, policy, patent, clinical, partnership), extracts company mentions from [`bci-landscape.json`](shared/bci-landscape.json), and fuzzy-deduplicates (Jaccard trigram similarity). Items accumulate — the feed grows over time.

| | |
|---|---|
| **Script** | `npm run fetch-intel` → [`scripts/fetch-intel.mjs`](scripts/fetch-intel.mjs) |
| **Schedule** | Weekly, Sunday 17:00 UTC via [`update-intel.yml`](.github/workflows/update-intel.yml) |
| **Output** | [`src/data/bci-intel-feed.json`](src/data/bci-intel-feed.json) (accumulating) |
| **Sources registry** | [`src/data/intel-sources.json`](src/data/intel-sources.json) (204 sources, 39 with RSS) |
| **Commit** | `auto: update BCI intel feed [skip ci-deploy]` (only if new items after dedup) |

**Feed source categories:** News & Press, Biotech/MedTech, Research/Academic, Market Research, VC Blogs/Newsletters, Regulatory (FDA, NIST), Google News (9 BCI-specific queries).

Both pipelines use exit code 2 (no changes) to skip unnecessary commits. Manual runs: `workflow_dispatch` enabled on both.

### Other Automated Workflows

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| [`deploy.yml`](.github/workflows/deploy.yml) | On push to main | Build and deploy site to GitHub Pages |
| [`timeline-check.yml`](.github/workflows/timeline-check.yml) | On push | Verify `qif-timeline.json` stats are current |
| [`update-registry.yml`](.github/workflows/update-registry.yml) | Daily | Sync automation registry |
| [`security-audit.yml`](.github/workflows/security-audit.yml) | On push | `npm audit` for dependency vulnerabilities |
| [`verify-citations.yml`](.github/workflows/verify-citations.yml) | On push | Check citation integrity |
| [`changelog.yml`](.github/workflows/changelog.yml) | On push | Auto-generate changelog from git log |

---

## Terminology

| Term | Usage |
|------|-------|
| **Neurosecurity** | The research discipline (Denning, Matsuoka & Kohno, 2009). Use when referencing the academic field. |
| **BCI security** | The applied engineering domain. Use when describing what QIF tools do in practice. |
| **Neuroethics** | Foundational scholarship informing QIF's design constraints. QIF is informed by neuroethics; QIF is not a neuroethics project. |
| **Governance** | Policy bridge between security and ethics. Spans the full stack, not just neural. Do not use "neurogovernance." |

---

## Governance & Logging Architecture

This project uses a **single-source-of-truth model** for decision tracking. One file captures everything; other documents are generated from it.

```
                    ┌──────────────────────────────┐
                    │  QIF-DERIVATION-LOG.md       │  ← Single source of truth
                    │  (113 entries, lab notebook)  │     Write here. Everything else derives.
                    └──────────┬───────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
   ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
   │ DECISION-LOG.md │ │TRANSPARENCY │
   │ (auto-generated)│ │.md (auto)   │
   │ npm run decisions│ │npm run      │ │  ✅🚧📋❌    │
   └─────────────────┘ │transparency │ └──────────────┘
                        └─────────────┘
```

| Document | Purpose | Audience | Maintained |
|----------|---------|----------|------------|
| **[QIF-DERIVATION-LOG.md](model/QIF-DERIVATION-LOG.md)** | Lab notebook — every framework insight, decision, correction. RACI attribution, AI contribution level per entry. | Kevin (future self), peer reviewers, collaborators | Per session (max 1 entry) |
| **[DECISION-LOG.md](governance/DECISION-LOG.md)** | RACI tables — who decided, who built, who reviewed. | Governance auditors, future collaborators | Auto-generated: `npm run decisions` |
| **[TRANSPARENCY.md](governance/TRANSPARENCY.md)** | AI collaboration disclosure — contribution matrix, correction count, tool versions. | Peer reviewers, venues (arXiv, ACM, IEEE) | Auto-generated: `npm run transparency` |
| **[QIF-FIELD-JOURNAL.md](model/QIF-FIELD-JOURNAL.md)** | Personal/experiential observations. Kevin's raw voice. AI cannot write this. | Kevin only | When something surprises him |
| **[CHANGELOG.md](CHANGELOG.md)** | Auto-generated from git commits. What changed, not why. | Developers, contributors | Auto: `npm run changelog` |

### Data Studio & Datalake

All research data is served as open Parquet datasets at [qinnovate.com/data-studio/](https://qinnovate.com/data-studio/).

| Layer | What | Location |
|-------|------|----------|
| **Storage** | 27 JSON files (source of truth) | `shared/*.json`, `src/data/*.json` |
| **Parquet** | 31 compressed datasets (77% reduction) | `docs/data/parquet/*.parquet` |
| **Query** | KQL engine (build-time) + DuckDB-WASM SQL (browser, lazy-loaded) | `src/lib/kql-tables.ts`, `src/hooks/useDuckDB.ts` |
| **Browse** | Data Studio catalog + EEG sample browser | `/data-studio/`, `/data-studio/eeg/` |
| **Download** | Every dataset as `.parquet` — direct use in pandas, Polars, DuckDB | `/data/parquet/*.parquet` |
| **EEG Pipeline** | MNE-Python: EDF/MAT → filter → epoch → PSD → Parquet | `scripts/process-eeg-to-parquet.py` |

### Sensitive Information Controls

A 3-tier filter prevents sensitive data from reaching the public repo:
- **Tier 1 (auto-redact):** Emails, API keys, subject IDs, IRB numbers, home paths — Claude blocks inline, pre-commit hook catches in staged diffs
- **Tier 2 (warn-before-write):** Unpublished vulns, personal medical details, draft applications — Claude asks Kevin before including
- **Tier 3 (allowed):** Published names, DOIs, technique IDs, architecture decisions, NISS scores

Pre-commit hook: `scripts/governance-precommit.sh` (13 regex patterns, whitelist for known-safe)

---

## Developer Commands

All commands run from the repo root.

### Build & Serve

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start dev server (runs prebuild first) |
| `npm run build` | Production build (282 pages, runs prebuild first) |
| `npm run preview` | Preview built site from `dist/` |
| `npm run health` | Validate data sync, governance, counts — run before committing |

### Data Pipeline

| Command | What It Does |
|---------|-------------|
| `npm run prebuild` | Full pipeline: copy JSON → generate KQL → generate Parquet → regen governance |
| `npm run compute:chains` | Recompute impact chains from registrar (after adding techniques) |
| `npm run governance` | Regenerate DECISION-LOG.md + TRANSPARENCY.md from derivation log |
| `npm run decisions` | Regenerate DECISION-LOG.md only |
| `npm run transparency` | Regenerate TRANSPARENCY.md only |
| `npm run changelog` | Auto-generate CHANGELOG.md from git history |

### Research & Verification

| Command | What It Does |
|---------|-------------|
| `npm run verify` | Run all verification scripts (citations, facts, crossrefs) |
| `npm run verify:citations` | Check citation integrity against Crossref |
| `npm run citations` | Sync research-registry.json → QIF-RESEARCH-SOURCES.md |
| `npm run type-check` | TypeScript type checking (0 errors required) |

### EEG Data

| Command | What It Does |
|---------|-------------|
| `npm run eeg:list` | List available EEG datasets and their status |
| `npm run eeg:download` | Download all redistributable EEG datasets |
| `npm run eeg:process` | Run MNE-Python pipeline: EDF/MAT → Parquet |

### Intel Feeds

| Command | What It Does |
|---------|-------------|
| `npm run fetch-news` | Fetch BCI news from 14 RSS feeds |
| `npm run fetch-intel` | Fetch BCI intel from 45+ feeds + Google News |

---

## Contributing Workflow

### Before You Start

1. Read [DISCLAIMER.md](DISCLAIMER.md) and [Code of Conduct](CODE_OF_CONDUCT.md)
2. Run `npm ci` to install dependencies
3. Run `npm run health` to verify your environment is clean
4. Run `npm run build` to verify the site builds

### When You Change Data (`shared/*.json`)

The [Change Propagation Matrix](CLAUDE.md#change-propagation-matrix) tells you what else needs updating:

```
shared/*.json changes → npm run prebuild (auto-generates KQL JSON + Parquet + governance)
```

If you change `shared/qtara-registrar.json` (the TARA technique catalog), also run:
```bash
npm run compute:chains    # Recompute impact chains
npm run health            # Verify counts match across README, timeline, etc.
```

### When You Add a Feature

1. Build and test locally: `npm run dev`
2. Run health check: `npm run health`
3. Run type check: `npm run type-check`
4. Commit with prefix: `[Add]` for features, `[Fix]` for bugs, `docs:` for documentation

### Governance (for AI-assisted contributions)

If AI tools were used in your contribution:
1. The derivation log entry is written by the project maintainer (Kevin)
2. `npm run governance` regenerates the [Decision Log](governance/DECISION-LOG.md) and [Transparency Statement](governance/TRANSPARENCY.md) from the derivation log
3. This runs automatically in `npm run prebuild` — you don't need to do it manually

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

## Browse the Full History

Every decision, revision, and deleted line in this repository is preserved in git. You can time-travel to any point in the project's history using GitHub's native tools.

**Browse the repo at any point in time:**
```
https://github.com/qinnovates/qinnovate/tree/<COMMIT_SHA>
```
Go to [Commits](https://github.com/qinnovates/qinnovate/commits/main), click any commit, then **Browse files** to see the entire repo as it existed at that moment.

**Get a permanent link to any file:**
Press `Y` on any file page in GitHub. The URL converts from a branch reference (which moves) to a commit SHA permalink (which never changes). Append `#L10-L20` to link to specific lines.

**Compare any two points:**
```
https://github.com/qinnovates/qinnovate/compare/v1.0...v2.0
```
Replace `v1.0` and `v2.0` with any two tags, branches, or commit SHAs. GitHub renders a full diff of everything that changed between them.

**Visual file history:**
Replace `github.com` with `github.githistory.xyz` in any file URL to see an animated diff of every commit that touched that file. Example:
```
https://github.githistory.xyz/qinnovates/neurosecurity/blob/main/model/QIF-DERIVATION-LOG.md
```

**Permanent archive (survives repo deletion):**
This repository is archived by [Software Heritage](https://archive.softwareheritage.org/browse/origin/https://github.com/qinnovates/qinnovate/). Software Heritage assigns ISO-standard identifiers (SWHID) to every commit, directory, and file. If this repo ever disappears from GitHub, the archive persists.

**Full reference guide:** [`_archive/README.md`](_archive/README.md) — complete docs on all history tools, security scanning references, and key documents to track.

### Why This Matters

The same git history that lets you trace how a security framework evolved is the same history that bug bounty hunters use to find leaked secrets in force-pushed commits. Tools like [TruffleHog](https://github.com/trufflesecurity/trufflehog) and [Gitleaks](https://github.com/gitleaks/gitleaks) scan git history to surface credentials that developers thought they deleted. The mechanism is identical. The difference is consent and intent.

This is the same principle that runs through the entire project. TARA documents 161 BCI techniques where the attack mechanism and the therapeutic mechanism are physically identical. Signal injection is how you compromise a neural interface. It is also how you treat Parkinson's disease. The tool does not determine the use. The boundary is always consent, oversight, and intent.

We publish full history because transparency is the foundation of trust in security research. Every claim in this repo can be traced to the commit where it was introduced, the source that informed it, and the [derivation log entry](model/QIF-DERIVATION-LOG.md) where the decision was made. If something was wrong, you can see when it was corrected and why.

---

## Collaboration

This work needs collaborators. The research base is compiled (340+ verified sources). The threat taxonomy and scoring system exist. What comes next — empirical validation, clinical mappings, signal integrity formalization — requires domain expertise the author does not have alone.

If you work with neural data, BCI design, neuroethics, health policy, or regulatory compliance, please reach out.

**Contact:** [GitHub Issues](https://github.com/qinnovates/qinnovate/issues)
**Website:** [qinnovate.com](https://qinnovate.com)
**GitHub:** [github.com/qinnovates](https://github.com/qinnovates)

---

<div align="center">

*Open security research for brain-computer interfaces*

*Apache 2.0 · Vendor-agnostic*

</div>

---

*Founded 2026*
