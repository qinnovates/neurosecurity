# src/pages/ -- Site Routes

Each `.astro` file or directory becomes a URL on qinnovate.com. Astro file-based routing.

## Table of Contents
- [Root Pages](#root-pages)
- [Route Directories](#route-directories)

## Root Pages

| File | Route | Purpose |
|------|-------|---------|
| `index.astro` | `/` | Homepage (also hosts BCI Vision toggle mode) |
| `framework.astro` | `/framework/` | QIF framework overview |
| `privacy.astro` | `/privacy/` | Privacy policy |
| `vision.astro` | `/vision/` | Vision statement |
| `rss.xml.ts` | `/rss.xml` | RSS feed generator |

## Route Directories

| Directory | Route | Purpose | Files |
|-----------|-------|---------|-------|
| `api/` | `/api/*` | Data endpoints (data-studio, impact-chains, kql-query, metadata) | 4 |
| `atlas/` | `/atlas/*` | Neural atlas: threat visualization, device explorer, risk matrix, interaction matrix | 10 |
| `bci/` | `/bci/*` | BCI overview, device database | 2+ |
| `data-studio/` | `/data-studio/*` | Data Studio (Parquet browser, DuckDB SQL console, EEG explorer) | 2 |
| `development/` | `/development/` | Development roadmap | 1 |
| `governance/` | `/governance/*` | Governance: decision log, transparency, neuroethics | 4 |
| `guardrails/` | `/guardrails/*` | Neuroethics guardrails, threat analysis, controls | 3 |
| `interface-risks/` | `/interface-risks/` | Neurotech interface risk assessment | 1 |
| `mission/` | `/mission/` | Mission statement | 1 |
| `neural-atlas/` | `/neural-atlas/` | Anatomical brain atlas | 1 |
| `neuroethics/` | `/neuroethics/` | Neuroethics frameworks | 1 |
| `news/` | `/news/*` | News feed, intel reports, timeline | 3 |
| `open-research/` | `/open-research/` | Open research portal | 1 |
| `research/` | `/research/*` | Research hub: papers, case studies, datasets, glossary, whitepaper versions | 11 |
| `security/` | `/security/` | Security overview | 1 |
| `signal-security/` | `/signal-security/` | Signal security details | 1 |
| `threat-models/` | `/threat-models/*` | Threat modeling: matrix, scenarios, tools | 4 |
| `tools/` | `/tools/*` | Tools index: neurosim, neurowall, qif-lidar, NISS scoring | 5 |
