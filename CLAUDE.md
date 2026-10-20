# Claude-Specific Configuration

Read `governance/CONTEXT.md` for project context, commands, structure, and guidelines.
When entering any directory, read its `CONTEXT.md` for local context. There are no subdirectory CLAUDE.md files — all directory context lives in CONTEXT.md.

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
| AI Security Ethics | `.claude/rules/ai-security-ethics.md` | `osi-of-mind/**`, `governance/**`, `research/**` |

## claudeq Mode -- retired 2026-10-16

Live journaling into the public derivation log is retired. The log records major changes only, as
technical outcomes (see `.claude/rules/derivation-log.md`). Conversation, raw notes and
deliberation are internal and go to the private vault or `_staging/`, never into this repository.
