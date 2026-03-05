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
- [Sync Protocols](#sync-protocols)
- [Citation & Preprint Integrity](#citation--preprint-integrity-protocol)
- [AI Disclosure & Publication Compliance](#ai-disclosure--publication-compliance)
- [claudeq Mode](#claudeq-mode--live-derivation-journaling)
- [Standards & Governance](#standards--governance-scale)

## Commands
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Updates**: `npm run fetch-news`
- **Type Check**: `npm run type-check`
- **Sync Context**: `npm run sync` (Refreshes this file)
- **Changelog**: `npm run changelog` (Generate changelog from git log; `--dry-run` to preview)

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
- `qif-framework/`: QIF specification + implementations
  - `nsp/`: Neural Security Protocol (Rust + spec)
    - `nsp-core/`: PQ-secure Rust implementation
  - `runemate/forge/`: Runemate DSL compiler (Rust)
  - `archive/oni-framework/`: Legacy ONI 14-layer model
- `governance/`: Policy, ethics, and process documents
  - `processes/`: Standards development lifecycle
- `shared/`: Cross-cutting data + tools (Source of Truth)
  - `qtara/`: Python SDK (pip install qtara)
  - `scripts/`: Data pipeline scripts (TARA, NISS, DSM-5)
  - `archive/`: Deprecated/merged data files
- `paper/`: Academic publications (preprint)
- `scripts/`: Site scripts + CI utilities
  - `verify/`: Citation & fact verification pipeline
- `tools/`: Security tools (macshield, neurowall)
- `docs/`: Built site / GitHub Pages output

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

## Cross-AI Validation Protocol
After ANY cross-AI validation session, append a row to `governance/TRANSPARENCY.md` > Cross-AI Validation Sessions table BEFORE ending the session. Format: `| Date | Topic | AI Systems | Human Decision | Derivation Log Ref |`

## Auto-Track Protocol (Academic Transparency)

When ANY of these triggers occur, you MUST update the appropriate log:

**Triggers:** New hypothesis, cross-AI validation, literature gap, corrected claim, framework architecture change, boundary shift (Not Claimed/Established), user says "remember this"/"lightbulb", new attack technique or therapeutic mapping.

**Destinations:**
1. `qif-framework/QIF-DERIVATION-LOG.md` for framework insights
2. `qif-framework/QIF-FIELD-JOURNAL.md` for personal/experiential observations (raw voice only)
3. Daily memory log with tag `[DECISION]` or `[DERIVATION]`
4. `qif-framework/QIF-RESEARCH-SOURCES.md` if any new external source was referenced

**Entry must include:** Date/time, AI system(s) involved, human decision documented, what was accepted vs rejected, classification (VERIFIED / INFERRED / HYPOTHESIS).

**Entry policy:** Derivation log entries preserve meaning, decisions, and insights. Normalize spelling and phrasing before committing. See [claudeq Mode](#claudeq-mode--live-derivation-journaling) for full spec.

**Research Commit Messages** (research-significant commits only):
```
[Action] [Scope]: Brief description

AI-Collaboration:
  Model: [model name]
  Role: [co-derivation | literature search | writing assist | code generation | peer review]
  Cross-AI: [other model — role] (if applicable)
  Human-Decided: [list key human decisions]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

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

## Standards & Governance (Scale)
- **QIF (Security)**: All architectural changes must align with the 11-band hourglass model.
- **TARA (Threats)**: New techniques must be scored with NISS (Neural Impact Scoring System).
- **Governance**: Refer to `governance/` for ethics, consent, and regulatory compliance.
- **Scale**: This is a standards body. Changes affect the industry. Verification is critical.
