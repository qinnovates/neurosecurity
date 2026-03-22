# Qinnovate -- AI Agent Context

BCI security research repo: website (Astro 5 + React 19 + TailwindCSS 4), framework specs (QIF, TARA, NISS, NSP), research data, governance, tools. Each subdirectory has its own `AGENTS.md`.

## Structure
- `src/` -- Astro website (TypeScript, KQL-first data via `kql-tables.ts`)
- `qif-framework/` -- QIF specs (`specs/`), whitepapers (`whitepapers/`), derivation logs, NSP + Runemate (Rust)
- `datalake/` -- Source of truth for all JSON data
- `paper/` -- Academic preprint (LaTeX)
- `tools/` -- neurowall, neurosim, macshield
- `scripts/` -- Build + data pipelines
- `governance/` -- Policy (`policy/`), ethics, process (DECISION-LOG + TRANSPARENCY auto-generated)
- `blogs/` -- Astro content collection (`type: case-study` routes to `/research/papers/`)
- `docs/` -- GitHub Pages build output (don't edit HTML) + working docs in `learn/`, `product/`, `research/`

## Key Commands
`npm run dev` | `npm run build` | `npm run health` (validate sync) | `npm run governance` (regen from derivation log)

## Conventions
- Commits: `[Add]`, `[Update]`, `[Research]`, `[Fix]`, `docs:`, `chore:`, `auto:`
- Data changes go in `datalake/` then `npm run prebuild`
- All QIF changes must align with the 11-band hourglass model
- New TARA techniques must be NISS-scored
- Epistemic integrity: no hallucination, confidence proportional to evidence
- AI ethics: 5 principles in `governance/policy/AI-ETHICS-PROPOSAL.md`
- Shared memory: `_memory/` -- never store secrets or PII

See README.md for full details.
