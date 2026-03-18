# Qinnovate Project Guide

<!-- Domain-specific protocols are in .claude/rules/ and load automatically
     when working in relevant directories. See Protocols Index below. -->

## Commands
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Updates**: `npm run fetch-news`
- **Type Check**: `npm run type-check`
- **Sync Context**: `npm run sync` (Refreshes this file)
- **Changelog**: `npm run changelog` (`--dry-run` to preview)
- **Impact Chains**: `npm run compute:chains` (`--dry-run` to preview)
- **Health Check**: `npm run health` (validates sync, data, build staleness)
- **Governance**: `npm run governance` (regenerates DECISION-LOG.md, TRANSPARENCY.md)

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
- **Source of Truth:** `_memory/` directory is the shared sync point for all agents.
- **Protocol:** Read latest daily log > Read active context > Append updates > Respect file locks.
- **Location:** If `_memory` is a symlink (e.g., to cloud storage), treat it transparently as `_memory/`.
- **Security:** Never store API keys, credentials, or PII in memory logs.

## Project Structure
- `src/` -- Astro website source (see `src/CLAUDE.md`)
- `qif-framework/` -- QIF specification + implementations (see `qif-framework/CLAUDE.md`)
- `datalake/` -- Cross-cutting data + tools, source of truth (see `datalake/CLAUDE.md`)
- `paper/` -- Academic publications, preprint (see `paper/CLAUDE.md`)
- `tools/` -- Security tools: neurowall, neurosim, macshield (see `tools/CLAUDE.md`)
- `scripts/` -- Site scripts + CI utilities (see `scripts/CLAUDE.md`)
- `governance/` -- Policy, ethics, process documents (see `governance/CLAUDE.md`)
- `blogs/` -- Blog posts and case studies (Astro content collection `blog`)
  - Posts with `type: case-study` in frontmatter + `case-study` tag route to `/research/papers/[slug]/`

## Tech Stack
- Framework: Astro 5.x
- UI: React 19, TailwindCSS 4
- Language: TypeScript
- Data: KQL-first architecture (`kql-tables.ts` > `kql-engine.ts`)

## Guidelines
- Use Semantic HTML
- Follow Tailwind v4 conventions
- Update `datalake/` JSON files for data changes (copied to `docs/data` during build)
- Documentation is a primary product; keep markdown clean and standard
- **Epistemic Integrity:** See global `rules/epistemic-integrity.md`. No hallucination. Confidence proportional to evidence
- **AI Security Ethics:** See `AI-instructions.md` (repo root). Five principles govern all AI conduct in this project

## Protocols Index

Domain-specific protocols load automatically via `.claude/rules/` when you work in relevant directories. Manual reference:

| Protocol | Rule File | Triggers On |
|----------|-----------|-------------|
| Change Propagation | `.claude/rules/propagation.md` | `datalake/**`, `src/data/**`, `src/lib/kql-*` |
| Sync Protocols | `.claude/rules/sync-protocols.md` | `QIF-RESEARCH-SOURCES`, `automation-registry`, `qif-timeline` |
| Registrar Update | `.claude/rules/registrar.md` | `qtara-registrar.json`, `tara-chains`, `qtara/**` |
| Derivation Log | `.claude/rules/derivation-log.md` | `QIF-DERIVATION-LOG`, `QIF-FIELD-JOURNAL`, `DECISION-LOG` |
| Citation Integrity | `.claude/rules/citation-integrity.md` | `paper/**`, `QIF-RESEARCH-SOURCES`, `research-registry` |
| AI Disclosure | `.claude/rules/ai-disclosure.md` | `paper/**`, `blogs/**` |
| Whitepaper Archival | `.claude/rules/whitepaper-archival.md` | `src/pages/research/whitepaper/**` |
| AI Security Ethics | `.claude/rules/ai-security-ethics.md` | `qif-framework/**`, `governance/**`, `paper/**`, `blogs/**` |

## claudeq Mode -- Live Derivation Journaling

When Kevin says "claudeq" or "start journaling", activate live derivation logging to `qif-framework/QIF-DERIVATION-LOG.md`.

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
- Normalize spelling, grammar, and phrasing before committing -- preserve meaning and decisions, not verbatim text
- Do NOT wait until end to write (log as you go)
- Do NOT create separate files (everything in QIF-DERIVATION-LOG.md)
- Standard triggers (glossary sync, research sources, etc.) still apply
- Exception: "incognito" exchanges or PII/credentials

## Standards & Governance
- **QIF (Security)**: All architectural changes must align with the 11-band hourglass model
- **TARA (Threats)**: New techniques must be scored with NISS
- **Governance**: Refer to `governance/` for ethics, consent, and regulatory compliance
- **Scale**: This is a standards body. Changes affect the industry. Verification is critical
