# ONI Framework Kanban Board

> **Visual task board for tracking work in progress.**
> Synced with `prd.json` — update both when tasks move.

**Last Updated:** 2026-02-02
**Sprint:** Q1 2026

---

## Board Overview

```
+------------------+------------------+------------------+------------------+------------------+
|     BACKLOG      |      TO DO       |   IN PROGRESS    |    IN REVIEW     |       DONE       |
|   (Prioritized)  |  (Ready to Start)|   (Active Work)  |  (Needs Verify)  |   (Completed)    |
+------------------+------------------+------------------+------------------+------------------+
|                  |                  |                  |                  |                  |
| [P1] Layer-Aware | [P2] CHANGELOG   |                  |                  | [P0] Layer       |
| Coherence Impl   |                  |                  |                  | Validation       |
|                  | [P1] Python      |                  |                  |                  |
| [P1] BrainFlow   | Code Sync        |                  |                  | [P0] Editor      |
| Integration      |                  |                  |                  | Agent            |
|                  | [P2] MOABB       |                  |                  |                  |
| [P1] BCI         | Attack Scenarios |                  |                  | [P0] PM Agent    |
| Accessibility    |                  |                  |                  |                  |
|                  |                  |                  |                  | [P0] ONI Layer   |
| [P1] WCAG/ADA    |                  |                  |                  |                  |
| Compliance       |                  |                  |                  | Correction       |
|                  |                  |                  |                  |                  |
| [P2] Accessible  |                  |                  |                  | [P1] SIEM→NSAM   |
| Landing Site     |                  |                  |                  |                  |
|                  |                  |                  |                  | [P1] ONI_LAYERS  |
| [P2] MOABB       |                  |                  |                  | Reference        |
| Benchmarks       |                  |                  |                  |                  |
|                  |                  |                  |                  | ...+33 more      |
|                  |                  |                  |                  |                  |
+------------------+------------------+------------------+------------------+------------------+
     7 items            3 items           0 items           0 items           39 items
```

---

## Column Definitions

| Column | Entry Criteria | Exit Criteria |
|--------|----------------|---------------|
| **Backlog** | Idea captured, not yet prioritized | Priority assigned, dependencies clear |
| **To Do** | Prioritized, dependencies resolved, ready to start | Work begins |
| **In Progress** | Actively being worked on | Work complete, ready for review |
| **In Review** | Needs verification/testing | Exit condition verified |
| **Done** | Exit condition met, documented in prd.json | Learnings captured |

---

## Backlog (Prioritized)

### [P1] layer-aware-coherence-implementation ⭐ NEW
- **Description:** Implement the unified layer-aware coherence metric Cₛ(S) in Python using BrainFlow/Neuromore for data acquisition, MOABB for offline validation
- **Exit Condition:** `oni/coherence.py` exports `LayerAwareCoherence` class; computes Cₛ(S) on live or recorded EEG; validated against MOABB with precision/recall
- **Risk:** High (critical for framework credibility — moves from theory to implementation)
- **Dependencies:** moabb-coherence-benchmark
- **Libraries:** `brainflow`, `neuromore`, `mne-python`, `scipy`
- **Key subtasks:**
  1. Per-frequency STFT pipeline (`scipy.signal.stft`)
  2. Compute σ²φ(f), σ²τ(f), σ²γ(f) from consecutive windows
  3. Implement w(f,S) weighting function with per-layer spatial scales
  4. Compute Cₛ(S) = e^(−Σ_f w(f,S)·σ²(f)) in real-time
  5. Calibrate weighting parameters (α, δ) against MOABB baselines
  6. Benchmark: inject synthetic attacks, measure detection accuracy
  7. BrainFlow adapter for live streaming
  8. Neuromore integration for real-time neurofeedback display
- **Estimate:** Large effort

### [P1] brainflow-integration ⬆️ UPGRADED from P3
- **Description:** Add BrainFlow integration for real-time hardware support. BrainFlow provides uniform API for 20+ biosensor boards (OpenBCI, Muse, BrainBit, etc). Use as primary data acquisition layer for live Cₛ(S) computation.
- **Exit Condition:** `tara/data/brainflow_adapter.py` exists with OpenBCI Cyton support; can stream live EEG into coherence pipeline
- **Risk:** Medium (hardware dependency — need physical board for testing)
- **Dependencies:** layer-aware-coherence-implementation
- **Estimate:** Medium effort

### [P1] bci-accessibility-layer ⭐ NEW
- **Description:** Make the entire ONI GitHub Pages site accessible for P300/EEG-based BCI browser users who cannot scroll, hover, or use keyboard input. Implement a "BCI Mode" toggle that switches all pages to paginated menu navigation with large targets (80x80px min, 9 targets max per screen), disables all animations, replaces WebGL/SVG with static diagram fallbacks, and adds auto-narration for interactive visualizations. Also add `prefers-reduced-motion` support, semantic HTML/ARIA landmarks, and proper `<button>` elements throughout.
- **Exit Condition:** BCI Mode toggle visible on all pages; all content navigable via grid-based menu selection without scrolling, hovering, or keyboard; `prefers-reduced-motion` disables all animations; all interactive elements have `aria-label`; Lighthouse accessibility score ≥ 95
- **Risk:** Medium (large surface area across all viz pages, but no architectural changes needed)
- **Dependencies:** Site visualizations finalized (do this after all viz work is complete)
- **When:** After site is done — do not start until all visualization pages are finalized
- **Key subtasks:**
  1. Add `prefers-reduced-motion` media query to all pages (low effort, do first)
  2. Add semantic HTML landmarks + ARIA labels to all pages
  3. Replace all `<div onclick>` with `<button>` elements
  4. Build BCI Mode toggle component (persistent header element, first focusable item)
  5. Build paginated menu navigation system (replaces scrolling)
  6. Target sizing + spacing overrides in BCI mode (80x80px, 20px gaps, max 9 per screen)
  7. Static diagram fallbacks for WebGL (08) and SVG animations (10)
  8. Auto-narration mode for 08-oni-framework-viz and 10-attack-defense-flow (replaces manual play/step)
  9. Add site note: "This site is accessible via P300-based BCI browsers"
- **Estimate:** Large effort

### [P1] wcag-ada-compliance ⭐ NEW
- **Description:** Bring all GitHub Pages site pages (landing, visualizations hub, 12+ interactive viz, whitepaper, documentation) into WCAG 2.2 AA compliance. Addresses ADA Title II/III, Section 508, EN 301 549, and EAA requirements. Covers all disability types: visual (blindness, low vision, color blindness), auditory, motor/physical, cognitive/neurological, and seizure/vestibular.
- **Exit Condition:** `lang="en"` on all HTML; skip links on all pages; `<main>` landmark on all pages; all `<div onclick>` replaced with `<button>`; `prefers-reduced-motion` media query on all pages; `:focus-visible` styles on all pages; `aria-label` on all interactive elements; Lighthouse accessibility score >= 95 on all pages; axe-core 0 critical/serious violations
- **Risk:** Medium (many pages to update, but changes are systematic)
- **Dependencies:** bci-accessibility-layer (can be done in parallel — Phase 1-3 from ACCESSIBILITY.md)
- **When:** After site is done — implement alongside BCI accessibility
- **Key subtasks:**
  1. Phase 1 — Foundation: `lang`, viewport, `<title>`, `prefers-reduced-motion`, `<button>`, skip links, `<main>`, `:focus-visible`
  2. Phase 2 — Semantic: ARIA landmarks, heading hierarchy, `aria-label`, `aria-live`, SVG alt text, WebGL fallback
  3. Phase 3 — Keyboard & Motor: keyboard audit, trap prevention, target sizing (24px min), spacing
  4. Phase 6 — Verification: Lighthouse, axe-core, VoiceOver, NVDA, keyboard-only, 200% zoom
- **Reference:** `MAIN/governance/ACCESSIBILITY.md` (full requirements document)
- **Estimate:** Large effort

### [P2] accessible-landing-site ⭐ NEW
- **Description:** Build a separate accessible version of the ONI site at `docs/accessible/` for users who need simplified, no-JS, single-column, high-contrast content. Includes theme selector (light/dark/high-contrast), font size controls, BCI Mode toggle, and all core ONI content in accessible `<table>` format. Cross-linked from main site header/footer.
- **Exit Condition:** `docs/accessible/index.html` exists with no-JS core content; 14-layer model as accessible table; attack taxonomy as searchable table; "Accessible Version" link on all main site pages; `<link rel="alternate">` on all pages; theme and font size controls functional
- **Risk:** Medium (new pages to build, but content already exists to port)
- **Dependencies:** wcag-ada-compliance (main site should be compliant first)
- **When:** After WCAG/ADA compliance work is done
- **Key subtasks:**
  1. Create `docs/accessible/` directory with index, layers, threats, whitepaper, visualizations, about pages
  2. Port 14-layer model to accessible `<table>` with proper `<th>` headers
  3. Port 46-technique attack taxonomy to searchable accessible table
  4. Add theme selector (light/dark/high-contrast) with localStorage persistence
  5. Add font size controls (small/medium/large/extra-large)
  6. Add "Accessible Version" link to all main site page headers/footers
  7. Add `<link rel="alternate">` pointing to accessible version
- **Estimate:** Medium effort

### [P2] moabb-coherence-benchmark
- **Description:** Benchmark Cₛ accuracy against real MOABB EEG data
- **Exit Condition:** Benchmark results with precision, recall, F1 for attack detection
- **Risk:** Medium (validation critical for credibility)
- **Dependencies:** moabb-adapter-implementation ✓
- **Estimate:** Medium effort

### [P2] moabb-attack-scenarios
- **Description:** Create real-signal attack scenarios using MOABB data
- **Exit Condition:** 3+ attack scenarios tested: spike injection, frequency hijacking, noise masking
- **Risk:** Medium (demonstrates practical applicability)
- **Dependencies:** moabb-adapter-implementation ✓
- **Estimate:** Medium effort

### [P2] bci-macro-to-micro-visualization
- **Description:** Create animated Blender visualization showing macro-to-micro BCI interface (brain → region → neurons → synapses → neurotransmitters)
- **Exit Condition:** Blender animation file with seamless zoom from whole brain to molecular level
- **Risk:** Medium (engineering challenge to stitch scales)
- **Dependencies:** None
- **Estimate:** Large effort
- **Notes:**
  - Goal: Visualize how BCIs interface with the brain, where electrodes sit, which regions
  - Current tech limitation: BCIs use electrical stimulation, cannot directly stimulate neurotransmitters (VERIFIED)
  - Resources found:
    - brain2printAI: AI tool to convert MRI → 3D printable brain models (https://www.nature.com/articles/s41598-025-00014-5)
    - Free brain STL: https://www.cgtrader.com/free-3d-models/character/human-anatomy/brain-59cffe18-e669-4dae-a588-1f82cee6fd45
    - Molecular Nodes addon for Blender (neurotransmitter/molecule rendering)
    - PDB database for receptor structures (e.g., dopamine D2 receptor: 6CM4)
  - Approach: Programmatically stitch components across scales for seamless animation
  - Related: Research doc `autodidactive/neuroscience/brain-regions/cerebral-cortex/motor-cortex/Research-BCI_Mouse_Movement.md`
  - Visualization projects: `autodidactive/neuroscience/visualizing-the-mind/` (3D-mindmapper, 2D-mindmapper)

---

## To Do (Ready to Start)

### [P2] changelog-creation
- **Description:** Create CHANGELOG.md at repository root
- **Exit Condition:** `CHANGELOG.md` exists with semantic versioning
- **Risk:** Low
- **Dependencies:** None
- **Estimate:** Small effort

### [P1] python-code-sync
- **Description:** Verify `oni-framework/oni/layers.py` matches corrected ONI model
- **Exit Condition:** Layer definitions in Python match corrected ONI (L1-L7 OSI, L8-L14 Neural)
- **Risk:** High (code-docs mismatch causes confusion)
- **Dependencies:** oni-layer-correction ✓
- **Estimate:** Small effort

### [P2] moabb-attack-scenarios
- **Description:** Create real-signal attack scenarios using MOABB data
- **Exit Condition:** 3+ attack scenarios tested with real EEG
- **Risk:** Medium
- **Dependencies:** moabb-adapter-implementation ✓
- **Estimate:** Medium effort

---

## In Progress

*No active tasks*

---

## In Review

*No tasks awaiting verification*

---

## Done (Completed)

### Q1 2026 Completions

| Task ID | Description | Completed | Priority |
|---------|-------------|-----------|----------|
| layer-validation | All 14-layer tables match TechDoc | 2026-01-22 | P0 |
| editor-agent-implementation | Editor Agent with hybrid model | 2026-01-22 | P0 |
| pm-agent-implementation | PM Agent for task tracking | 2026-01-22 | P0 |
| oni-layer-correction | Correct ONI layers (L1-L7 OSI) | 2026-01-22 | P0 |
| siem-to-nsam-rename | Rename siem → nsam | 2026-01-22 | P1 |
| oni-layers-reference | Create ONI_LAYERS.md | 2026-01-22 | P1 |
| nsam-external-threats | Document external BCI threats | 2026-01-22 | P2 |
| images-organization | Copy images to resources | 2026-01-22 | P2 |
| readme-privacy-statement | Add privacy/ethics to README | 2026-01-22 | P0 |
| hourglass-diagram-prompt | ChatGPT visualization prompt | 2026-01-22 | P3 |
| related-work-documentation | RELATED_WORK.md | 2026-01-23 | P1 |
| lazaro-munoz-consent-framework | Informed consent framework | 2026-01-24 | P1 |
| lazaro-munoz-post-deployment | Post-deployment ethics | 2026-01-24 | P1 |
| lazaro-munoz-pediatric | Pediatric considerations | 2026-01-24 | P1 |
| lazaro-munoz-neuroethics-expansion | Stakeholder perspectives | 2026-01-24 | P2 |
| consent-validation-module | consent.py module | 2026-01-24 | P1 |
| neurosecurity-implementation | Kohno + BCI Anonymizer | 2026-01-23 | P1 |
| moabb-adapter-implementation | MOABB adapter for EEG | 2026-01-24 | P1 |
| pm-hub-readme | Project README dashboard | 2026-01-26 | P2 |
| github-pages-sri-fix | SRI hash fix for GitHub Pages | 2026-01-26 | P0 |
| pypi-security-scan | Bandit security scan + fixes | 2026-01-26 | P1 |
| whitepaper-integration | Whitepaper (markdown + HTML + CTA) | 2026-01-29 | P1 |
| mathematical-audit-corrections | Fix Shannon entropy, dispersion caveat, zero entropy | 2026-01-29 | P0 |
| unified-layer-aware-coherence-section | Whitepaper §8: Unified Cₛ(S) metric + physics chain | 2026-01-29 | P1 |
| equations-reference-document | TechDoc-Equations_Reference.md (14 equations) | 2026-01-29 | P1 |
| external-tools-reference | EXTERNAL_TOOLS.md — tools & libraries catalog | 2026-01-29 | P2 |
| github-pages-resources-update | 4 new resource cards on GitHub Pages | 2026-01-29 | P2 |
| immersive-3d-whitepaper-ui | 9 CSS/JS visual effects for QIF whitepaper | 2026-02-02 | P1 |
| plotly-interactive-figures | Migrate 14 matplotlib figures to Plotly (HTML) | 2026-02-02 | P1 |
| auto-dictation-engine | Web Speech API auto-narration on scroll | 2026-02-02 | P2 |
| security-hardening-all-sites | CSP + SRI on whitepaper + both GitHub Pages | 2026-02-02 | P0 |
| qif-neuroethics-document | 11 open ethics questions + regulatory analysis | 2026-02-02 | P1 |
| qif-lab-readme | As-code whitepaper system documentation | 2026-02-02 | P2 |
| kokoro-tts-audio-narration | Kokoro TTS audio narration (16 sections, 9.1 min) | 2026-02-02 | P1 |
| hourglass-scroll-effect | Per-section hourglass perspective on scroll | 2026-02-02 | P2 |
| collapsible-callouts | Click-to-expand/collapse callout boxes | 2026-02-02 | P2 |
| qif-field-notes-journal | QIF Field Notes personal research journal | 2026-02-02 | P1 |
| dynamic-roadmap-github-pages | Dynamic progress bar on GitHub Pages from prd.json | 2026-02-02 | P2 |
| whitepaper-makefile-pipeline | One-command build: render + audio + mp3 | 2026-02-02 | P2 |

**Total Completed:** 39 tasks

---

## WIP Limits

| Column | Limit | Current | Status |
|--------|-------|---------|--------|
| In Progress | 3 | 0 | OK |
| In Review | 2 | 0 | OK |

**Rule:** No new work starts if WIP limits exceeded.

---

## Swimlanes by Category

### Infrastructure & Tooling
```
Backlog: brainflow-integration
To Do: changelog-creation
Done: editor-agent, pm-agent, images-organization, pm-hub-readme, github-pages-sri-fix,
      pypi-security-scan, github-pages-resources-update, external-tools-reference,
      security-hardening-all-sites
```

### Code & Implementation
```
Backlog: layer-aware-coherence-implementation, moabb-benchmarks, moabb-attacks
To Do: python-code-sync, moabb-attack-scenarios
Done: siem-to-nsam, consent-validation-module, neurosecurity-implementation, moabb-adapter
```

### Documentation & Governance
```
Done: layer-validation, oni-layer-correction, oni-layers-reference, nsam-external-threats,
      readme-privacy-statement, related-work, consent-framework, post-deployment,
      pediatric-considerations, neuroethics-expansion, whitepaper-integration,
      mathematical-audit-corrections, unified-layer-aware-coherence-section,
      equations-reference-document, qif-neuroethics-document, qif-lab-readme
```

### Accessibility
```
Backlog: bci-accessibility-layer, wcag-ada-compliance, accessible-landing-site
```

### Visualization & UX
```
Done: hourglass-diagram-prompt, immersive-3d-whitepaper-ui, plotly-interactive-figures,
      auto-dictation-engine, kokoro-tts-audio-narration, hourglass-scroll-effect,
      collapsible-callouts, dynamic-roadmap-github-pages
```

### Build & Pipeline
```
Done: whitepaper-makefile-pipeline
```

### Research & Community
```
Done: qif-field-notes-journal
```

---

## Priority Legend

| Priority | Label | Meaning | SLA |
|----------|-------|---------|-----|
| **P0** | Critical | Blocks all work, security issue, major bug | Immediate |
| **P1** | High | Important feature, significant impact | This sprint |
| **P2** | Medium | Nice to have, incremental improvement | Next sprint |
| **P3** | Low | Future enhancement, exploration | Backlog |

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Tasks | 48 |
| Completed | 39 (81%) |
| In Progress | 0 |
| Pending | 9 |
| Blocked | 0 |

---

## Blocked Tasks

*No blocked tasks currently*

---

## Future Work (Icebox)

These are tracked in `prd.json` under `future_work`:

| ID | Title | Feasibility | Effort |
|----|-------|-------------|--------|
| future-neural-consent-publication | Neural Consent Publication | Practical | Medium |
| future-ai-attack-prediction | AI-Based Attack Prediction | Research-needed | Large |
| future-blog-paper-updates | Update existing publications | Practical | Medium |
| future-l11-l14-standards | L11-L14 Standards Development | Blocked-external | Large |

---

## How to Use This Board

### Moving Tasks

1. **Backlog → To Do:** When dependencies resolved and priority assigned
2. **To Do → In Progress:** When starting work (respect WIP limits)
3. **In Progress → In Review:** When work complete, needs verification
4. **In Review → Done:** When exit condition verified

### Syncing with prd.json

After moving tasks:
1. Update task `status` in `prd.json`
2. Add `completed_at` date for Done tasks
3. Add `learnings` for completed tasks
4. Update `metrics` section totals

### Adding New Tasks

1. Add to `prd.json` with unique ID
2. Add to Backlog section here
3. Assign priority (P0-P3)
4. Define exit condition
5. Identify dependencies

---

*Synced with: `prd.json` v0.6.0*
*Board Version: 1.3*
