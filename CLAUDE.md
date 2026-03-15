# Qinnovate Project Guide

<!-- Decision Tree: Daily log = operational. Derivation log = research insight. Field journal = personal voice. Memory.md = lasting facts. -->

## Table of Contents
- [Commands](#commands)
- [Commit Prefix Convention](#commit-prefix-convention)
- [Multi-Agent Protocol](#multi-agent-protocol-shared-memory)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Guidelines](#guidelines)
- [Cross-AI Validation Protocol](#cross-ai-validation-protocol)
- [Auto-Track Protocol](#auto-track-protocol-academic-transparency)
- [Change Propagation Matrix](#change-propagation-matrix)
- [Sync Protocols](#sync-protocols)
- [Citation & Preprint Integrity](#citation--preprint-integrity-protocol)
- [AI Disclosure & Publication Compliance](#ai-disclosure--publication-compliance)
- [claudeq Mode](#claudeq-mode--live-derivation-journaling)
- [Whitepaper Version Archival](#whitepaper-version-archival-protocol)
- [Standards & Governance](#standards--governance-scale)

## Commands
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Updates**: `npm run fetch-news`
- **Type Check**: `npm run type-check`
- **Sync Context**: `npm run sync` (Refreshes this file)
- **Changelog**: `npm run changelog` (Generate changelog from git log; `--dry-run` to preview)
- **Impact Chains**: `npm run compute:chains` (Precompute impact_chains table from source JSON; `--dry-run` to preview)
- **Health Check**: `npm run health` (Validate change propagation — checks data sync, governance, counts, build staleness)

## Commit Prefix Convention
- `[Add]` -- New feature, page, or component (tier 2: changelog + blog draft)
- `[Update]` -- Significant enhancement (tier 2: changelog + blog draft)
- `[Research]` -- Research milestone, paper, validation (tier 3: changelog + blog + release)
- `[Release]` -- Version bump (tier 3: changelog + blog + release)
- `[Fix]` / `fix:` -- Bug fix (tier 1: changelog only)
- `docs:` -- Documentation (tier 1: changelog only)
- `chore:` -- Maintenance (tier 1: changelog only)
- `auto:` -- Automated (tier 0: skipped entirely)

## Multi-Agent Protocol (Shared Memory)
- **Source of Truth:** The `_memory/` directory is the shared sync point for all agents.
- **Protocol:** Read latest daily log > Read active context > Append updates > Respect file locks.
- **Location:** If `_memory` is a symlink (e.g., to cloud storage), treat it transparently as `_memory/`.
- **Security:** Never store API keys, credentials, or PII in memory logs.

## Project Structure
- `src/`: Astro website source
  - `pages/`: Routes
    - `api/`: Data endpoints (e.g. tara.json)
    - `TARA/[id].astro`: Dynamic Threat Pages
  - `components/`: React/Astro components
  - `layouts/`: Page layouts
  - `lib/`: Utility functions and constants
    - `kql-tables.ts`: Universal KQL table builder (data lake → flat tables)
    - `kql-engine.ts`: Query engine (parser, executor, indexes — zero React deps)
- `qif-framework/`: QIF specification + implementations
  - `nsp/`: Neural Sensory Protocol (Rust + spec)
    - `nsp-core/`: PQ-secure Rust implementation
  - `runemate/forge/`: Runemate DSL compiler (Rust)
  - `archive/oni-framework/`: Legacy ONI 14-layer model
- `governance/`: Policy, ethics, and process documents
  - `processes/`: Standards development lifecycle
- `shared/`: Cross-cutting data + tools (Source of Truth)
  - `qtara/`: Python SDK (pip install qtara)
  - `scripts/`: Data pipeline scripts (TARA, NISS, DSM-5, impact chains precompute)
  - `archive/`: Deprecated/merged data files
- `paper/`: Academic publications (preprint)
- `scripts/`: Site scripts + CI utilities
  - `verify/`: Citation & fact verification pipeline
- `tools/`: Security tools (macshield, neurowall)
- `docs/`: Built site / GitHub Pages output
- `blogs/`: Blog posts and case studies (Astro content collection `blog`)
  - Posts with `type: case-study` in frontmatter are case studies
  - All blog/case-study posts route to `/research/papers/[slug]/`
  - Case studies should be tagged with `case-study` in tags AND `type: case-study` in frontmatter

## Tech Stack
- Framework: Astro 5.x
- UI: React 19, TailwindCSS 4
- Language: TypeScript

## Guidelines
- Use Semantic HTML.
- Follow Tailwind v4 conventions.
- Update `shared/` JSON files for data changes, which are copied to `docs/data` during build.
- Documentation is a primary product; keep markdown clean and standard.
- **Epistemic Integrity:** See `rules/epistemic-integrity.md`. No hallucination. Confidence proportional to evidence. Theoretical/unvalidated work (e.g. NISS, QIF) must be labeled as such in all outward-facing text.
- **AI Security Ethics:** See `AI-instructions.md` (repo root). All AI conduct in this project must align with the AI Security Ethics principles: Asimov's Three Laws reframed for AI, consent as architecture, human-in-the-loop as non-negotiable, AI self-preservation in service of user safety, neural data at highest protection tier, and defensive framing only. These principles apply to all AI-generated code, content, analysis, and recommendations produced within this project. When in doubt, the Five Principles in Part II of AI-instructions.md govern.

## Auto-Track Protocol (Academic Transparency)

### Derivation Log — When and How

The derivation log (`qif-framework/QIF-DERIVATION-LOG.md`) is the single source of truth for framework decisions. `governance/DECISION-LOG.md` and `governance/TRANSPARENCY.md` are GENERATED from it — do not edit them directly.

**Cadence:** One entry per session (at most). Sessions with 0 framework-significant decisions produce 0 entries.

**The 3-Question Filter (apply continuously during session):**
1. Does this change the framework's structure, scope, taxonomy, or scoring?
2. Does this correct, retract, or supersede a previous claim?
3. Would a peer reviewer need to know this happened?

If any answer is yes for any decision during the session, note it internally and propose a single derivation log entry at session end. Kevin approves or skips.

**Kevin override:** Kevin can say "log this" or "derivation entry" at any time to force an entry. Kevin can say "skip the log" to suppress the end-of-session proposal.

**Entry template:**
```markdown
## Entry [N]: [Title] {#entry-[n]-[slug]}

**Date:** YYYY-MM-DD, ~HH:MM
**Classification:** VERIFIED | INFERRED | HYPOTHESIS | CORRECTION | PROCESS
**AI Systems:** [models, Quorum composition if used]
**Connected entries:** [links]
**RACI:** R: [who did the work] | A: KQ | C: [consulted] | I: [informed]
**AI Contribution Level:** AI-assisted | AI-generated | Human-only | Quorum-reviewed
```

**Entry body must include:**
- Context (what triggered this work)
- What happened (decisions, builds, discoveries — use tables for 5+ decisions)
- Human decisions explicitly identified (what Kevin chose, what was rejected)
- AI Collaboration section (model, role, cross-AI if applicable)

**Entry policy:** Normalize spelling and phrasing. Preserve meaning, decisions, and reasoning chains. Do not write verbatim transcript — synthesize.

**Destinations (parallel, when triggered):**
1. `qif-framework/QIF-DERIVATION-LOG.md` — curated entry (proposed at session end)
2. `qif-framework/QIF-FIELD-JOURNAL.md` — personal/experiential observations (raw voice only, AI cannot write)
3. Daily memory log — `[DECISION]` or `[DERIVATION]` tag (during session as decisions occur)
4. `qif-framework/QIF-RESEARCH-SOURCES.md` — if any new external source was referenced
5. Run `npm run governance` after committing a new entry to regenerate DECISION-LOG.md and TRANSPARENCY.md

### Sensitive Information Filter (MANDATORY)

Before writing ANY derivation log entry, apply this filter:

**Tier 1 — AUTO-REDACT (never write, no exceptions):**
- Email addresses, phone numbers, SSNs, financial account numbers
- API keys, tokens, credentials, private keys
- File paths containing usernames or emails (use `~/` or generic paths)
- IP addresses of research infrastructure
- IRB/ethics protocol numbers
- EEG subject identifiers (EP_C01, SUB-003, participant IDs)
- Corporate security assessment details from Kevin's professional work
- AWS/cloud credentials

**Tier 2 — WARN-BEFORE-WRITE (ask Kevin first):**
- Unpublished vulnerability details (LSL CVE precedent)
- Personal medical details (ADHD, synesthesia — OK in Field Journal, not in governance docs)
- Draft application materials (SOPs, personal essays)
- Collaborator personal details beyond published names
- Quorum swarm output containing any Tier 1 or Tier 2 content
- Specific institutional file paths from EEG datasets

**Tier 3 — ALLOWED (safe, do not over-filter):**
- Published researcher names, Kevin Qi's name, AI model names
- Framework component names (QIF, NISS, TARA, NSP), technique IDs (QIF-T0001)
- DOIs, arXiv IDs, public GitHub URLs
- Architecture decisions, NISS scores, compression benchmarks
- DSM-5-TR categories as TARA mapping targets (not personal diagnoses)
- Public dataset names (CHB-MIT, ADHD Mendeley)

**Procedure:** Draft entry in working memory. Scan for Tier 1 (auto-redact). Scan for Tier 2 (ask Kevin). Write only after all flags are resolved. The pre-commit hook provides a second layer of defense for Tier 1 patterns.

### Governance Generation

`governance/DECISION-LOG.md` and `governance/TRANSPARENCY.md` are GENERATED from the derivation log. Do not edit them directly.

- `npm run decisions` — regenerates DECISION-LOG.md from entries with RACI metadata
- `npm run transparency` — regenerates TRANSPARENCY.md from AI Contribution metadata
- `npm run governance` — runs both

Run `npm run governance` after adding a new derivation log entry before committing.

### Research Commit Messages (research-significant commits only)

```
[Action] [Scope]: Brief description

AI-Collaboration:
  Model: [model name]
  Role: [co-derivation | literature search | writing assist | code generation | peer review]
  Cross-AI: [other model — role] (if applicable)
  Human-Decided: [list key human decisions]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Change Propagation Matrix

When a file changes, these downstream files must be updated. Claude should proactively check and update them. Run `npm run health` to detect stale or mismatched data.

### When shared/*.json changes (any data file)
| Update | How | Automated? |
|--------|-----|-----------|
| docs/data/kql-tables.json | `npm run prebuild` (runs generate-kql-json.mjs) | Yes (prebuild) |
| docs/data/parquet/*.parquet | `npm run prebuild` (runs generate-parquet.py) | Yes (prebuild) |
| docs/data/parquet/catalog.json | `npm run prebuild` (runs generate-parquet.py) | Yes (prebuild) |
| src/lib/kql-tables.ts imports | Add import if new file; update builder function | Manual |
| DataStudioBrowser.tsx DESCRIPTIONS | Add description if new dataset | Manual |

### When shared/qtara-registrar.json changes (TARA techniques)
| Update | How | Automated? |
|--------|-----|-----------|
| All of the above, plus: | | |
| README.md technique count | Verify technique count references | Manual (npm run health warns) |
| shared/impact-chains.json | `npm run compute:chains` | Manual |
| shared/qtara/src/qtara/data/ | Copy registrar to SDK data dir | Manual |
| src/lib/threat-data.ts | Verify ThreatVector interface matches | Manual |

### When qif-framework/QIF-DERIVATION-LOG.md changes
| Update | How | Automated? |
|--------|-----|-----------|
| governance/DECISION-LOG.md | `npm run governance` | Semi-auto (run after commit) |
| governance/TRANSPARENCY.md | `npm run governance` | Semi-auto (run after commit) |
| governance/SHIP-LOG.md | Add entry manually if feature shipped | Manual |
| src/data/qif-timeline.json derivation_log_entries count | `npm run health` warns if stale | Manual |

### When a new page/component is created
| Update | How | Automated? |
|--------|-----|-----------|
| governance/SHIP-LOG.md | Add entry | Manual |
| CHANGELOG.md | Auto-generated on next commit | Yes (changelog workflow) |

### When shared/eeg-samples.json changes
| Update | How | Automated? |
|--------|-----|-----------|
| All shared/*.json propagation, plus: | | |
| EEGBrowser.tsx / EEGDatasetCard.tsx | Verify new fields are rendered | Manual |
| scripts/process-eeg-to-parquet.py | Add new dataset processing config | Manual |

### When package.json scripts change
| Update | How | Automated? |
|--------|-----|-----------|
| CLAUDE.md Commands section | Update command reference | Manual |
| README.md if command is user-facing | Update documentation | Manual |

### When .claude/rules/*.md changes
| Update | How | Automated? |
|--------|-----|-----------|
| Verify CLAUDE.md references are still valid | Check cross-references | Manual |
| _memory/MEMORY.md if rule affects persistent behavior | Update memory | Manual |

## Sync Protocols

Three project files must stay in sync with changes. All follow the same pattern: **when a relevant change occurs, update the file, update its metadata (date/counts), and verify with the associated script if one exists.**

### Research Sources (`qif-framework/QIF-RESEARCH-SOURCES.md`)
**When:** New citation in `paper/references.bib`, blog references research, NSP cites new RFC/NIST, new TARA technique references research, any new DOI/arXiv/RFC referenced for the first time.
**How:** Add to correct domain section (Quantum Physics, Neuroscience, BCI Technology, Cybersecurity, etc.) using table format `| ID | Citation | URL | Source | QIF Relevance |`. Update header date and Appendix statistics.
**IMPORTANT: Whenever a new citation or source is used anywhere in the project, ALL THREE citation stores must be updated:**
1. `qif-framework/QIF-RESEARCH-SOURCES.md` — living catalog with IDs, URLs, and relevance
2. `paper/references.bib` — BibTeX entry for LaTeX/preprint use
3. `shared/research-registry.json` — structured JSON registry (researchers, institutions, standards, legislation)

### Automation Registry (`src/data/automation-registry.json`)
**Script:** `scripts/update-automation-registry.mjs` | **CI:** `.github/workflows/update-registry.yml` (daily)
**When:** Workflow created/deleted/changed, script added to `scripts/`, hook modified in `.claude/hooks/`, automation status changes.
**How:** Add/modify entry with: id, name, description, trigger, type, source_file, status (`active`/`disabled`/`local_only`/`planned`), dependencies, outputs, category.

### Timeline (`src/data/qif-timeline.json`)
**Script:** `scripts/timeline-check.mjs` (use `--fix` to auto-update, `--dry-run` to preview) | **CI:** `.github/workflows/timeline-check.yml` (on push)
**When:** New version released, discovery/derivation changes framework, cross-AI validation results, preprint published, new tool/page ships, hardware validation, dataset expansion.
**Stats to update:** threat_techniques, bci_devices, brain_regions, physics_constraints, hourglass_bands, tara_tactics, neurorights_mapped, dsm5_diagnoses_mapped, research_sources, derivation_log_entries, field_journal_entries, blog_posts, cross_ai_validations, plus version fields.

### Registrar Update Protocol (`shared/qtara-registrar.json`)

**When:** New techniques added, fields renamed/added, taxonomy changes, NISS version updates, or any structural change to the TARA registrar.

**This is a large-scale update that touches the entire stack.** Follow this checklist in order:

```
1.  Branch:      git checkout -b feature-name
2.  Tag:         git tag pre-feature-name
3.  Script:      Write migration script (shared/scripts/migrate-*.py), run --dry-run first
4.  Source:      Update shared/qtara-registrar.json (source of truth)
5.  Chains:      Update shared/tara-chains.json if attack chains affected
6.  TypeScript:  src/lib/threat-data.ts → kql-tables.ts → kql-engine.ts → neurogovernance-data.ts
7.  Python:      shared/qtara/src/qtara/models.py → scripts → SDK → stix.py → cli.py
8.  Precompute:  Run all shared/scripts/ pipelines (impact chains, DSM mappings)
9.  SDK sync:    Copy registrar to shared/qtara/src/qtara/data/qtara-registrar.json
10. Pages:       Update Astro pages (atlas/tara/[id].astro, guardrails), API endpoints
11. Components:  Update React dashboard components if new fields need UI
12. Docs:        Changelog, timeline (qif-timeline.json), current whitepaper draft only
13. Taxonomy:    Verify domain×mode matrix has no empty cells (11 domains × 3 modes = 33 cells)
14. Validation:  Run registrar-sync-check workflow locally or via CI
15. Build:       npm run build && npm run type-check
16. Test:        pytest (SDK), KQL queries, API responses, visual check
17. PR:          Single atomic PR with all changes
```

**DO NOT TOUCH during registrar updates:**
- Old blog posts (archived content)
- Old whitepaper versions (`src/pages/research/whitepaper/v*.astro`, `docs/research/whitepaper/`)
- Published DOIs or Zenodo uploads
- Git history

**Key files in dependency order:**
1. `shared/qtara-registrar.json` — source of truth
2. `src/lib/threat-data.ts` — TypeScript adapter (ThreatVector interface)
3. `src/lib/kql-tables.ts` — KQL table builder (flattens JSON → queryable columns)
4. `src/lib/kql-engine.ts` — KQL engine (field aliases, indexes)
5. `shared/qtara/src/qtara/models.py` — Python SDK Pydantic models
6. `shared/scripts/compute-impact-chains.mjs` — precompute pipeline

**Field rename protocol:** When renaming a field (e.g., `attack` → `technique`):
- Keep old field as deprecated alias
- Add KQL field alias in `kql-engine.ts` so old queries still work
- Use fallback pattern everywhere: `t.technique || t.attack`
- New code references new field name only

## Citation & Preprint Integrity Protocol

This protocol exists because preprint v1.0 shipped with 3 fabricated citations. Every citation MUST be verified.

### Citation Rules
1. **Never trust AI-generated citations.** Verify every DOI, arXiv ID, author list, and title by resolving the link
2. **Verify method:** Crossref API (`https://api.crossref.org/works/DOI`), arXiv abstract page, or publisher page. Unresolvable DOI = fabricated
3. **Cross-AI validation does NOT substitute for verification.** Only a resolved URL counts
4. **BibTeX entries** must include `note = {Verified YYYY-MM-DD via [source]}` (or `AI-suggested, verified...` if from AI)

### Preprint Version Sync
1. Compile: `cd paper && make deploy`
2. Update version note in `paper/sections/09-limitations.tex`
3. Upload to Zenodo (all-versions DOI: 10.5281/zenodo.18640105)
4. Build site: `npm run build`
5. Commit and push
6. Verify live PDF at `https://qinnovate.com/papers/qif-bci-security-2026.pdf`

### DOI Convention
Always use the all-versions DOI (`10.5281/zenodo.18640105`) in public references. Version-specific DOIs only for historical records.

## AI Disclosure & Publication Compliance

AI tools cannot be authors. Every paper, preprint, and public post must include disclosure. Use `/ai-disclosure-compliance` skill for full checklist and venue-specific requirements.

**Key venue policies (Feb 2026):**

| Venue | Key Requirement |
|-------|-----------------|
| arXiv | Name tools, author responsibility statement, CS review/survey ban (Oct 2025) |
| ACM (WOOT, CCS) | State proportion of AI text, cannot post to ResearchGate/Academia.edu |
| IEEE (Graz BCI) | Name system, identify sections, describe level |
| USENIX/WOOT | No fully AI-generated sections, HotCRP written attestation |
| Science/AAAS | Near-ban on AI text, full prompts required |
| ICLR/ICML (2026) | Desk rejection for undisclosed AI, reviewer cross-enforcement |

**Full policy details:** `~/.claude/skills/ai-disclosure-compliance/references/venue-policies.md`

### Pre-Publication Checklist
1. AI tools NOT listed as authors
2. Disclosure section exists (Section 9.7 in preprint)
3. Tools named with versions
4. Sections identified, level described, proportion stated
5. Human-originated contributions explicitly stated
6. Author responsibility statement included
7. Transparency log URL provided (`governance/TRANSPARENCY.md`)
8. Citation fabrication history disclosed (v1.0 had 3 fabricated)

### Blog Posts
Footer: "Written with AI assistance (Claude). All claims verified by the author."

## claudeq Mode — Live Derivation Journaling

When a session uses the `claudeq` config (or Kevin says "claudeq"/"start journaling"), every exchange gets logged raw to `qif-framework/QIF-DERIVATION-LOG.md`.

### Activation Steps
1. Announce: "Derivation journal active. Tracking all exchanges to QIF-DERIVATION-LOG.md."
2. Determine next entry number from the log
3. Create entry header at TOP (reverse-chronological):
   ```markdown
   ## Entry [N]: [Topic TBD] {#entry-[n]-[slug]}
   **Date:** [YYYY-MM-DD], ~[HH:MM]
   **Classification:** [TBD]
   **AI Systems:** Claude Opus 4.6
   **Connected entries:** [fill as connections emerge]
   ```
4. Log every exchange with `[YYYY-MM-DD HH:MM]` timestamps
5. Kevin's words are COMPLETELY RAW. No corrections. No polish. No grammar fixes
6. Update entry title when topic becomes clear
7. At session end, add AI Collaboration section and update Entry Index table

### Rules
- Do NOT skip logging trivial exchanges
- Normalize spelling, grammar, and phrasing before committing — preserve meaning and decisions, not verbatim text
- Do NOT wait until end to write (log as you go)
- Do NOT create separate files (everything in QIF-DERIVATION-LOG.md)
- Standard triggers (glossary sync, research sources, etc.) still apply
- Exception: "incognito" exchanges or PII/credentials

## Whitepaper Version Archival Protocol

When a new whitepaper version ships, the previous version MUST be archived before publishing the new one. This is mandatory — no version is ever lost.

### Steps (every version bump):
1. **Copy current `index.astro`** to a versioned file: `src/pages/research/whitepaper/v{OLD_VERSION}.astro`
   - Example: when shipping v8.0, copy the current v7.1 index to `v7-1.astro` (already done)
   - Preserve the ENTIRE page — all content, components, styles. No truncation
2. **Update `WhitepaperVersionSelector.astro`** (`src/components/WhitepaperVersionSelector.astro`):
   - Add the new version as `current: true` at the top of the versions array
   - Set the old version to `current: false` with its archive href (`/research/whitepaper/v{VERSION}/`)
   - Every version ever published must remain in the selector list — never remove entries
3. **Update `index.astro`** with the new version content
4. **Verify all archive links work** after build (every `/research/whitepaper/v*/` URL must return 200)
5. **Static HTML archives** (v2, v3, v5) live in `docs/research/whitepaper/` and are copied to dist at build time

### Version selector rules:
- All versions listed in chronological order (newest first)
- Current version shows "CURRENT" badge
- Archive versions show "ARCHIVE" badge
- No external links (all archives are on-site)
- Working drafts are labeled as such in the note field

## Standards & Governance (Scale)
- **QIF (Security)**: All architectural changes must align with the 11-band hourglass model.
- **TARA (Threats)**: New techniques must be scored with NISS (Neural Impact Scoring System).
- **Governance**: Refer to `governance/` for ethics, consent, and regulatory compliance.
- **Scale**: This is a standards body. Changes affect the industry. Verification is critical.
