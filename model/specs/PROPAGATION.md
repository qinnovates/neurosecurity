# QIF Truth Propagation Protocol

> **One rule:** Truth flows downward. Never upward. Never sideways.
>
> ```
> QIF-TRUTH.md  -->  oni/ repo docs  -->  qinnovates.github.io/blogs/
>   (canonical)       (implementation)       (public-facing)
> ```

---

## A. Propagation Map

Use this table to look up which files need updating when a QIF-TRUTH.md section changes.

| QIF-TRUTH Section | Repo Files (oni/) | Blog Files (qinnovates.github.io/blogs/) |
|---|---|---|
| **S1: Framework Identity** | `MAIN/qif/README.md`, `README.md`, `brand.json` | OSI of Mind |
| **S2: Layer Architecture** | `ONI_LAYERS.md`, all TechDocs with layer tables, `layers.py` | All 7 QIF blogs |
| **S3.1: Coherence Metric** | `TechDoc-Coherence_Metric.md`, `coherence.py`, whitepaper | Spam Filter (Coherence) |
| **S3.2: Scale-Frequency** | `TechDoc-Scale_Frequency.md`, whitepaper | Hidden Equation (f x S) |
| **S3.3: Established Physics** | Whitepaper equation chain table | (none directly) |
| **S3.4: Quantum Equations** | `TechDoc-Quantum_Encryption.md`, whitepaper | Quantum Hackers, Nobel Prize, Liminal Phase |
| **S4: Candidate QI Equations** | Whitepaper (when published) | (none yet) |
| **S5: Validated External Claims** | All TechDocs referencing these numbers | Heart Attack, Quantum Hackers |
| **S6: Sync Dashboard** | (self-tracking) | (self-tracking) |

### Key Repo File Locations

| File | Path |
|------|------|
| brand.json | `MAIN/legacy-core/resources/brand/brand.json` |
| ONI_LAYERS.md | `MAIN/legacy-core/oni-framework/ONI_LAYERS.md` |
| layers.py | `MAIN/legacy-core/oni-framework/oni/layers.py` |
| coherence.py | `MAIN/legacy-core/oni-framework/oni/coherence.py` |
| TechDocs | `MAIN/legacy-core/publications/[topic]/TechDoc-*.md` |
| Whitepaper | `docs/whitepaper/` |
| QIF README | `MAIN/qif/README.md` |

---

## B. Change Protocol

**When you change QIF-TRUTH.md, follow these 10 steps in order:**

- [ ] 1. Make the change in **QIF-TRUTH.md**
- [ ] 2. Update the **"Last validated"** date in QIF-TRUTH.md header
- [ ] 3. Look up affected **repo files** in the Propagation Map (Section A)
- [ ] 4. Update each affected repo file
- [ ] 5. Run **Editor Agent** to catch cascades within the repo
- [ ] 6. Look up affected **blog files** in the Propagation Map
- [ ] 7. Update each affected blog file
- [ ] 8. Update **Section 6 Sync Dashboard** in QIF-TRUTH.md
- [ ] 9. Commit **oni/** repo changes
- [ ] 10. Commit **qinnovates.github.io** changes

**Do not skip steps. Do not reorder.**

---

## C. Backwards Flow Prevention

```
IF you find an error in a blog or repo doc:

  1. Check QIF-TRUTH.md — is the truth doc also wrong?

     YES → Fix QIF-TRUTH.md FIRST, then propagate down (Section B)
     NO  → The blog/repo diverged. Update it to match QIF-TRUTH.md.

  2. NEVER update QIF-TRUTH.md based on a blog post.

  QIF-TRUTH.md is updated based on:
  - Primary sources (peer-reviewed papers, textbooks)
  - Physics / mathematics / neuroscience evidence
  - Strategic decisions by Kevin Qi
  - Novel QIF contributions (labeled as hypothesis)
```

---

## D. Weekly Audit (Every Sunday, 15 min max)

- [ ] 1. Open QIF-TRUTH.md — check **"Next audit due"** date
- [ ] 2. Scan **Section 6 Sync Dashboard** — any `REVIEW` or `NEEDS_SYNC`?
- [ ] 3. Has any repo TechDoc been edited since last audit? If yes → verify it matches truth
- [ ] 4. Has any blog been edited since last audit? If yes → verify it matches truth
- [ ] 5. Update **"Last audit"** date in QIF-TRUTH.md
- [ ] 6. Set **"Next audit due"** to next Sunday
- [ ] 7. If clean, confirm all Section 6 entries with today's date

**If discrepancies found:** Follow Section B (Change Protocol) to fix them. Truth wins.

---

## E. Empirical Validation Pipeline

> **Every significant QIF change must be validated before propagation.**
> **Validation is a formal step, not optional. Results are logged in QIF-DERIVATION-LOG.md.**

### Validation Stages

Changes flow through validation stages before propagation. Not every change needs all stages — use the trigger table below.

```
Stage 1: Internal Validation (Claude)
  └─ Research agents (quantum physics, neuroscience, cybersecurity)
  └─ Cross-reference against QIF-RESEARCH-SOURCES.md
  └─ Consistency check against QIF-TRUTH.md

Stage 2: Independent AI Review (Gemini CLI)
  └─ Pipe full whitepaper + config.py to Gemini
  └─ Prompt: unbiased peer review, no prior context
  └─ Captures: validations, gaps, scientific concerns, recommendations

Stage 3: Literature Check (web search)
  └─ Search for recent papers affecting the claim
  └─ Check for contradictions with published work
  └─ Update QIF-RESEARCH-SOURCES.md with new finds

Stage 4: Empirical Test (when applicable)
  └─ Apply to real/public BCI dataset if claim is testable
  └─ Run sensitivity analysis if parameters changed
  └─ Generate reproducible results via qif-lab code
```

### Trigger Table — Which stages are required?

| Change Type | Stage 1 | Stage 2 | Stage 3 | Stage 4 |
|-------------|---------|---------|---------|---------|
| New equation or variable | Required | Required | Required | If testable |
| Layer architecture change | Required | Required | Required | — |
| QI range adjustment | Required | Recommended | Required | Run sensitivity |
| New brain region mapping | Required | — | Required | — |
| New threat vector | Required | — | Required | — |
| Tone/framing/writing change | — | Recommended | — | — |
| Bug fix / typo | — | — | — | — |
| New chapter content | Required | Required | Recommended | If claims are testable |

### Gemini CLI Review Protocol

When running Stage 2 (independent review):

```bash
# 1. Concatenate all source files
cat config.py index.qmd qif-whitepaper.qmd chapters/*.qmd > /tmp/whitepaper-full.txt

# 2. Pipe to Gemini with review prompt
cat /tmp/whitepaper-full.txt | gemini -o text "<review prompt>"

# 3. Save output
# Output goes to scratchpad/gemini-review.txt AND gets logged in QIF-DERIVATION-LOG.md
```

**Standard review prompt template:**
> "You are an independent academic reviewer with expertise in quantum physics, neuroscience, brain-computer interfaces, and cybersecurity. You have NO prior relationship with this project. Provide an honest, unbiased peer review with sections: (1) Validations, (2) Critical Gaps, (3) Scientific Concerns, (4) Structural Critique, (5) Writing & Presentation, (6) Top 10 Recommendations, (7) Overall Assessment. Be direct. Do not soften criticism."

**After review:**
1. Log full results in QIF-DERIVATION-LOG.md (new entry)
2. Assess each finding (agree/disagree/partially agree with rationale)
3. Create action items for agreed improvements
4. Update QIF-TRUTH.md if any findings change validated facts

### Research Source Tracking

All validation sessions produce sources. These MUST be captured:

| Document | Purpose |
|----------|---------|
| **QIF-RESEARCH-SOURCES.md** | Running catalog of ALL sources found during validation (102+ as of 2026-02-02) |
| **QIF-DERIVATION-LOG.md** | Where validation results and assessments are documented with timestamps |

**Rules:**
- Every new validation session appends to QIF-RESEARCH-SOURCES.md (never overwrites)
- Each source entry includes: citation, URL, which agent/tool found it, QIF relevance
- Sources are organized by domain (Quantum Physics, Neuroscience, BCI, Cybersecurity, etc.)

### AI Transparency Protocol

All AI involvement in QIF development is documented in the QIF-DERIVATION-LOG.md timeline. Each entry records:

1. **Which AI systems were involved** (Claude model version, Gemini version, research agents)
2. **What role each played** (co-derivation, validation, independent review, source finding)
3. **What the human decided** vs. what the AI suggested
4. **The collaboration chain** at that point in time

This transparency lives in the Derivation Log — one place, chronological, compounding. No separate transparency file needed. The log IS the audit trail.

---

*Created: 2026-02-02*
*Updated: 2026-02-02 (added Validation Pipeline, Gemini protocol, research tracking, transparency)*
*Lives next to: QIF-TRUTH.md*
*Maintainer: Kevin Qi*
