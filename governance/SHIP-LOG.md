---
title: "Ship Log"
description: "High-level feature tracker — what shipped, what's in progress, what's backlogged"
order: 6
---

# Ship Log

High-level tracker for features, infrastructure, and research milestones.
Updated each session. Source of truth for "what's the status of X?"

**Legend:** ✅ Shipped | 🚧 In Progress | 📋 Backlogged | ❌ Rejected/Deferred

---

## 2026-03-15: Data Studio + Parquet Datalake

| Feature | Status | What Was Done | Notes |
|---------|--------|--------------|-------|
| JSON prop serialization fix | ✅ Shipped | BciKql self-fetches from /data/kql-tables.json instead of 2-3MB inline props | 98% page weight reduction |
| Impact chains lazy loading | ✅ Shipped | 1.8MB loaded only when user queries impact_chains table | Split into separate JSON file |
| Parquet conversion pipeline | ✅ Shipped | 27 JSON → 31 Parquet files, 722KB total (77% reduction) | PyArrow, Zstd L3, single row groups |
| Data Studio catalog page | ✅ Shipped | /data-studio/ with 31 dataset cards, search, category filters, download links | Quick Start code examples for pandas/DuckDB/Polars |
| EEG sample browser | ✅ Shipped | /data-studio/eeg/ with 16 datasets, condition filters, TARA mappings | Frequency band reference component |
| TARA-EEG signal mappings | ✅ Shipped | 7 real EEG datasets mapped to TARA techniques with neuromodesty qualifiers | AAN TBR disclaimer on ADHD datasets |
| MNE-Python EEG pipeline | ✅ Shipped | EDF/MAT → filter → epoch → PSD → Parquet with full privacy controls | Motor imagery processed: 914 epochs, 1.75M rows |
| DuckDB-WASM SQL console | ✅ Shipped | Lazy-loaded from jsDelivr CDN, example queries, CSV export | Query validation hardened (P0 security fixes) |
| SQL query validation | ✅ Shipped | Blocks COPY/ATTACH/EXPORT/CREATE/ALTER/DROP + double-quote bypass | 3 critical vulns found by Quorum, all fixed |
| CDN version pinning | ✅ Shipped | JSDELIVR_BASE pinned to @1.29.0 (was @latest) | Supply chain risk closed |
| Fetch caching (DataStudioBrowser) | ✅ Shipped | useRef cache for kql-tables.json — single fetch per session | Was 558KB per preview click |
| CSV export timing | ✅ Shipped | URL.revokeObjectURL delayed 500ms | Prevents interrupted downloads |
| Schema disclaimer on preview | ✅ Shipped | "Preview from KQL layer, schema may differ from Parquet" | Addresses preview vs download mismatch |
| REF badge on micro-datasets | ✅ Shipped | Datasets with ≤5 rows get "REF" label | Prevents confusion on 1-row datasets |
| Redistributable EEG filter | ✅ Shipped | Checkbox filter in EEG browser | 11 of 16 datasets redistributable |
| EDF PII stripping expanded | ✅ Shipped | description, proj_name, proj_id, device_info, file_id now stripped | Security review finding |
| DECISION-LOG.md auto-generation | ✅ Shipped | npm run decisions generates from derivation log | 15 decisions extracted from 105 entries |
| TRANSPARENCY.md auto-generation | ✅ Shipped | npm run transparency generates from derivation log | Frontmatter matches Astro content schema |
| Governance pre-commit hook | ✅ Shipped | scripts/governance-precommit.sh scans for Tier 1 sensitive patterns | 13 pattern categories, whitelist for known-safe |
| CLAUDE.md Auto-Track rewrite | ✅ Shipped | 3-question filter, per-session cadence, sensitive info tiers | Replaces granular trigger list |
| Ship Log (this file) | ✅ Shipped | High-level feature tracker with status | You're reading it |
| SRI integrity hashes for WASM | 📋 Backlogged | Need to compute from specific DuckDB version | Low risk — CDN is pinned |
| DuckDB-WASM end-to-end test | 📋 Backlogged | Manual browser testing in preview mode | Must verify before enabling SQL console publicly |
| Promise.race query cancellation | 📋 Backlogged | DuckDB-WASM may not support cancel | Documented limitation |
| hyparquet for direct Parquet browsing | 📋 Backlogged | KQL JSON preview works; hyparquet would read Parquet directly | Waiting on adoption data |
| TanStack Table / CodeMirror 6 / uPlot | 📋 Backlogged | Current inline table + textarea works for MVP | Phase 4 if needed |
| Service worker for offline access | ❌ Deferred | Overkill at current scale | Reconsider if user base grows |
| Parquet as runtime browser format | ❌ Rejected | Devil's Advocate: Parquet overhead exceeds benefit at 4.3MB | Parquet is download + build format only |

---

## How to Update This File

Add a new date section at the top when a session produces shipped features.
Each row = one feature or decision.
Keep it scannable — title + status + one-line description + notes.
This is the "executive dashboard" — the derivation log has the deep context.
