# src/ -- Astro Website Source

## Structure
- `pages/` -- Routes (Astro pages)
  - `api/` -- Data endpoints (e.g., tara.json)
  - `TARA/[id].astro` -- Dynamic Threat Pages
  - `research/whitepaper/` -- Whitepaper versions (see `.claude/rules/whitepaper-archival.md`)
- `components/` -- React/Astro components (organized by feature)
- `layouts/` -- Page layouts
- `lib/` -- Utilities, KQL engine, data adapters
- `data/` -- Static data files (JSON, copied from datalake during prebuild)
- `styles/` -- Global styles

## Conventions
- Astro 5.x with React 19 islands
- TailwindCSS 4 (use Tailwind v4 conventions)
- Semantic HTML
- KQL-first data access: all data flows through `kql-tables.ts` > `kql-engine.ts`
- Component organization: feature directories (e.g., `components/atlas/`, `components/tara/`)
- Blog/case-study posts: `type: case-study` in frontmatter + `case-study` tag, routes to `/research/papers/[slug]/`

## Key Files
- `lib/kql-tables.ts` -- Universal KQL table builder (data lake > flat tables). Source of truth for all queryable data
- `lib/kql-engine.ts` -- Query engine (parser, executor, indexes -- zero React deps)
- `lib/threat-data.ts` -- TypeScript adapter for TARA registrar (ThreatVector interface)

## Data Flow
```
datalake/*.json > prebuild copies to docs/data/ > kql-tables.ts builds tables > components query via KQL
```
