# Research Verification Protocol (Anti-Hallucination Firewall)

> **Purpose:** Prevent AI hallucinations in academic research by enforcing epistemic boundaries on all neuroscience, physics, and security claims.
> **Adapted from:** kevinqicode/resources/process/HALLUCINATION_FIREWALL.md
> **Status:** Active
> **Last Updated:** 2026-01-24

---

## Table of Contents

- [Overview](#overview)
- [The 4-Layer Architecture](#the-4-layer-architecture)
- [Layer 1: Truth Layer (Source Management)](#layer-1-truth-layer-source-management)
  - [Folder Structure](#folder-structure)
  - [Source Documentation Format](#source-documentation-format)
  - [ONI-Specific Source Categories](#oni-specific-source-categories)
- [Layer 2: Grounding Engine](#layer-2-grounding-engine)
  - [Research Tools](#research-tools)
  - [Grounding Workflow](#grounding-workflow)
  - [Citation Requirements](#citation-requirements)
- [Layer 3: Verification Firewall](#layer-3-verification-firewall)
  - [Uncertainty Tagging System](#uncertainty-tagging-system)
  - [Domain-Specific Verification](#domain-specific-verification)
  - [Verification Checklist](#verification-checklist)
  - [Red Flags](#red-flags-trigger-deeper-verification)
- [Layer 4: Publication Rules](#layer-4-publication-rules)
  - [For Claude/AI Assistants](#for-claudeai-assistants)
  - [Publication Verification Levels](#publication-verification-levels)
  - [Execution Blockers](#execution-blockers)
- [Integration with Existing ONI Systems](#integration-with-existing-oni-systems)
- [Verified Claims Template](#verified-claims-template)
- [Quick Reference](#quick-reference)
- [Examples from ONI Development](#examples-from-oni-development)
- [Metrics & Improvement](#metrics--improvement)

---

## Overview

The ONI Framework makes claims about neuroscience, physics, quantum mechanics, and cybersecurity. Each domain requires different verification standards. This protocol ensures all research claims are grounded in peer-reviewed sources before inclusion in publications.

**Why This Matters for ONI:**
- Academic credibility requires traceable citations
- Neuroscience claims about synaptic reliability, coherence, etc. must match literature
- Physics claims (quantum tunneling, thermodynamic thresholds) must be experimentally validated
- Security architecture decisions need documented reasoning

---

## The 4-Layer Architecture

```
┌────────────────────────────────────────┐
│           TRUTH LAYER                   │  ← Authoritative sources only
│─────────────────────────────────────────│
│ • Peer-reviewed papers (arXiv, PubMed) │
│ • Patents (USPTO, EPO)                  │
│ • Official specs (IEEE, ISO)            │
│ • Experimental data                     │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│         GROUNDING ENGINE                │  ← Extract claims with citations
│─────────────────────────────────────────│
│ • Research monitor (arXiv, PubMed)     │
│ • NotebookLM for paper analysis        │
│ • Cross-model validation               │
│ • APA citation enforcement              │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│      VERIFICATION FIREWALL              │  ← Domain-specific validation
│─────────────────────────────────────────│
│ • SOCRATES: General fact-checking      │
│ • GÖDEL: Mathematical formula verify   │
│ • FARADAY: Physics/neuroscience claims │
│ • Uncertainty tagging                   │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│       PUBLICATION OUTPUT                │  ← Only verified content
│─────────────────────────────────────────│
│ • TechDocs (APA format)                 │
│ • Blog posts                            │
│ • Python implementations                │
│ • TRANSPARENCY.md updates               │
└────────────────────────────────────────┘
```

---

## Layer 1: Truth Layer (Source Management)

### Folder Structure

```
MAIN/legacy-core/resources/pipeline/
├── sources/                    # RAW SOURCES (authoritative documents)
│   ├── papers/                 # Peer-reviewed papers (PDF, BibTeX)
│   │   └── kohno-2009.pdf
│   ├── patents/                # Patent documents
│   │   └── US20140228701A1.md  # BCI Anonymizer (ABANDONED)
│   ├── specs/                  # Standards and specifications
│   └── data/                   # Experimental datasets
│
├── verified/                   # PROCESSED CLAIMS (verified facts)
│   ├── coherence-verified.md   # Verified coherence claims
│   ├── neurosecurity-verified.md
│   └── quantum-verified.md
│
├── incoming/                   # Research monitor output
└── processed/                  # Reviewed and categorized
```

### Source Documentation Format

When adding a source to `sources/`, create an entry:

```markdown
## Source: [Title]

**Authors:** [Author list]
**Year:** YYYY
**Type:** Paper | Patent | Spec | Data
**DOI/URL:** [link]
**Retrieved:** YYYY-MM-DD
**Credibility:** High (peer-reviewed) | Medium (preprint) | Low (blog/opinion)

**Key Claims:**
1. [Claim] — Section X, p. Y
2. [Claim] — Section X, p. Y

**ONI Relevance:**
- Maps to Layer [N]
- Supports [framework component]

**Citation (APA):**
Author, A. A. (Year). Title. *Journal*, Volume(Issue), pages. DOI
```

### ONI-Specific Source Categories

| Category | Priority | Examples |
|----------|----------|----------|
| **Neuroscience** | High | Synaptic transmission, ERP components, neural oscillations |
| **Physics** | High | Quantum coherence, thermodynamics, signal propagation |
| **Cybersecurity** | High | Attack models, encryption, authentication |
| **BCI Research** | High | Kohno (2009), Bonaci (2015), Denning (2009) |
| **Prior Art** | Medium | Patents, implementations, existing frameworks |

---

## Layer 2: Grounding Engine

### Research Tools

| Tool | Use Case | How to Use |
|------|----------|------------|
| **Research Monitor** | Automated paper discovery | `python research_monitor.py --days 7 --sources all` |
| **NotebookLM** | Deep paper analysis | Upload PDFs → Ask specific questions → Get cited answers |
| **WebSearch** | Verify real-time claims | Search → Find authoritative sources → Cross-reference |
| **LMArena** | Cross-model validation | Test claims against multiple models to detect bias |
| **Google Scholar** | Citation verification | Verify citation counts, find related work |

### Grounding Workflow

```
1. Identify claim requiring verification
         ↓
2. Search for authoritative sources
   - arXiv, PubMed, IEEE for papers
   - USPTO for patents
   - Official docs for specs
         ↓
3. Add source to sources/ folder
         ↓
4. Upload to NotebookLM for deep analysis
         ↓
5. Extract specific claims with page/section citations
         ↓
6. Create [topic]-verified.md in verified/ folder
         ↓
7. Cross-validate with second source if possible
```

### Citation Requirements

Every factual claim must have an inline citation:

```markdown
Synaptic vesicle release is approximately 85% reliable per synapse
(Branco & Bhalla, 2006; Del Castillo & Katz, 1954).
```

For ONI-specific claims:
```markdown
The Neural Gateway (L8) serves as the firewall location between
silicon and biological domains (Qi, 2026, TechDoc-ONI_Framework).
```

---

## Layer 3: Verification Firewall

### Uncertainty Tagging System

Every claim gets tagged with a confidence level:

| Tag | Meaning | Action for TechDocs | Action for Blogs |
|-----|---------|---------------------|------------------|
| `✅ VERIFIED` | Direct citation from peer-reviewed source | Use freely | Use freely |
| `⚠️ INFERRED` | Logical inference from verified facts | Flag in text | Explain reasoning |
| `🔍 UNVERIFIED` | Plausible but no source found | Do NOT use | Do NOT use |
| `❌ CONTRADICTED` | Evidence contradicts claim | Do NOT use | Do NOT use |
| `❓ UNCERTAIN` | Conflicting sources | Investigate further | Do NOT use |
| `🔬 HYPOTHESIS` | Novel ONI contribution | Clearly label | Clearly label |

### Domain-Specific Verification

#### Neuroscience Claims (FARADAY)

| Claim Type | Required Evidence |
|------------|-------------------|
| Synaptic reliability | Peer-reviewed paper with experimental data |
| Neural timescales | Multiple sources, femtosecond precision matters |
| ERP components | Established literature (P300, N170, etc.) |
| Brain region functions | Textbook-level consensus or recent review |

**Red Flags:**
- Biological coherence timescales stated as milliseconds (actual: femtoseconds)
- Uniform reliability values (biology is heterogeneous)
- Brain region claims without anatomical basis

#### Physics Claims (GÖDEL)

| Claim Type | Required Evidence |
|------------|-------------------|
| Quantum coherence | Experimental paper with measured timescales |
| Thermodynamic limits | Established physics (Landauer limit, etc.) |
| Signal propagation | Physics textbook or IEEE paper |
| Energy calculations | Show work, verify units |

**Red Flags:**
- Quantum effects claimed at room temperature without evidence
- Thermodynamic violations
- Energy estimates without unit verification

#### Mathematical Claims (GÖDEL)

| Claim Type | Required Verification |
|------------|----------------------|
| Formulas | Cross-check against TechDoc and Python implementation |
| Proofs | Verify logic chain, check assumptions |
| Statistics | Verify methodology, check p-values, confirm sample sizes |
| Calculations | Show work, verify independently |

**Red Flags:**
- Formulas that don't match implementation
- Statistics without methodology
- Calculations with unit errors

### Verification Checklist

Before including any claim in publications:

```markdown
## Claim Verification

**Claim:** [The claim being verified]
**Domain:** Neuroscience | Physics | Security | Mathematics

- [ ] Source identified?
- [ ] Source is peer-reviewed or equivalent authority?
- [ ] Claim matches source exactly? (no paraphrasing errors)
- [ ] Cross-referenced with second source?
- [ ] Recency check? (Is this still current science?)
- [ ] Domain expert check? (FARADAY for neuro, GÖDEL for math)
- [ ] Uncertainty tag assigned?

**Verdict:** ✅ | ⚠️ | 🔍 | ❌ | ❓ | 🔬
**Citation:** [Full APA citation]
```

### Red Flags (Trigger Deeper Verification)

Stop and investigate if:

- **Too perfect numbers:** Uniform 0.95 reliability (biology is messy)
- **Dramatic claims:** "This will revolutionize..." without evidence
- **Timescale errors:** Orders of magnitude off (ms vs fs)
- **AI confidence without source:** Model states fact with no citation
- **Novel claims:** ONI-specific innovations need `🔬 HYPOTHESIS` tag
- **Cross-domain leaps:** Physics principle applied to biology without justification

---

## Layer 4: Publication Rules

### For Claude/AI Assistants

When conducting research or writing publications:

1. **NEVER state neuroscience facts without sources** — If unsure, say "This requires verification"
2. **USE uncertainty tags** — Every factual claim gets a tag
3. **CITE sources inline** — APA format in TechDocs
4. **FLAG inferences** — Clearly mark logical conclusions vs. cited facts
5. **ADMIT gaps** — "No source found for this claim" is better than hallucinating
6. **CROSS-CHECK formulas** — Verify against TechDoc AND Python implementation

### Publication Verification Levels

| Content Type | Verification Level | Allowed Tags |
|--------------|-------------------|--------------|
| TechDocs (APA) | All claims ✅ VERIFIED | ✅, 🔬 (labeled) |
| Blog posts | All facts ✅ VERIFIED | ✅, ⚠️ (labeled) |
| Research notes | Can include unverified | ✅, ⚠️, 🔍, 🔬 |
| Python code | Implementation matches TechDoc | ✅ |
| TRANSPARENCY.md | Human-verified examples | ✅ |

### Execution Blockers

Do NOT proceed to publication if:

- Core claims are 🔍 UNVERIFIED
- Key statistics have no source
- Formulas don't match implementation
- More than 20% of claims are ⚠️ INFERRED
- Domain expert (FARADAY/GÖDEL) flags issues

---

## Integration with Existing ONI Systems

### Connection to TRANSPARENCY.md

When documenting AI corrections (Example 3, etc.), use this format:

```markdown
#### Example N: [Brief Title]
- **AI Initial Output**: [What AI suggested]
- **Human Override**: [What was changed]
- **Verification Applied**: [Which firewall check caught this]
- **Source Consulted**: [Citation that corrected the claim]
```

### Connection to Editor Agent

The Editor Agent (`MAIN/legacy-core/resources/editor/EDITOR_AGENT.md`) handles:
- Cross-reference validation (layer names, formulas)
- Sync between TechDocs and README.md
- Date/count accuracy

The Research Verification Protocol handles:
- Factual accuracy of claims
- Source citation completeness
- Domain-specific validation

### Connection to Personas

| Persona | Role in Verification |
|---------|---------------------|
| **SOCRATES** | General fact-checking, questions assumptions |
| **GÖDEL** | Mathematical/formula verification |
| **FARADAY** | Physics and neuroscience claims |
| **HYPATIA** | Documentation organization, source filing |

---

## Verified Claims Template

Create files in `MAIN/legacy-core/resources/pipeline/verified/`:

```markdown
# [Topic] — Verified Claims

> **Last Updated:** YYYY-MM-DD
> **Verified By:** [Persona/Human]
> **Sources Consulted:** [Count]

---

## Verified Claims (✅)

### Claim 1: [Statement]
**Source:** Author (Year), Section X, p. Y
**Citation:** [Full APA]
**Verified Date:** YYYY-MM-DD
**Used In:** TechDoc-[Topic].md, Line N

### Claim 2: [Statement]
...

---

## Inferences (⚠️)

### Inference 1: [Statement]
**Based On:** [Verified claim it derives from]
**Logic:** [Why this inference is valid]
**Risk:** [What could make this wrong]

---

## Hypotheses (🔬)

### Hypothesis 1: [Statement]
**Novel Contribution:** [What ONI adds]
**Testable:** [How to validate]
**Status:** Proposed | Under Review | Accepted

---

## Rejected/Corrected (❌)

### Correction 1: [Original wrong claim]
**Corrected To:** [Right claim]
**Source:** [What proved it wrong]
**Where Fixed:** [File, line]
```

---

## Quick Reference

### Before Making Any Factual Claim

```
1. Do I have a source?
   No → Search or flag as 🔍 UNVERIFIED

2. Is the source peer-reviewed or authoritative?
   No → Find better source or downgrade to ⚠️

3. Does my claim match the source exactly?
   No → Adjust or flag as inference

4. Is this a neuroscience/physics claim?
   Yes → Run through FARADAY/GÖDEL check

5. Tag: ✅ ⚠️ 🔍 ❌ ❓ 🔬

6. Cite: (Author, Year)
```

### Domain Quick Checks

| Domain | Key Question | Common Error |
|--------|--------------|--------------|
| **Neuroscience** | What's the timescale? | ms vs fs confusion |
| **Physics** | Does this violate thermodynamics? | Energy estimates wrong |
| **Math** | Does formula match code? | Notation inconsistency |
| **Security** | Is this a real attack vector? | Theoretical vs practical |

---

## Examples from ONI Development

### Good (Verified) ✅

```markdown
Synaptic vesicle release is approximately 85% reliable per synapse
(Branco & Bhalla, 2006; Del Castillo & Katz, 1954).
```

### Flagged (Inferred) ⚠️

```markdown
This exponential compounding suggests transport variance accumulates
faster than phase or gain variance ⚠️ INFERRED from established
synaptic reliability data — no direct ONI-context study.
```

### Hypothesis (ONI Novel) 🔬

```markdown
Signals with supranormal reliability (>0.95) should trigger anomaly
detection as potential attack signatures 🔬 HYPOTHESIS — novel ONI
contribution, testable with synthetic signal injection.
```

### Corrected (Wrong → Right) ❌→✅

```markdown
❌ WRONG: "Biological quantum coherence persists for ~10 milliseconds"
✅ RIGHT: "Biological quantum coherence persists for ~100 femtoseconds"
Source: Engel et al., 2007
Fixed in: TechDoc-Quantum_Encryption.md
```

---

## Metrics & Improvement

Track verification quality:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Verified claim rate | >90% in TechDocs | Count tags in publications |
| Source diversity | 3+ sources per topic | Count unique citations |
| Correction rate | <5% post-publish | Track errors found after |
| Cross-model validation | All novel claims | LMArena testing |

---

*This protocol prevents hallucinations by enforcing: Sources → Citations → Domain Verification → Publication*

*Adapted for ONI Framework from kevinqicode anti-hallucination firewall.*
