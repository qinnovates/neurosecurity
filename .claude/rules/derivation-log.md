---
paths:
  - "osi-of-mind/QIF-DERIVATION-LOG.md"
  - "osi-of-mind/QIF-FIELD-JOURNAL.md"
  - "governance/DECISION-LOG.md"
  - "governance/TRANSPARENCY.md"
---

# Auto-Track Protocol (Derivation Log)

## Derivation Log -- When and How

The derivation log (`osi-of-mind/QIF-DERIVATION-LOG.md`) is the single source of truth for framework decisions. `governance/DECISION-LOG.md` and `governance/TRANSPARENCY.md` are GENERATED from it -- do not edit them directly.

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
- What happened (decisions, builds, discoveries -- use tables for 5+ decisions)
- Human decisions explicitly identified (what Kevin chose, what was rejected)
- AI Collaboration section (model, role, cross-AI if applicable)

**Entry policy:** Normalize spelling and phrasing. Preserve meaning, decisions, and reasoning chains. Do not write verbatim transcript -- synthesize.

**Destinations (parallel, when triggered):**
1. `osi-of-mind/QIF-DERIVATION-LOG.md` -- curated entry (proposed at session end)
2. `osi-of-mind/QIF-FIELD-JOURNAL.md` -- personal/experiential observations (raw voice only, AI cannot write)
3. Daily memory log -- `[DECISION]` or `[DERIVATION]` tag (during session as decisions occur)
4. `osi-of-mind/QIF-RESEARCH-SOURCES.md` -- if any new external source was referenced
5. Run `npm run governance` after committing a new entry to regenerate DECISION-LOG.md and TRANSPARENCY.md

## Sensitive Information Filter (MANDATORY)

Before writing ANY derivation log entry, apply this filter:

**Tier 1 -- AUTO-REDACT (never write, no exceptions):**
- Email addresses, phone numbers, SSNs, financial account numbers
- API keys, tokens, credentials, private keys
- File paths containing usernames or emails (use `~/` or generic paths)
- IP addresses of research infrastructure
- IRB/ethics protocol numbers
- EEG subject identifiers (EP_C01, SUB-003, participant IDs)
- Corporate security assessment details from Kevin's professional work
- AWS/cloud credentials

**Tier 2 -- WARN-BEFORE-WRITE (ask Kevin first):**
- Unpublished vulnerability details (LSL CVE precedent)
- Personal medical details (ADHD, synesthesia -- OK in Field Journal, not in governance docs)
- Draft application materials (SOPs, personal essays)
- Collaborator personal details beyond published names
- Quorum swarm output containing any Tier 1 or Tier 2 content
- Specific institutional file paths from EEG datasets

**Tier 3 -- ALLOWED (safe, do not over-filter):**
- Published researcher names, Kevin Qi's name, AI model names
- Framework component names (QIF, NISS, TARA, NSP), technique IDs (QIF-T0001)
- DOIs, arXiv IDs, public GitHub URLs
- Architecture decisions, NISS scores, compression benchmarks
- DSM-5-TR categories as TARA mapping targets (not personal diagnoses)
- Public dataset names (CHB-MIT, ADHD Mendeley)

**Procedure:** Draft entry in working memory. Scan for Tier 1 (auto-redact). Scan for Tier 2 (ask Kevin). Write only after all flags are resolved. The pre-commit hook provides a second layer of defense for Tier 1 patterns.

## Governance Generation

`governance/DECISION-LOG.md` and `governance/TRANSPARENCY.md` are GENERATED from the derivation log. Do not edit them directly.

- `npm run decisions` -- regenerates DECISION-LOG.md from entries with RACI metadata
- `npm run transparency` -- regenerates TRANSPARENCY.md from AI Contribution metadata
- `npm run governance` -- runs both

Run `npm run governance` after adding a new derivation log entry before committing.

## Research Commit Messages (research-significant commits only)

```
[Action] [Scope]: Brief description

AI-Collaboration:
  Model: [model name]
  Role: [co-derivation | literature search | writing assist | code generation | peer review]
  Cross-AI: [other model -- role] (if applicable)
  Human-Decided: [list key human decisions]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
