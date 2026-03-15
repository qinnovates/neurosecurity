---
title: Decision Log
description: Rolling changelog of architectural decisions with RACI attribution
---

# Decision Log

Rolling changelog of architectural decisions, implementation choices, and their attribution.
Tracks WHO decided, WHO built, WHO reviewed — like a RACI matrix for every significant change.

**RACI Key:**
- **R** (Responsible) — Did the work
- **A** (Accountable) — Made the final decision
- **C** (Consulted) — Provided input that shaped the decision
- **I** (Informed) — Notified of the outcome

**Actor Key:**
- **KQ** — Kevin Qi (human)
- **Claude** — Claude Opus 4.6 (primary AI)
- **Quorum** — Quorum swarm (multi-agent review)
- **Quorum:DA** — Devil's Advocate agent specifically
- **Quorum:Sec** — Security Engineer agent
- **Quorum:Perf** — Performance Engineer agent
- **Quorum:Neuro** — Neuroethics Reviewer agent
- **Quorum:FE** — Frontend/React Architect agent
- **Quorum:DataEng** — Data Engineer agent
- **Quorum:DevOps** — DevOps/DataOps agent
- **Quorum:NDS** — Neuro Data Scientist agent

---

## 2026-03-15: Data Studio — Parquet Migration & Dataset Browser

### Session Overview
- **Duration:** Single session
- **Scope:** Full Data Studio build (Phases 1-3) + security review
- **Trigger:** KQ requested Parquet format introduction inspired by HuggingFace datasets

---

### Phase 0: Architecture Design (Quorum Swarm #1 — 8 agents)

| Decision | Chosen | Rejected | R | A | C | I |
|----------|--------|----------|---|---|---|---|
| Data format | Parquet (Zstd L3) | Keep JSON only | Quorum:DataEng | KQ | Quorum:DA | All |
| Query engine | Two-engine (hyparquet browse + DuckDB-WASM SQL) | DuckDB-WASM for everything | Quorum:Arch | KQ | Quorum:DA, Quorum:Perf | All |
| EEG data scope | Cohort aggregates in browser, per-subject as download | Per-subject in browser | Quorum:Sec, Quorum:NDS | KQ | Quorum:Neuro | All |
| Table library | TanStack Table (15KB) | AG Grid (100KB) | Quorum:FE | Claude | — | KQ |
| SQL editor | CodeMirror 6 (200KB) | Monaco (2MB+) | Quorum:FE | Claude | — | KQ |
| EEG chart library | uPlot (48KB) | Recharts (SVG, can't handle 160K points) | Quorum:FE | Claude | — | KQ |
| Parquet compression | Zstd level 3 | Snappy | Quorum:DataEng | Claude | Quorum:DevOps | KQ |
| Row group strategy | Single row group per file | Multiple (impossible at <10K rows) | Quorum:DataEng | Claude | — | KQ |
| DuckDB-WASM delivery | CDN (jsDelivr, no npm dep) | npm install (35MB in node_modules) | Claude | KQ | Quorum:Arch | — |
| Nested registrar handling | Bridge tables (flat) | LIST<STRUCT> (nested Parquet) | Quorum:DataEng | Claude | — | KQ |
| CI pipeline | GitHub Actions on shared/*.json change | Manual rebuild | Quorum:DevOps | Claude | — | KQ |
| EEG privacy | Grand averages only, strip all EDF headers | Per-subject with anonymization | Quorum:Sec | KQ | Quorum:NDS, Quorum:Neuro | All |

**Key dissent (Devil's Advocate):**
- "DuckDB-WASM is 34.6MB for 4.3MB of data — 8x overhead" → Resolved by two-engine strategy (95% never load WASM)
- "Parquet overhead on small files exceeds JSON" → Accepted; small files get REF badge, not hidden
- "SQL console answers a question nobody asked" → Accepted as valid concern; SQL console is opt-in, lazy-loaded
- "HuggingFace is the wrong reference architecture at this scale" → Partially accepted; built pragmatic version, not copy

---

### Phase 1: Performance Fix — Prop Serialization Elimination

| Change | What | R | A |
|--------|------|---|---|
| Identified 2-3MB prop serialization as #1 inefficiency | Performance audit of kql-tables.ts data flow | Quorum:Perf | Claude |
| Created generate-kql-json.mjs | Prebuild script exporting KQL tables as static JSON | Claude | KQ |
| Modified BciKql.tsx to self-fetch | tables prop optional, fetches /data/kql-tables.json on mount | Claude | KQ |
| Split impact_chains to lazy-load file | 1.8MB loaded only when user queries impact_chains table | Claude | KQ |
| Updated 6 Astro pages | Pass tables={{}} instead of tables={kqlTables} | Claude | KQ |

**Result:** 98% page weight reduction (2.3MB inline → ~50KB empty props + 558KB async fetch)

---

### Phase 2: Parquet Conversion + Data Studio Page

| Change | What | R | A |
|--------|------|---|---|
| Created generate-parquet.py | PyArrow conversion: 27 JSON → 31 Parquet (722KB total, 77% reduction) | Claude | KQ |
| Designed Parquet schema for registrar | Bridge tables: techniques, technique_dsm, technique_neurorights | Quorum:DataEng | Claude |
| Built /data-studio/ page | Astro page with dataset catalog, Quick Start code examples | Claude | KQ |
| Built DataStudioBrowser.tsx | React component: search, category filters, preview table, download links | Claude | KQ |

**Compression highlights (computed, not estimated):**
- impact_chains: 1,919KB → 15KB (99%)
- technique_dsm: 129KB → 5KB (96%)
- techniques: 145KB → 36KB (75%)

---

### Phase 3: EEG Data + SQL Console (3 parallel agents)

| Change | What | R | A |
|--------|------|---|---|
| Built process-eeg-to-parquet.py | MNE-Python pipeline: EDF/MAT → filter → epoch → PSD → Parquet | Claude (agent) | KQ |
| Added TARA mappings to 7 EEG datasets | Signal-level technique mappings with neuromodesty qualifiers | Claude | KQ |
| Built /data-studio/eeg/ page | EEG browser with condition filters, TARA links, frequency band reference | Claude (agent) | KQ |
| Built SQLConsole.tsx + useDuckDB.ts | Lazy-loaded DuckDB-WASM from CDN, query validation, CSV export | Claude (agent) | KQ |
| Added AAN TBR disclaimer | theta/beta ratio insufficient for ADHD diagnosis per AAN 2016 | Quorum:Neuro | Claude |

**Privacy controls (process-eeg-to-parquet.py):**
- Epoch-relative timestamps (no wall-clock)
- Anonymized subject IDs (MI_S01, EP_C01, etc.)
- Stripped: meas_date, subject_info, experimenter, description, proj_name, proj_id, device_info, file_id

---

### Security Review (Quorum Swarm #2 — 4 agents, 8 roles)

| Finding | Severity | Found by | Fixed by | Decision by |
|---------|----------|----------|----------|-------------|
| COPY/ATTACH/EXPORT bypass query validation | CRITICAL | Quorum:Sec | Claude | KQ |
| Double-quoted read_parquet paths bypass check | HIGH | Quorum:Sec | Claude | KQ |
| CDN version mismatch (@latest vs @1.29.0) | HIGH | Quorum:Sec | Claude | KQ |
| Promise.race doesn't cancel DuckDB query | MEDIUM | Quorum:Sec | Documented | KQ |
| 558KB fetched on every preview click (no cache) | HIGH | Quorum:Perf, Quorum:FE | Claude | KQ |
| CSV export revoke timing | MEDIUM | Quorum:FE | Claude | KQ |
| Singleton race in StrictMode | LOW | Quorum:FE | Documented (dev-only) | Claude |
| Incomplete EDF PII stripping | MEDIUM | Quorum:Sec | Claude | KQ |
| Preview shows KQL JSON, not Parquet | MEDIUM | Quorum:DA | Claude (disclaimer) | KQ |
| 1-row datasets clutter catalog | LOW | Quorum:DA | Claude (REF badge) | KQ |
| Missing "Redistributable only" EEG filter | LOW | Quorum:UX | Claude | KQ |
| ADHD TBR needs AAN disclaimer | LOW | Quorum:Neuro | Claude | KQ |
| All 6 Morse neuromodesty checks | PASS | Quorum:Neuro | N/A | N/A |

**Fixes applied:**
- P0 (Security): Query validation hardened, CDN pinned, double-quote bypass closed
- P1 (Performance): Fetch caching added, CSV timing fixed
- P2 (Quality): Schema disclaimer, REF badges, redistributable filter, EDF stripping, AAN disclaimer

---

### Unresolved / Deferred

| Item | Why deferred | Owner |
|------|-------------|-------|
| DuckDB-WASM end-to-end test in preview | Needs manual browser testing | KQ |
| SRI integrity hashes for WASM bundles | Need to compute from specific version | KQ |
| Promise.race query cancellation | DuckDB-WASM may not support cancel | Claude (research) |
| hyparquet for direct Parquet browsing | Waiting on adoption data — KQL JSON works for now | KQ |
| TanStack Table / CodeMirror 6 / uPlot | Not yet needed — current inline table + textarea works | KQ |
| Service worker for offline access | Overkill at current scale | — |

---

## How to Read This Log

Each entry follows this structure:
1. **Date + Title** — What happened
2. **Session Overview** — Scope, trigger, duration
3. **Decision Tables** — RACI attribution for each choice
4. **Dissent** — What the Devil's Advocate challenged (and whether it was accepted)
5. **Findings** — What review agents found
6. **Deferred** — What was intentionally not done (and why)

The goal is full attribution: every architectural decision traces back to a human decision-maker (A), an implementer (R), and the consultants who shaped it (C). This supports:
- Academic transparency (AI disclosure requirements)
- Governance audit trail (who approved what)
- Future maintainability (why was this choice made?)
