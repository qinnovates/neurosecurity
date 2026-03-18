# src/ -- Astro Website Source

The qinnovate.com website. Built with Astro 5.x, React 19 islands, and TailwindCSS 4.

## Table of Contents
- [Structure](#structure)
- [File Tree](#file-tree)
- [Data Flow](#data-flow)
- [Key Patterns](#key-patterns)

## Structure

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| [`components/`](components/) | React/Astro UI components organized by feature | 26 root components + 15 feature subdirectories |
| [`data/`](data/) | Static data files (JSON/TS), auto-generated during prebuild | `qif-timeline.json`, `automation-registry.json` |
| [`hooks/`](hooks/) | React hooks | `useDuckDB.ts` (DuckDB-WASM integration) |
| [`layouts/`](layouts/) | Astro page layouts | `BaseLayout.astro`, `PageLayout.astro`, `PublicationLayout.astro` |
| [`lib/`](lib/) | Core utilities, KQL engine, data adapters | `kql-tables.ts`, `kql-engine.ts`, `threat-data.ts` |
| [`pages/`](pages/) | Routes (each `.astro` file = one URL) | 18 route directories + 6 root pages |
| [`styles/`](styles/) | Global CSS | `global.css` |

## File Tree

```
src/
├── content.config.ts          # Content collection definitions (blog, governance, research)
├── components/                # UI components (see components/README.md)
│   ├── atlas/                 # Neural atlas & threat visualization (14 files)
│   ├── bci/                   # BCI device explorer (5 files)
│   ├── case-study/            # Case study layouts (6 files)
│   ├── data-studio/           # Data studio & DuckDB console (5 files)
│   ├── neurosim/              # Attack simulator & impact chains (3 files)
│   ├── niss/                  # NISS scoring components (5 files)
│   ├── tara/                  # TARA viewer & search (2 files)
│   ├── whitepaper/            # Whitepaper renderer (10 files)
│   └── ... (26 root-level components)
├── data/                      # Static data (copied from datalake during prebuild)
├── hooks/                     # React hooks (useDuckDB.ts)
├── layouts/                   # Page layouts (Base, Page, Publication)
├── lib/                       # Core engine (see lib/README.md)
│   ├── kql-tables.ts          # Universal table builder
│   ├── kql-engine.ts          # Query engine (parser, executor)
│   └── ... (28 utility modules)
├── pages/                     # Routes (see pages/README.md)
│   ├── api/                   # Data endpoints
│   ├── atlas/                 # /atlas/* routes
│   ├── research/              # /research/* routes
│   ├── tools/                 # /tools/* routes
│   └── ... (18 route directories)
└── styles/
    └── global.css             # Global stylesheet
```

## Data Flow

```
datalake/*.json ──prebuild──> src/data/*.json ──kql-tables.ts──> KQL tables ──components──> UI
                                                  │
                                          kql-engine.ts
                                          (parser, executor,
                                           indexes, aliases)
```

All data access goes through the KQL engine. Components never read JSON directly.

## Key Patterns

- **Islands architecture**: Interactive React components hydrate inside static Astro pages
- **KQL-first data access**: All queryable data flows through `lib/kql-tables.ts` > `lib/kql-engine.ts`
- **Content collections**: Blog posts (`blogs/`), governance docs, and research papers are Astro content collections defined in `content.config.ts`
- **Feature directories**: Components are grouped by feature (`atlas/`, `niss/`, `tara/`), not by type
