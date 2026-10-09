# Neurosecurity -- AI Agent Context

BCI security research: website (Astro 5 + React 19 + TailwindCSS 4), QIF model (specs, TARA, NISS, NSP), research data, governance, tools.

## Structure
- `src/` -- Astro website (TypeScript, KQL-first data via `kql-tables.ts`)
- `osi-of-mind/` -- QIF specs, whitepapers, derivation logs, NSP + Runemate (Rust), tools (neurowall, neurosim, macshield)
- `research/` -- Blog posts, academic paper, clinical notes
- `datalake/` -- Source of truth for all JSON data
- `governance/` -- Policy, ethics, process (DECISION-LOG + TRANSPARENCY auto-generated)
- `src/scripts/` -- Build + data pipelines
- `src/site/` -- GitHub Pages build output + static assets served at site root

## Key Commands
`npm run dev` | `npm run build` | `npm run health` (validate sync) | `npm run governance` (regen from derivation log) | `npm test` (unit tests) | `npm run check:model-page` (after build: fails if the TARA Lab page loads anything off-origin)
`npm run cve:coverage` (recompute derived counters in `datalake/cve-technique-mapping.json`) | `npm run cve:gaps` (regenerate `datalake/cve-coverage-gaps.json`) -- run both after editing the CVE mappings or the registrar
`npm run derive:pathway-bands` (rederive pathway band fields from the atlas region table) | `npm run compute:chains` (regenerate `datalake/impact-chains.json`) -- run both, in that order, after editing the atlas, the pathways or the registrar; `npm test` fails if either output is stale

## Conventions
Data changes go in `datalake/` then `npm run prebuild`. All QIF changes align with the 11-band hourglass. See README.md for full details.
