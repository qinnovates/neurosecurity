# src/lib/ -- Core Utilities & Data Engine

The data engine powering all queryable content on qinnovate.com. Zero React dependencies -- pure TypeScript.

## Table of Contents
- [KQL Engine](#kql-engine)
- [Data Adapters](#data-adapters)
- [Constants & Reference Data](#constants--reference-data)
- [Feed System](#feed-system)

## KQL Engine

The KQL (Kusto Query Language) engine is the primary data access layer. All components query data through it.

| File | Purpose |
|------|---------|
| `kql-tables.ts` | Universal table builder -- transforms datalake JSON into flat, queryable tables |
| `kql-engine.ts` | Query engine: parser, executor, indexes, field aliases. Zero React deps |

**Data flow**: `datalake/*.json` > prebuild > `src/data/*.json` > `kql-tables.ts` builds tables > components query via KQL

## Data Adapters

| File | Purpose |
|------|---------|
| `threat-data.ts` | TypeScript adapter for TARA registrar (`ThreatVector` interface) |
| `atlas-data.ts` | Neural atlas reference data (brain regions, pathways) |
| `bci-data.ts` | BCI device specifications |
| `bci-directory-data.ts` | BCI device directory listings |
| `clinical-data.ts` | Clinical case study data |
| `neurogovernance-data.ts` | Governance framework reference |

## Constants & Reference Data

| File | Purpose |
|------|---------|
| `qif-constants.ts` | QIF framework constants (hourglass bands, scoring) |
| `nsp-constants.ts` | Neural Sensory Protocol constants |
| `neurowall-constants.ts` | Neurowall device specs |
| `bci-limits-constants.ts` | BCI performance limits |
| `brain-view-data.ts` | Brain visualization data |
| `glossary-constants.ts` | Glossary term definitions |
| `evidence-tiers.ts` | Evidence classification schema (STRONG/MODERATE/WEAK/UNVERIFIED) |
| `convergence-data.ts` | Convergence visualization data |
| `lens.ts` | Lens/theme utility functions |

## Feed System

| File | Purpose |
|------|---------|
| `feed-config.ts` | RSS/news feed configuration |
| `feed-types.ts` | Feed type definitions |
| `fetch-feeds.ts` | Feed fetching logic |
| `news-data.ts` | News source definitions |
| `niss-parser.ts` | NISS score parser utility |
