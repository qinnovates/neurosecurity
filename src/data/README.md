# src/data/ -- Static Data Files

JSON and TypeScript data files consumed by the KQL engine and site components. Most are auto-generated during prebuild from `datalake/` sources.

## Files

| File | Source | Purpose |
|------|--------|---------|
| `qif-timeline.json` | Manual + `scripts/timeline-check.mjs` | QIF development timeline with stats (techniques, devices, sources, etc.) |
| `automation-registry.json` | `scripts/update-automation-registry.mjs` | Registry of all automated workflows, scripts, and hooks |
| `bci-intel-feed.json` | `scripts/fetch-intel.mjs` (daily CI) | BCI intelligence feed data |
| `external-news-cache.json` | `scripts/fetch-news.mjs` (daily CI) | Cached external news articles |
| `intel-sources.json` | Manual | Intelligence source definitions |
| `milestones.json` | Manual | Project milestone markers |
| `convergence-data.ts` | Manual | Convergence visualization dataset |
| `archive/` | — | Archived data file versions |

Most files are auto-generated during `npm run prebuild` from `datalake/` sources. Edit the source in `datalake/`, not here.
