# Research Integration Workflow

> Systematic process for identifying, evaluating, and integrating academic research findings into the ONI Framework.

**Version:** 1.0
**Created:** 2026-01-24
**Purpose:** Transform academic research into executable ONI components

---

## Table of Contents

- [Overview](#overview)
- [Phase 1: Discovery](#phase-1-discovery)
  - [Researcher Monitoring](#11-researcher-monitoring)
  - [Publication Sources to Monitor](#12-publication-sources-to-monitor)
  - [Lab/Institution Feeds](#13-labinstitution-feeds)
- [Phase 2: Evaluation](#phase-2-evaluation)
  - [Relevance Assessment Matrix](#21-relevance-assessment-matrix)
  - [Integration Type Classification](#22-integration-type-classification)
  - [Evaluation Template](#23-evaluation-template)
- [Phase 3: Integration](#phase-3-integration)
  - [Integration Pathways by Type](#31-integration-pathways-by-type)
  - [Integration Checklist](#32-integration-checklist)
  - [Integration Tracking Table](#33-integration-tracking-table)
- [Phase 4: Collaboration Outreach](#phase-4-collaboration-outreach)
  - [When to Reach Out](#41-when-to-reach-out)
  - [Outreach Template](#42-outreach-template)
  - [Collaboration Tracking](#43-collaboration-tracking)
- [Research Integration Queue](#research-integration-queue)
- [Automation Opportunities](#automation-opportunities)
- [Metrics & Success Criteria](#metrics--success-criteria)
- [Quick Reference: Integration Decision Tree](#quick-reference-integration-decision-tree)

---

## Overview

This workflow connects the **ACADEMIC_LANDSCAPE.md** (who to follow) with the **research pipeline** (how to find their work) and defines how findings become ONI code, documentation, or theoretical foundations.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RESEARCH INTEGRATION PIPELINE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   [1. DISCOVER]      [2. EVALUATE]      [3. INTEGRATE]              │
│        │                   │                   │                     │
│   ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐              │
│   │ Monitor │        │  Assess   │       │ Implement │              │
│   │  Papers │───────▶│ Relevance │──────▶│    or     │              │
│   │ + Labs  │        │ + Impact  │       │  Document │              │
│   └─────────┘        └───────────┘       └─────┬─────┘              │
│                                                 │                    │
│                                           ┌─────▼─────┐              │
│                                           │  Verify   │              │
│                                           │    &      │              │
│                                           │   Cite    │              │
│                                           └───────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Discovery

### 1.1 Researcher Monitoring

Add tracked researchers to the research monitor by updating `keywords.json`:

```json
{
  "researcher_tracking": {
    "tier_1_core": {
      "description": "Foundational researchers - monitor all publications",
      "researchers": [
        {"name": "Tadayoshi Kohno", "institution": "UW", "google_scholar": "...", "orcid": "..."},
        {"name": "Tamara Bonaci", "institution": "UW", "google_scholar": "...", "orcid": "..."},
        {"name": "Howard Chizeck", "institution": "UW", "google_scholar": "...", "orcid": "..."}
      ],
      "keywords": ["Kohno neural", "Bonaci BCI", "Chizeck implant"]
    },
    "tier_2_neuroethics": {
      "description": "Ethics/policy researchers - monitor for framework alignment",
      "researchers": [
        {"name": "Sara Goering", "institution": "UW", "focus": "agency"},
        {"name": "Rafael Yuste", "institution": "Columbia", "focus": "neurorights"},
        {"name": "Marcello Ienca", "institution": "TU Munich", "focus": "neurorights theory"},
        {"name": "Gabriel Lázaro-Muñoz", "institution": "Harvard", "focus": "DBS ethics"}
      ],
      "keywords": ["neurorights", "cognitive liberty", "mental privacy law"]
    },
    "tier_3_engineering": {
      "description": "BCI developers - monitor for security integration opportunities",
      "researchers": [
        {"name": "Leigh Hochberg", "institution": "Brown/BrainGate", "focus": "clinical BCI"},
        {"name": "Bin He", "institution": "CMU", "focus": "bidirectional BCI"},
        {"name": "Richard Andersen", "institution": "Caltech", "focus": "intent decoding"}
      ],
      "keywords": ["BrainGate security", "bidirectional BCI", "neural decoder"]
    }
  }
}
```

### 1.2 Publication Sources to Monitor

| Source | Frequency | Focus |
|--------|-----------|-------|
| **Google Scholar Alerts** | Real-time | Specific researcher names |
| **arXiv cs.CR + q-bio.NC** | Weekly | Security + neuroscience preprints |
| **bioRxiv Neuroscience** | Weekly | BCI experimental results |
| **IEEE EMBS** | Quarterly | Engineering implementations |
| **Nature Neuroscience** | Monthly | High-impact findings |
| **Journal of Neural Engineering** | Monthly | Technical BCI papers |

### 1.3 Lab/Institution Feeds

Subscribe to lab RSS feeds or newsletters:

| Lab | URL | Key Topics |
|-----|-----|------------|
| UW Security Lab | seclab.cs.washington.edu | Neurosecurity updates |
| BrainGate | braingate.org/news | Clinical trial results |
| NeuroRights Foundation | neurorightsfoundation.org | Policy developments |
| Stanford NPTL | nptl.stanford.edu | BCI performance data |
| CMU Neural Engineering | cmu.edu/bme | Bidirectional BCI |

---

## Phase 2: Evaluation

### 2.1 Relevance Assessment Matrix

For each discovered paper/finding, score on these dimensions:

| Dimension | Score (1-5) | Criteria |
|-----------|-------------|----------|
| **Technical Applicability** | | Can this inform ONI code? |
| **Theoretical Foundation** | | Does this validate/challenge ONI assumptions? |
| **Security Relevance** | | Does this expose new threats or defenses? |
| **Ethical Alignment** | | Does this support neurorights implementation? |
| **Implementation Readiness** | | Is there sufficient detail to implement? |

**Scoring Guide:**
- **5** = Direct implementation possible
- **4** = Strong influence on design decisions
- **3** = Useful reference/validation
- **2** = Tangentially related
- **1** = Not applicable

**Integration Threshold:** Total score ≥ 15 = Proceed to integration

### 2.2 Integration Type Classification

| Type | Description | ONI Target | Example |
|------|-------------|------------|---------|
| **CODE** | Implementable algorithm/method | `tara-nsec-platform/tara/` | Signal processing technique |
| **MODEL** | Theoretical framework | `oni-framework/` | Threat model extension |
| **VALIDATION** | Empirical support for ONI claims | `publications/` | Synaptic reliability data |
| **ETHICS** | Policy/rights framework | `governance/` | Neurorights enforcement |
| **REFERENCE** | Citation for credibility | `ACADEMIC_LANDSCAPE.md` | Lab collaboration potential |

### 2.3 Evaluation Template

```markdown
## Research Evaluation: [Paper Title]

**Source:** [Journal/Conference, Year]
**Authors:** [Names]
**Researcher Tier:** [1/2/3]
**Date Evaluated:** YYYY-MM-DD

### Relevance Scores
| Dimension | Score | Notes |
|-----------|-------|-------|
| Technical Applicability | /5 | |
| Theoretical Foundation | /5 | |
| Security Relevance | /5 | |
| Ethical Alignment | /5 | |
| Implementation Readiness | /5 | |
| **TOTAL** | /25 | |

### Key Findings
1. [Finding 1]
2. [Finding 2]

### ONI Integration Potential
- **Type:** [CODE/MODEL/VALIDATION/ETHICS/REFERENCE]
- **Target Component:** [specific file/module]
- **Integration Effort:** [Low/Medium/High]

### Decision
- [ ] Integrate immediately
- [ ] Queue for future integration
- [ ] Document as reference only
- [ ] Not applicable

### Notes
[Additional context, caveats, dependencies]
```

---

## Phase 3: Integration

### 3.1 Integration Pathways by Type

#### CODE Integration

```
1. Identify target module in tara-nsec-platform/tara/
2. Create feature branch: research/[paper-shortname]
3. Implement algorithm/method
4. Add unit tests with paper-derived test cases
5. Document source in code comments with citation
6. Update relevant TechDoc with implementation notes
7. Add to ACADEMIC_LANDSCAPE.md integration table
```

**Citation in Code:**
```python
def signal_coherence_check(signal: np.ndarray) -> float:
    """
    Check signal coherence using phase-locking analysis.

    Implementation based on:
        Fries, P. (2015). Rhythms for Cognition: Communication through Coherence.
        Neuron, 88(1), 220-235. https://doi.org/10.1016/j.neuron.2015.09.034

    Extended for security application per ONI Framework coherence metric.
    """
    pass
```

#### MODEL Integration

```
1. Review existing ONI model components
2. Identify extension/modification points
3. Update ONI_LAYERS.md if layer definitions affected
4. Update threat model documentation (TARA)
5. Create/update TechDoc explaining theoretical basis
6. Add citations to relevant publications
```

#### VALIDATION Integration

```
1. Extract empirical data points from paper
2. Add to resources/pipeline/verified/[topic]-verified.md
3. Update TechDoc claims with new citations
4. Recalculate any affected metrics (if applicable)
5. Document in TRANSPARENCY.md if significant
```

#### ETHICS Integration

```
1. Map finding to neurorights framework
2. Update NEUROETHICS_ALIGNMENT.md
3. Update governance documentation
4. Add to regulatory compliance notes
5. Update ACADEMIC_LANDSCAPE.md collaboration section
```

### 3.2 Integration Checklist

Before marking integration complete:

- [ ] Source paper added to `resources/pipeline/sources/papers/`
- [ ] Citation added to relevant TechDoc References section
- [ ] ACADEMIC_LANDSCAPE.md updated (if researcher not listed)
- [ ] Code includes inline citation (if CODE integration)
- [ ] Tests added/updated (if CODE integration)
- [ ] INDEX.md updated if new dependencies created
- [ ] TRANSPARENCY.md updated if AI-assisted integration

### 3.3 Integration Tracking Table

Add completed integrations to ACADEMIC_LANDSCAPE.md:

```markdown
## Integrated Research Log

| Date | Paper | Authors | Type | ONI Component | Status |
|------|-------|---------|------|---------------|--------|
| 2026-01-24 | Neurosecurity (2009) | Kohno et al. | MODEL | `NeurosecurityFirewall` | Complete |
| 2026-01-24 | BCI Anonymizer Patent | Bonaci et al. | CODE | `BCIAnonymizer` | Complete |
| ... | ... | ... | ... | ... | ... |
```

---

## Phase 4: Collaboration Outreach

### 4.1 When to Reach Out

Appropriate to contact researchers when:
- ONI implements their published work (attribution + feedback request)
- ONI extends their work in novel ways (potential collaboration)
- Preparing graduate school applications (demonstrate genuine interest)
- Seeking validation of ONI's approach (expert review)

### 4.2 Outreach Template

```
Subject: ONI Framework - Implementation of [Their Work]

Dear Dr. [Name],

I am writing to inform you that the ONI Framework (github.com/qinnovates/mindloft),
an open-source brain-computer interface security framework, has implemented
concepts from your work on [specific paper/patent].

Specifically, [describe implementation]:
- [Component 1] implements [their concept]
- [Component 2] extends [their work] by [how]

I wanted to:
1. Ensure proper attribution (see our citation in [link to TechDoc])
2. Invite feedback on our interpretation of your work
3. Explore potential collaboration opportunities

The ONI Framework aims to [brief mission statement]. Your work on [topic]
has been foundational to our approach to [specific area].

I am currently [your status - student/researcher] and am particularly
interested in [relevant program] at [their institution].

Would you be open to a brief conversation about [specific topic]?

Best regards,
Kevin L. Qi
github.com/qinnovates/mindloft
```

### 4.3 Collaboration Tracking

| Researcher | Institution | Contacted | Response | Follow-up | Notes |
|------------|-------------|-----------|----------|-----------|-------|
| | | YYYY-MM-DD | | | |

---

## Research Integration Queue

### Priority Queue (Immediate Integration Opportunities)

Based on ACADEMIC_LANDSCAPE.md, these research areas have highest integration potential:

| Priority | Research Area | Researcher | ONI Target | Integration Type |
|----------|---------------|------------|------------|------------------|
| **P1** | Synaptic reliability data | Hochberg (Brown) | Coherence metric validation | VALIDATION |
| **P1** | Bidirectional BCI security | He (CMU) | L8 firewall bidirectional rules | CODE |
| **P2** | Intent decoding privacy | Andersen (Caltech) | L13 Semantic layer protection | MODEL |
| **P2** | Neurorights enforcement | Yuste (Columbia) | `BCIAnonymizer` enhancement | CODE |
| **P3** | Closed-loop autonomy | Maslen (Oxford) | L14 user override mechanisms | MODEL |
| **P3** | DBS pediatric ethics | Lázaro-Muñoz (Harvard) | Vulnerable population handling | ETHICS |

### Backlog (Future Integration)

| Research Area | Researcher | Waiting For |
|---------------|------------|-------------|
| Brain-to-brain interface security | Nicolelis (Duke) | BTBI clinical deployment |
| Mixed reality BCI attack surface | Celnik (Johns Hopkins) | More published threat data |
| Non-invasive BCI security model | He (CMU) | EEG-specific threat analysis |

---

## Automation Opportunities

### Planned Enhancements to research_monitor.py

1. **Author Tracking:**
   - Add ORCID/Google Scholar ID lookup
   - Alert on new publications from tracked researchers

2. **Integration Scoring:**
   - Auto-generate evaluation template for discovered papers
   - Pre-populate relevance scores based on keyword density

3. **Citation Management:**
   - Auto-format citations in APA style
   - Generate BibTeX entries for LaTeX publications

### Implementation Notes

```python
# Proposed addition to keywords.json structure
{
  "researcher_tracking": {
    "kohno_tadayoshi": {
      "orcid": "0000-0002-1234-5678",
      "google_scholar": "abc123xyz",
      "institution": "University of Washington",
      "tier": 1,
      "topics": ["neurosecurity", "BCI privacy", "implant security"],
      "alert_keywords": ["Kohno neural", "Kohno BCI", "Kohno implant"]
    }
  }
}
```

---

## Metrics & Success Criteria

### Integration Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Papers evaluated per month | 10+ | — |
| Integrations completed per quarter | 3+ | — |
| Tier 1 researcher citations | 100% | 100% |
| Code integrations with tests | 100% | — |
| Outreach emails sent | 5/quarter | — |
| Collaboration responses | Track | — |

### Quality Indicators

- All code integrations pass verification protocol
- All citations verified against primary sources
- ACADEMIC_LANDSCAPE.md updated within 7 days of integration
- No unattributed implementations

---

## Document Maintenance

Update this workflow when:
- New researcher tiers identified
- Integration process changes
- Automation capabilities added
- New research sources discovered

---

## Quick Reference: Integration Decision Tree

```
New Paper Discovered
        │
        ▼
Is author in ACADEMIC_LANDSCAPE.md?
        │
   ┌────┴────┐
   │ YES     │ NO
   ▼         ▼
Evaluate    Add to landscape first?
immediately        │
   │         ┌─────┴─────┐
   │         │ YES       │ NO
   │         ▼           ▼
   │    Add entry    Evaluate as
   │    then eval    general paper
   │         │           │
   └────┬────┴───────────┘
        ▼
Score ≥ 15?
        │
   ┌────┴────┐
   │ YES     │ NO
   ▼         ▼
Classify    Add to references
integration only (REFERENCE type)
type
   │
   ▼
Execute integration
pathway (§3.1)
   │
   ▼
Update tracking
& documentation
```

---

*This workflow was created with AI assistance for structure and process design. The research priorities, evaluation criteria, and integration strategy are human contributions aligned with ONI Framework goals.*
