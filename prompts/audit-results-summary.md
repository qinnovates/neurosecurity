# Three-Tool Audit Results — 2026-03-05

## Task 1: Consolidation (Gemini 2.5 Pro)
Full report: `prompts/audit-task1-consolidation-gemini.md`

## Task 2: Citation Verification (Claude Opus 4.6)
See below.

## Task 3: Validation & AI Transparency (Claude Opus 4.6)
See below.

---

## Critical Findings (Fix Immediately)

### 1. index.astro "Hardware Validation" — MISLEADING
- Lines ~182-201 claim "validates against real hardware" and "28 consumer sensor exploitation techniques validated with real devices"
- VALIDATION.md records 0 real hardware validations
- **This is the homepage. Most visible claim on the entire site.**

### 2. Neuralink electrode count — INCORRECT CITATION
- v5.astro line 235 attributes "1,024 electrodes at ~20 kHz" to the 2019 Musk/Neuralink JMIR paper
- That paper describes 3,072 electrodes across 96 threads (the R&D system)
- 1,024 electrodes is the N1 production chip (2024 PRIME study), not the 2019 paper
- Fix: cite Neuralink's 2024 PRIME study for N1 specs; use 2019 paper only for R&D platform

### 3. Universal negative without hedge — whitepaper index/v6/v7
- "No standardized framework exists to classify, score, or mitigate attacks on the human brain"
- v5.astro correctly uses "To our knowledge" — index/v6/v7 dropped the hedge
- Neuromodesty check #5 violation

### 4. ~20 research pages have zero AI disclosure
- Blog posts: 100% coverage
- about.astro, pitch.astro, governance: covered
- All core research/tool pages (framework, scoring, TARA, hourglass, guardrails, dashboard, nsp, runemate, all neuroethics/*): NONE

## High Priority

### 5. OECD "endorsed" overclaim — whitepaper index/v6/v7
- "The OECD endorsed them" — OECD's 2019 Recommendation preceded Ienca & Andorno and did not formally endorse their four rights
- Fix: "The OECD published neurotechnology governance guidelines (2019)"

### 6. "$5 billion deployed" — UNVERIFIED
- Whitepaper claims "$5 billion deployed into BCI companies" sourced to internal database
- Plausible but not independently verifiable. Should cite named funding rounds.

### 7. "9 market research firms" — UNVERIFIED
- index.astro footnote references "median estimate across 9 market research firms" but firms are not named

### 8. NSv2.1 "validated against FDA" — MISLEADING
- scoring.astro uses "validated against FDA device classifications" for internal simulation correlation
- Should say "internal simulation-based correlation"

### 9. Runemate figures without simulation qualifier — whitepaper
- "67.8% compression, 430μs compile+encrypt" at whitepaper line ~1180 lack "(simulation)" qualifier

### 10. "3.25% power overhead" still unqualified in some locations
- framework.astro and some whitepaper sections present it without "modeled" qualifier
- pitch.astro correctly says "modeled, not measured"

## Consolidation Proposal (Gemini)

Proposed 50%+ page reduction:
- Merge /explore + /lab → /tools hub
- Merge /governance + /neuroethics/* → single governance section (3 sub-pages)
- Merge /interface-risks/* + /threat-models/* + /signal-security/* → /threat-atlas + /scoring
- Merge /open-research/* + /research/* → single /research section
- Delete /pitch (PDF link only), /about/milestones (redirect), /learning (demote)
- Keep /atlas, /explorer, /framework, /glossary, /licensing, /index

## Transparency Standard (Proposed)

### Every page (via layout component):
"This project was developed with AI assistance (Claude, Gemini, ChatGPT). All architectural decisions, threat mappings, and scoring are the author's. AI contributions are documented in the Transparency Statement."
+ Links to: Transparency Statement | Derivation Log | Validation Status

### Research pages (additional banner):
"Research Status: Proposed framework. Simulation-validated where noted. No real hardware or human subject testing."

### Blog posts (maintain current):
"Written with AI assistance (Claude). All claims verified by the author." — already at 100%
