# src/ -- Astro Website Source

## Structure
- `pages/` -- Routes (Astro pages, including `api/`, `TARA/[id].astro`, `research/whitepaper/`)
- `components/` -- React/Astro components (organized by feature)
- `layouts/` -- Page layouts
- `lib/` -- Utilities, KQL engine (`kql-tables.ts`, `kql-engine.ts`), data adapters
- `data/` -- Static data files (JSON, copied from datalake during prebuild)
- `styles/` -- Global styles
- `scripts/` -- Build + data pipelines
- `site/` -- Built output + static assets served at site root

## Conventions
- Astro 5.x + React 19 islands + TailwindCSS 4
- KQL-first data access: all data flows through `kql-tables.ts` > `kql-engine.ts`
- Blog/case-study posts: `type: case-study` in frontmatter routes to `/research/papers/[slug]/`

## Data Flow
`datalake/*.json` > prebuild copies to `src/site/data/` > `kql-tables.ts` builds tables > components query via KQL
