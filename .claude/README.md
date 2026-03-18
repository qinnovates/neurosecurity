# .claude/ -- Agentic AI Infrastructure

Configuration for Claude Code's agentic AI scaffold. Rules load automatically based on file context. See [SCAFFOLD-LOG.md](../governance/SCAFFOLD-LOG.md) for architecture decisions.

## Table of Contents
- [Structure](#structure)
- [How It Works](#how-it-works)
- [Rules](#rules)
- [Agents](#agents)

## Structure

```
.claude/
├── rules/                         # Path-scoped behavior rules (auto-loaded)
│   ├── propagation.md             # Change propagation matrix
│   ├── sync-protocols.md          # Citation/timeline/registry sync
│   ├── registrar.md               # TARA registrar update checklist
│   ├── derivation-log.md          # Auto-track protocol + sensitive info filter
│   ├── citation-integrity.md      # Citation verification protocol
│   ├── ai-disclosure.md           # Publication compliance
│   ├── whitepaper-archival.md     # Whitepaper version archival
│   └── ai-security-ethics.md      # AI ethics gateway
└── agents/
    └── data-pipeline.md           # Data pipeline specialist agent
```

## How It Works

Each rule file uses `paths:` YAML frontmatter to declare which file patterns trigger it. When Claude reads or edits a matching file, the rule loads automatically. No manual invocation needed.

Example: editing `datalake/qtara-registrar.json` triggers both `registrar.md` and `propagation.md`.

## Rules

| Rule | Triggers On | Purpose |
|------|-------------|---------|
| `propagation.md` | `datalake/**`, `src/data/**`, `src/lib/kql-*` | What to update when data files change |
| `sync-protocols.md` | `QIF-RESEARCH-SOURCES`, registries, timeline | Keep 3 citation stores in sync |
| `registrar.md` | `qtara-registrar.json`, `qtara/**` | 17-step TARA registrar update checklist |
| `derivation-log.md` | `QIF-DERIVATION-LOG`, governance docs | Research decision tracking + PII filter |
| `citation-integrity.md` | `paper/**`, research registry | Citation verification (anti-hallucination) |
| `ai-disclosure.md` | `paper/**`, `blogs/**` | Publication AI disclosure compliance |
| `whitepaper-archival.md` | `src/pages/research/whitepaper/**` | Whitepaper version archival protocol |
| `ai-security-ethics.md` | `qif-framework/**`, `governance/**` | AI Security Ethics framework gateway |

## Agents

| Agent | Purpose |
|-------|---------|
| `data-pipeline.md` | Specialist for datalake operations, KQL generation, Parquet pipelines, registrar updates |
