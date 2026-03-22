# Claude-Specific Configuration

Read `AGENTS.md` for project context, commands, structure, and guidelines.
When entering any directory, read its `AGENTS.md` for local context. There are no subdirectory CLAUDE.md files — all directory context lives in AGENTS.md.

## Protocols Index

Domain-specific protocols load automatically via `.claude/rules/` when you work in relevant directories.

| Protocol | Rule File | Triggers On |
|----------|-----------|-------------|
| Change Propagation | `.claude/rules/propagation.md` | `datalake/**`, `src/data/**`, `src/lib/kql-*` |
| Sync Protocols | `.claude/rules/sync-protocols.md` | `QIF-RESEARCH-SOURCES`, `automation-registry`, `qif-timeline` |
| Registrar Update | `.claude/rules/registrar.md` | `qtara-registrar.json`, `tara-chains`, `qtara/**` |
| Derivation Log | `.claude/rules/derivation-log.md` | `QIF-DERIVATION-LOG`, `QIF-FIELD-JOURNAL`, `DECISION-LOG` |
| Citation Integrity | `.claude/rules/citation-integrity.md` | `research/paper/**`, `QIF-RESEARCH-SOURCES`, `research-registry` |
| AI Disclosure | `.claude/rules/ai-disclosure.md` | `research/paper/**`, `research/blog/**` |
| Whitepaper Archival | `.claude/rules/whitepaper-archival.md` | `src/pages/research/whitepaper/**` |
| AI Security Ethics | `.claude/rules/ai-security-ethics.md` | `model/**`, `governance/**`, `research/**` |

## claudeq Mode -- Live Derivation Journaling

When Kevin says "claudeq" or "start journaling", activate live derivation logging to `model/QIF-DERIVATION-LOG.md`.

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
