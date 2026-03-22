# Neurosecurity -- AI Agent Context

BCI security research: website (Astro 5 + React 19 + TailwindCSS 4), QIF model (specs, TARA, NISS, NSP), research data, governance, tools.

## Structure
- `src/` -- Astro website (TypeScript, KQL-first data via `kql-tables.ts`)
- `model/` -- QIF specs, whitepapers, derivation logs, NSP + Runemate (Rust), tools (neurowall, neurosim, macshield)
- `research/` -- Blog posts, academic paper, clinical notes
- `datalake/` -- Source of truth for all JSON data
- `governance/` -- Policy, ethics, process (DECISION-LOG + TRANSPARENCY auto-generated)
- `src/scripts/` -- Build + data pipelines
- `src/site/` -- GitHub Pages build output + static assets served at site root

## Key Commands
`npm run dev` | `npm run build` | `npm run health` (validate sync) | `npm run governance` (regen from derivation log)

## Conventions
Data changes go in `datalake/` then `npm run prebuild`. All QIF changes align with the 11-band hourglass. See README.md for full details.
