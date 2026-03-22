# Demo Atlas — Product Specification

**Date:** 2026-03-18
**Status:** APPROVED — ready for Phase 1 build
**Source:** Quorum ponder session + Kevin's input on auto-matching + query security

---

## What Is Demo Atlas?

A free web tool on qinnovate.com that lets researchers (security and clinical) explore BCI threat/therapeutic data through a unified workflow. The free tier of the Neurosecurity Appliance vision.

**Core value proposition:** Select a BCI device, condition, or TTP — and Demo Atlas automatically matches EEG signal patterns, TARA techniques, and clinical/security correlations. No queries needed. Power users get a hardened SQL/KQL console for custom exploration.

---

## Two Interaction Modes

### Mode 1: Auto-Matching (Primary UX)

User selects context → Demo Atlas correlates automatically:

```
User selects context (device / condition / TTP)
    ↓
Auto-match engine:
    → EEG signal patterns that correlate
      (e.g., theta elevation at Fz = ADHD = QIF-T0001)
    → TARA techniques that explain the mechanism
    → BCI devices where this pattern is observable
    → Clinical vs security framing of same data
    ↓
User drills into any match → evidence chain
```

This is Brain SIEM logic on sample data: correlate signals → classify patterns → map to techniques → surface findings.

### Mode 2: Query Console (Advanced Users)

Full SQL (DuckDB-WASM) and KQL access to all 31 Parquet datasets.

**Security requirements (mandatory):**
- Input sanitization on all user-provided SQL
- Parameterized query templates for common operations
- SQL blocklist enforced: COPY, ATTACH, EXPORT, LOAD, INSTALL statements blocked
- Double-quoted path bypass prevention (from Entry 99 security review)
- CDN version pinning for DuckDB-WASM (no @latest)
- No raw eval() of user input
- Query timeout (30s max execution)
- Results size cap (10,000 rows max return)
- All queries run client-side only — no server, no data leaves the browser

---

## User Personas and Flows

### Security Researcher

```
/demo-atlas/ → "Select a Device" (e.g., OpenBCI Cyton)
    → Device Profile (specs, channels, electrode type)
    → Auto-matched threats: 22 TARA techniques for this device's attack surface
    → Select technique → "How does this attack manifest in EEG?"
    → Auto-matched EEG patterns: signal characteristics for this technique
    → Drill into evidence chain: mechanism → cofactors → papers
    → [Optional] Query console for custom analysis
    → Export: threat report, filtered CSV/Parquet
```

### Clinician

```
/demo-atlas/ → "Select a Condition" (e.g., Parkinson's / dopamine)
    → Condition Profile (DSM-5 code, affected pathways)
    → Auto-matched therapeutics: tPBM, VNS, DBS, etc. with FDA status + evidence level
    → Cofactor dependencies (Fe2+, BH4, B6 for dopamine)
    → Auto-matched EEG data: datasets relevant to this condition
    → Dual-use view: same technique as threat AND therapy side by side
    → [Optional] Query console
    → Export: therapeutic summary
```

### Data Analyst

```
/demo-atlas/ → "Open Console"
    → Full SQL/KQL access to 31 datasets
    → Pre-populated query templates based on common research questions
    → Download results as CSV/Parquet
```

---

## Architecture

### Single React Island

One Astro page (`/src/pages/demo-atlas/index.astro`) with one React 19 island managing all panel state. URL query params for deep-linking.

```
/demo-atlas/                              — Hub
/demo-atlas/?device=openbci-cyton         — Device context
/demo-atlas/?condition=parkinsons         — Condition context
/demo-atlas/?technique=QIF-T0001         — Technique context
/demo-atlas/?view=console                — Query console
```

### Data Flow (Build-Time Injection, Client-Side Matching)

```
Build time: bci-landscape.json + qtara-registrar.json + eeg-samples.json
    → injected as React props
    → total payload <1MB

Client side: React island filters/correlates based on user context
    → no backend, no API calls, fully static
    → DuckDB-WASM loaded lazily for query console only
```

### Auto-Match Engine (Client-Side)

Pattern matching logic:

```typescript
// Device → Techniques
const matchedTechniques = techniques.filter(t =>
  device.tara_attack_surface.includes(t.id)
);

// Condition → Techniques
const matchedTherapeutics = techniques.filter(t =>
  t.tara?.clinical?.conditions?.includes(condition)
);

// Technique → EEG Datasets
const matchedEEG = eegSamples.filter(s =>
  s.taraId === technique.id || s.condition?.includes(condition)
);

// TTP/Category → Techniques
const matchedByCategory = techniques.filter(t =>
  t.ui_category === selectedCategory || t.tactic === selectedTactic
);

// Signal Pattern → TARA (from taraRelevance field)
// e.g., "Frontal theta elevation at Fz" → maps to QIF-T0001
const signalPatterns = eegSamples
  .filter(s => s.taraRelevance)
  .map(s => ({ dataset: s.name, pattern: s.taraRelevance, technique: s.taraId }));
```

---

## 8 Panels

| # | Panel | Purpose | Data Source |
|---|-------|---------|-------------|
| 0 | Hub | Entry point, 3 persona cards | Static |
| 1 | Device Picker | Browse/search 68 BCI devices | bci-landscape.json |
| 2 | Device Profile | Specs + auto-matched attack surface | bci-landscape.json |
| 3 | Condition Picker | Browse conditions grouped by DSM-5 | Derived from registrar |
| 4 | Therapeutic Profile | Auto-matched techniques + cofactors | registrar clinical.* fields |
| 5 | TARA Pattern Map | Auto-matched techniques with signal patterns | registrar + eeg-samples |
| 6 | Signal Explorer | EEG datasets filtered by context | eeg-samples.json |
| 7 | Query Console | SQL/KQL for advanced users (hardened) | DuckDB-WASM + Parquet |

---

## Security Requirements (Query Console)

From Entry 99 security review + secure coding rules:

1. **SQL Blocklist:** Block COPY, ATTACH, EXPORT, LOAD, INSTALL, CREATE, DROP, ALTER, INSERT, UPDATE, DELETE as statement-level keywords (not just function calls)
2. **Path injection prevention:** Block both single-quoted AND double-quoted file paths in read_parquet/read_csv
3. **CDN version pinning:** DuckDB-WASM loaded from exact version URL, not @latest
4. **No eval():** Query string never passed to eval/new Function
5. **Timeout:** 30-second query execution limit
6. **Row cap:** 10,000 rows max in result set
7. **Client-only:** All execution in browser WebAssembly, zero server calls
8. **CSP headers:** Restrict script-src to self + pinned CDN origins

---

## Implementation Phases

| Phase | Scope | Est. Sessions |
|-------|-------|--------------|
| **1: Core Shell** | Astro page, React island, Hub, Device Picker, Device Profile, TARA Pattern Map (auto-matched), URL state, context sidebar | 2-3 |
| **2: Clinical Path** | Condition Picker, Therapeutic Profile, Dual-Use Comparison, Signal Explorer with auto-matching | 2 |
| **3: Query + Export** | Hardened DuckDB console, pre-populated templates, CSV/Parquet export | 1 |
| **4: Polish** | Signal frequency viz, upload EEG, PDF reports, mobile responsive, NISS calculator | Ongoing |

---

## Product Tier Split

| Feature | Demo Atlas (Free) | Neural Atlas (Paid, Future) |
|---------|------------------|---------------------------|
| TARA techniques | All 161, browsable | All + custom technique creation |
| EEG data | 28 sample datasets | Live BCI signal processing |
| Auto-matching | Pre-computed patterns | Real-time pattern detection |
| Devices | 68 devices, specs only | Device connection + live data |
| Query console | Sample data only | Full datalake + your data |
| Coherence Metric (Cs) | Explained, not computed | Live computation from your signals |
| Neural Firewall | Described | Active at I0 boundary |

---

## Connected To

- MEMORY: neurosim-product-split.md (product tier split decision)
- Derivation Log Entry 99 (Data Studio build, DuckDB security review)
- Derivation Log Entry 100-101 (dopamine research, TARA expansion)
- North Star: Neurosecurity Appliance (Brain SIEM + Brain Firewall)
