---
paths:
  - "osi-of-mind/QIF-DERIVATION-LOG.md"
  - "osi-of-mind/QIF-FIELD-JOURNAL.md"
  - "governance/DECISION-LOG.md"
  - "governance/TRANSPARENCY.md"
---

# Auto-Track Protocol (Derivation Log)

## Derivation Log -- When and How

The derivation log (`osi-of-mind/QIF-DERIVATION-LOG.md`) is public. Since 2026-10-16 it records
**major changes only**, as technical outcomes. `governance/DECISION-LOG.md` and
`governance/TRANSPARENCY.md` are generated from it -- do not edit them directly.

**Write an entry only for:** schema changes, taxonomy or status-vocabulary changes, identifier
changes, structural changes to the data lake, site or paper build, revamps, and corrections to
previously published claims. Routine fixes, refactors and content edits do not get an entry.

**Never write in an entry:** internal deliberation, who decided what, human-decisions tables,
reversals, options considered and rejected, AI-session or agent coordination, conversation, or
self-critique. Internal material lives in `_staging/` or the private vault, never in this log.

**Entry template:**
```markdown
## Entry [N]: [Title naming the change] {#entry-[n]-[slug]}

**Date:** YYYY-MM-DD
**Classification:** VERIFIED | INFERRED | HYPOTHESIS | CORRECTION | PROCESS
**AI Systems:** [models used]
**Connected entries:** [links]
**AI Contribution Level:** AI-assisted | AI-generated | Human-only (kept for AI-disclosure compliance)
```

**Entry body:** what changed, where (files, fields, scripts), resulting counts, and how it was
verified. Group by area (schema, identifiers, sources, build, infrastructure).

**Numbering:** check `origin/main` for the highest entry number before choosing N; branches can
collide.

**After writing:** run `npm run governance`, then `node src/scripts/timeline-check.mjs --fix`.

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
